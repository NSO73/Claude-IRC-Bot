import { checkAuth } from './services/auth.js';
import { ask } from './services/claude.js';
import { registerTask, unregisterTask, cancelTask, cancelAllTasks, listTasks, countTasksByNick } from './services/tasks.js';
import { splitMessage } from './irc/splitter.js';
import { handleIrcCommand, isIrcCommand, getHelp } from './irc/commands.js';
import { isValidProjectName, listProjects, ensureProject, deleteProject, getProjectPrompt, setProjectPrompt } from './services/sessions.js';
import { searchYoutube, extractVideoIds, getVideoInfo } from './services/youtube.js';
import { hasPlan, getPlan, createPlan, updatePlan, cancelPlan, pushContext, formatPlan, isGoMessage } from './services/plan.js';
import { updateSeen, getPendingTells, closeMemory } from './services/memory.js';
import { createPaste } from './services/paste.js';
import { buildConnectOpts } from './irc/client.js';
import { t } from './lang/index.js';

export function setupBot(client, config) {
  const activeProjects = new Map();
  let nickPattern = null;
  let shuttingDown = false;

  // --- Utilities ---

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function claudeConfig(modelOverride) {
    return { ...config.claude, model: modelOverride || config.claude.model };
  }

  function pendingNotice(target, taskId) {
    const tag = taskId != null ? ` [#${taskId}]` : '';
    client.action(target, t('thinking', { tag }));
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function updateNickPattern(nick) {
    nickPattern = new RegExp(`^${escapeRegex(nick)}[,:;]?\\s+`, 'i');
  }

  // --- Core helpers ---

  async function withTask(nick, target, desc, spawnFn) {
    const max = config.claude.maxConcurrentPerUser || 3;
    if (countTasksByNick(nick) >= max) {
      client.say(target, t('taskLimit', { max }));
      return null;
    }
    const { promise, abort } = spawnFn();
    const taskId = registerTask(nick, desc, abort);
    pendingNotice(target, taskId);
    try {
      return await promise;
    } catch (err) {
      if (err.message === 'Cancelled' || err.name === 'AbortError') {
        client.say(target, t('taskAborted', { id: taskId }));
      } else {
        console.error('Claude error:', err.message);
        client.say(target, t('error', { msg: err.message.slice(0, 100) }));
      }
      return null;
    } finally {
      unregisterTask(taskId);
    }
  }

  async function sendReply(target, lines, { paste = false } = {}) {
    const arr = Array.isArray(lines) ? lines : splitMessage(lines);
    const threshold = config.paste?.threshold;
    if (paste && threshold && arr.length > threshold) {
      const raw = Array.isArray(lines) ? lines.join('\n') : lines;
      try {
        const url = await createPaste(raw);
        client.say(target, url);
        return;
      } catch (err) {
        console.error('Paste failed, fallback IRC:', err.message);
      }
    }
    for (let i = 0; i < arr.length; i++) {
      client.say(target, arr[i]);
      if (i < arr.length - 1) await delay(config.irc.floodDelay || 1000);
    }
  }

  async function requireAuth(nick, target) {
    const result = await checkAuth(
      client, nick, config.auth.allowedNicks, config.auth.requireIdentified
    );
    if (!result.authorized) {
      if (config.auth.denyMessage) client.say(target, config.auth.denyMessage);
      console.log(`Auth denied for ${nick}: ${result.reason}`);
    }
    return result;
  }

  // --- Claude handlers ---

  async function handleClaude(nick, target, question, { modelOverride, taskPrefix = '!c' } = {}) {
    const projectName = activeProjects.get(nick);
    const cfg = claudeConfig(modelOverride);
    const cwd = projectName ? ensureProject(projectName) : undefined;

    const desc = projectName
      ? `[${projectName}] ${taskPrefix} ${question.slice(0, 40)}`
      : `${taskPrefix} ${question.slice(0, 50)}`;

    const reply = await withTask(nick, target, desc, () => ask(question, cfg, [], { cwd, queryTimeout: config.claude.queryTimeout }));
    if (reply === null) return null;
    if (!reply) { client.say(target, t('emptyReply')); return null; }

    const displayReply = projectName ? `[${projectName}] ${reply}` : reply;
    await sendReply(target, displayReply, { paste: true });
    return reply;
  }

  async function handleRefinePlan(nick, target, feedback) {
    const plan = getPlan(nick);
    if (!plan) return;

    pushContext(nick, 'user', feedback);
    const cfg = claudeConfig('opus');
    const reply = await withTask(nick, target, 'plan: feedback', () => ask(feedback, cfg, plan.context, { queryTimeout: config.claude.queryTimeout }));
    if (reply === null) return;
    if (!reply) { client.say(target, t('emptyReply')); return; }

    pushContext(nick, 'assistant', reply);
    updatePlan(nick, reply);
    await sendReply(target, reply, { paste: true });
    client.say(target, t('planRefineHint'));
  }

  async function handleExecutePlan(nick, target) {
    const plan = getPlan(nick);
    if (!plan) {
      client.say(target, t('planNone'));
      return;
    }

    const execPrompt = `Le plan a été validé. Exécute-le maintenant de façon concise (style IRC). Voici le plan final :\n\n${plan.plan}`;
    pushContext(nick, 'user', execPrompt);

    const cfg = claudeConfig('opus');
    const projectName = activeProjects.get(nick);
    const cwd = projectName ? ensureProject(projectName) : undefined;

    const reply = await withTask(nick, target, 'plan: exécution', () => ask(execPrompt, cfg, plan.context, { cwd, queryTimeout: config.claude.queryTimeout }));
    if (reply === null) return;
    if (!reply) { client.say(target, t('emptyReply')); return; }

    cancelPlan(nick);
    await sendReply(target, reply, { paste: true });
    client.say(target, t('planExecuted'));
  }

  // --- Command handlers ---

  function cmdWhoami(nick, target, _args, auth) {
    const status = auth.authorized ? t('authorized') : t('unauthorized');
    if (auth.account) {
      client.say(target, t('whoamiIdentified', { nick, account: auth.account, status }));
    } else if (config.auth.requireIdentified) {
      client.say(target, t('whoamiNotIdentified', { nick, status }));
    } else {
      client.say(target, t('whoamiBasic', { nick, status }));
    }
  }

  async function cmdYoutube(nick, target, args) {
    if (!args) { client.say(target, t('ytUsage')); return; }
    try {
      const result = await searchYoutube(args);
      if (!result) {
        client.say(target, t('ytNoResult'));
      } else {
        client.say(target, result.url);
        client.say(target, `${result.title} - ${result.uploader} - ${result.duration}`);
      }
    } catch (err) {
      console.error('YouTube error:', err.message);
      client.say(target, t('error', { msg: err.message.slice(0, 100) }));
    }
  }

  function cmdTasks(nick, target) {
    const tasks = listTasks();
    if (tasks.length === 0) {
      client.say(target, t('tasksEmpty'));
    } else {
      for (const j of tasks) {
        client.say(target, t('taskEntry', { id: j.id, nick: j.nick, desc: j.description, elapsed: j.elapsed }));
      }
    }
  }

  async function cmdPlan(nick, target, args) {
    if (args === '/status' || args === '/s') {
      const plan = getPlan(nick);
      if (!plan) { client.say(target, t('planNone')); return; }
      await sendReply(target, formatPlan(plan), { paste: true });
      return;
    }
    if (args === '/stop') {
      client.say(target, cancelPlan(nick) ? t('planCancelled') : t('planNone'));
      return;
    }
    if (args === '/go') {
      if (!hasPlan(nick)) { client.say(target, t('planNone')); return; }
      await handleExecutePlan(nick, target);
      return;
    }
    if (!args) {
      client.say(target, t('planUsage'));
      return;
    }
    if (hasPlan(nick)) {
      client.say(target, t('planAlreadyActive'));
      return;
    }

    const planPrompt = `L'utilisateur veut un plan d'approche. Propose un plan clair et structuré pour répondre à sa demande. Inclus les grandes étapes, les choix d'architecture ou d'outils si pertinent, et les compromis éventuels. Ne commence pas l'exécution, propose seulement le plan. Question : ${args}`;
    const cfg = claudeConfig('opus');

    const reply = await withTask(nick, target, `!plan ${args.slice(0, 50)}`, () => ask(planPrompt, cfg, [], { queryTimeout: config.claude.queryTimeout }));
    if (reply === null) return;

    createPlan(nick, args, reply);
    await sendReply(target, reply, { paste: true });
    client.say(target, t('planGoHint'));
  }

  function cmdStop(nick, target, args) {
    const id = parseInt(args, 10);
    if (!id) { client.say(target, t('stopUsage')); return; }
    const task = cancelTask(id);
    if (!task) {
      client.say(target, t('taskNotFound', { id }));
      return;
    }
    if (task.nick !== nick) {
      client.say(target, t('taskCancelledOther', { id, nick: task.nick }));
    } else {
      client.say(target, t('taskCancelledSelf', { id }));
    }
  }

  function cmdRestart(nick, target) {
    client.action(target, t('restarting'));
    gracefulShutdown('Redémarrage');
  }

  async function cmdProject(nick, target, args) {
    if (!args) {
      const current = activeProjects.get(nick);
      client.say(target, current ? t('projectActive', { name: current }) : t('projectNoneHint'));
      return;
    }

    if (args === '/list') {
      const projects = listProjects();
      const current = activeProjects.get(nick);
      if (!projects.length) { client.say(target, t('projectListEmpty')); return; }
      const formatted = projects.map(p => p === current ? `[${p}]` : p).join(', ');
      client.say(target, t('projectList', { list: formatted }));
      return;
    }

    if (args === '/leave' || args === '/off' || args === '/quit') {
      client.say(target, activeProjects.delete(nick) ? t('projectDeactivated') : t('projectNone'));
      return;
    }

    if (args.startsWith('/delete ')) {
      const name = args.slice(8).trim();
      if (!name) { client.say(target, t('projectDeleteUsage')); return; }
      if (activeProjects.get(nick) === name) activeProjects.delete(nick);
      client.say(target, deleteProject(name) ? t('projectDeleted', { name }) : t('projectNotFound', { name }));
      return;
    }

    if (args === '/md') {
      const current = activeProjects.get(nick);
      if (!current) { client.say(target, t('projectNone')); return; }
      const prompt = getProjectPrompt(current);
      if (prompt !== null) await sendReply(target, prompt);
      return;
    }

    if (args.startsWith('/md ')) {
      const current = activeProjects.get(nick);
      if (!current) { client.say(target, t('projectNone')); return; }
      try {
        setProjectPrompt(current, args.slice(4).trim());
        client.say(target, t('projectMdUpdated', { name: current }));
      } catch (err) {
        client.say(target, err.message);
      }
      return;
    }

    const spaceIdx = args.indexOf(' ');
    const projectName = spaceIdx === -1 ? args : args.slice(0, spaceIdx);
    const rest = spaceIdx === -1 ? '' : args.slice(spaceIdx + 1).trim();

    if (!isValidProjectName(projectName)) {
      client.say(target, t('projectInvalidName'));
      return;
    }

    if (rest === '/md') {
      const prompt = getProjectPrompt(projectName);
      if (prompt === null) { client.say(target, t('projectNotFound', { name: projectName })); return; }
      await sendReply(target, prompt);
      return;
    }

    if (rest.startsWith('/md ')) {
      try {
        ensureProject(projectName);
        setProjectPrompt(projectName, rest.slice(4).trim());
        client.say(target, t('projectMdUpdated', { name: projectName }));
      } catch (err) {
        client.say(target, err.message);
      }
      return;
    }

    ensureProject(projectName);
    activeProjects.set(nick, projectName);

    if (!rest) {
      client.say(target, t('projectActive', { name: projectName }));
      return;
    }

    client.say(target, t('projectActive', { name: projectName }));
    await handleClaude(nick, target, rest);
  }

  // --- Command routing ---

  const commands = {
    whoami: cmdWhoami,
    help: (_nick, target, args) => sendReply(target, getHelp(args)),
    yt: cmdYoutube,
    tasks: cmdTasks,
    plan: cmdPlan,
    c: (nick, target, args) => args && handleClaude(nick, target, args),
    cc: (nick, target, args) => args && handleClaude(nick, target, args, { modelOverride: 'opus', taskPrefix: '!cc' }),
    stop: cmdStop,
    restart: cmdRestart,
    project: cmdProject,
  };

  // --- IRC events ---

  client.on('registered', () => {
    console.log(`Connected as ${client.user.nick}`);
    updateNickPattern(client.user.nick);
    client.join(config.irc.channel);
  });

  client.on('join', (event) => {
    if (event.nick === client.user.nick) console.log(`Joined channel: ${event.channel}`);
  });

  client.on('nick', (event) => {
    if (event.new_nick === client.user.nick) updateNickPattern(event.new_nick);
  });

  client.on('privmsg', async (event) => {
    const { target, nick } = event;
    const message = event.message.trim();

    // Activity tracking + tell delivery (don't store command content in seen)
    updateSeen(nick, target, message.startsWith('!') ? '(commande)' : message);
    for (const msg of getPendingTells(nick)) {
      client.say(target, t('tellDeliver', { nick, sender: msg.sender, msg: msg.message }));
    }

    // Plan mode interception
    if (!message.startsWith('!') && hasPlan(nick)) {
      if (!(await requireAuth(nick, target)).authorized) return;
      if (isGoMessage(message)) await handleExecutePlan(nick, target);
      else await handleRefinePlan(nick, target, message);
      return;
    }

    // Nick mention → treat as !c
    const nickMatch = nickPattern && message.match(nickPattern);
    if (nickMatch) {
      const nickArgs = message.slice(nickMatch[0].length).trim();
      if (!nickArgs) return;
      if (!(await requireAuth(nick, target)).authorized) return;
      await handleClaude(nick, target, nickArgs);
      return;
    }

    // Auto-detect YouTube links (parallel fetch, silent auth — no deny message)
    if (!message.startsWith('!')) {
      const ytIds = extractVideoIds(message);
      const silentAuth = ytIds.length > 0 && (await checkAuth(client, nick, config.auth.allowedNicks, config.auth.requireIdentified)).authorized;
      if (silentAuth) {
        const results = await Promise.allSettled(ytIds.map(id => getVideoInfo(id)));
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            const { title, uploader, duration } = r.value;
            client.say(target, `${title} - ${uploader} - ${duration}`);
          } else if (r.status === 'rejected') {
            console.error('YouTube info error:', r.reason?.message);
          }
        }
      }
      return;
    }

    // Parse command
    const spaceIdx = message.indexOf(' ');
    const command = (spaceIdx === -1 ? message : message.slice(0, spaceIdx)).slice(1).toLowerCase();
    const args = spaceIdx === -1 ? '' : message.slice(spaceIdx + 1).trim();

    // IRC commands
    if (isIrcCommand(command)) {
      if (!(await requireAuth(nick, target)).authorized) return;
      const result = handleIrcCommand(client, target, nick, command, args);
      if (result) client.say(target, result);
      return;
    }

    // Bot commands
    if (command in commands) {
      const auth = await requireAuth(nick, target);
      if (!auth.authorized) return;
      await commands[command](nick, target, args, auth);
      return;
    }
  });

  // --- Reconnection ---

  client.on('reconnecting', (event) => {
    console.log(`Reconnecting... (attempt ${event.attempt}/${event.max_retries}, wait ${event.wait}ms)`);
  });

  client.on('ping timeout', () => console.log('Ping timeout — connection closing.'));

  function manualReconnect() {
    if (shuttingDown || client.connected) return;
    console.log('Manual reconnect...');
    client.connect(buildConnectOpts(config, process.env.SASL_ACCOUNT, process.env.SASL_PASSWORD));
  }

  client.on('close', () => {
    if (shuttingDown) return;
    console.log('Disconnected. Reconnecting in 10s...');
    setTimeout(manualReconnect, 10000);
  });

  client.on('error', (event) => {
    console.error('IRC error:', event.message || event.reason || event);
  });

  // --- Graceful shutdown ---

  function gracefulShutdown(reason) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Shutting down: ${reason}`);
    cancelAllTasks();
    closeMemory();
    client.once('close', () => process.exit(0));
    client.quit(reason);
    setTimeout(() => process.exit(0), 5000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    gracefulShutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}
