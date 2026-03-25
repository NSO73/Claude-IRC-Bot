export default {
  // Core
  thinking: ({ tag }) => `thinking…${tag}`,
  taskLimit: ({ max }) => `Limit reached (${max} concurrent requests). !tasks to view, !stop to cancel.`,
  taskAborted: ({ id }) => `Task #${id} cancelled.`,
  error: ({ msg }) => `Error: ${msg}`,
  emptyReply: 'Empty response.',

  // Auth / Whoami
  authorized: 'authorized',
  unauthorized: 'unauthorized',
  whoamiIdentified: ({ nick, account, status }) => `${nick}: identified (${account}), commands ${status}`,
  whoamiNotIdentified: ({ nick, status }) => `${nick}: not identified, commands ${status}`,
  whoamiBasic: ({ nick, status }) => `${nick}: commands ${status}`,

  // YouTube
  ytUsage: 'Usage: !yt <search>',
  ytNoResult: 'No results.',

  // Tasks
  tasksEmpty: 'No active tasks.',
  taskEntry: ({ id, nick, desc, elapsed }) => `#${id} [${nick}] ${desc} (${elapsed}s)`,

  // Stop
  stopUsage: 'Usage: !stop <id>',
  taskNotFound: ({ id }) => `Task #${id} not found.`,
  taskCancelledOther: ({ id, nick }) => `Task #${id} (${nick}) cancelled.`,
  taskCancelledSelf: ({ id }) => `Task #${id} cancelled.`,

  // Plan
  planNone: 'No active plan.',
  planCancelled: 'Plan cancelled.',
  planAlreadyActive: 'A plan is already active. !plan /stop to cancel.',
  planExecuted: '-- Plan executed --',
  planRefineHint: 'Say "go" to execute, or keep refining.',
  planGoHint: 'Say "go" to execute, or send feedback to refine.',
  planUsage: 'Usage: !plan <question> | /status /go /stop',
  planHeader: ({ question }) => `Plan: ${question}`,
  planFooter: 'Say "go" to execute, or send feedback to refine the plan.',

  // Restart
  restarting: 'restarting…',

  // Project
  projectActive: ({ name }) => `Active project: ${name}`,
  projectNone: 'No active project.',
  projectNoneHint: 'No active project. !project <name> to activate one.',
  projectListEmpty: 'No projects.',
  projectList: ({ list }) => `Projects: ${list}`,
  projectDeactivated: 'Project deactivated.',
  projectDeleteUsage: 'Usage: !project /delete <name>',
  projectDeleted: ({ name }) => `Project "${name}" deleted.`,
  projectNotFound: ({ name }) => `Project "${name}" not found.`,
  projectMdUpdated: ({ name }) => `CLAUDE.md of "${name}" updated.`,
  projectInvalidName: 'Invalid project name (letters, digits, hyphens, underscores, max 64).',

  // Tell delivery
  tellDeliver: ({ nick, sender, msg }) => `${nick}: [msg from ${sender}] ${msg}`,

  // IRC Commands
  kickUsage: 'Usage: !kick <nick> [reason]',
  kickDefault: 'Bye',
  banUsage: 'Usage: !ban <nick|mask>',
  unbanUsage: 'Usage: !unban <nick|mask>',
  kickbanUsage: 'Usage: !kickban <nick> [reason]',
  muteUsage: 'Usage: !mute <nick|mask>',
  unmuteUsage: 'Usage: !unmute <nick|mask>',
  opUsage: 'Usage: !op <nick>',
  deopUsage: 'Usage: !deop <nick>',
  voiceUsage: 'Usage: !voice <nick>',
  devoiceUsage: 'Usage: !devoice <nick>',
  inviteUsage: 'Usage: !invite <nick>',
  topicUsage: 'Usage: !topic <text>',

  // Seen / Tell
  seenUsage: 'Usage: !seen <nick>',
  seenNever: ({ nick }) => `${nick}: never seen.`,
  seenResult: ({ nick, ago, channel, msg }) => `${nick} seen ${ago} ago on ${channel}: "${msg}"`,
  tellUsage: 'Usage: !tell <nick> <message>',
  tellSaved: ({ nick }) => `Message saved for ${nick}.`,

  // Uptime
  uptime: ({ time }) => `Uptime: ${time}`,

  // Time
  timeSeconds: ({ n }) => `${n}s`,
  timeMinutes: ({ n }) => `${n}min`,
  timeHours: ({ h, m }) => `${h}h${m}`,
  timeDays: ({ d, h }) => `${d}d ${h}h`,

  // Sessions
  sessionInvalidName: 'Invalid project name',
  sessionTemplate: ({ name }) => `# Project: ${name}\n\nProject session for IRC channel.\n`,
  sessionTooLong: ({ max }) => `Content too long (max ${max} characters)`,

  // Web
  githubTokenMissing: 'GITHUB_TOKEN not configured',

  // Help
  helpUnknown: 'Unknown command. Type !help for the list.',
  help_menu: [
    '=== Help ===',
    'Claude: !c (Sonnet) | !cc (Opus)',
    'Project: !project <name> | /list /leave /delete /md',
    'Plan: !plan <question> | /status /go /stop',
    'Tools: !seen !tell !yt !uptime !whoami !tasks !stop',
    'IRC: !kick !ban !unban !kickban !mute !unmute !op !deop !voice !devoice !invite !topic !lock !unlock !moderate !unmoderate',
    '!help <command> for details',
  ],
  help_c: ['!c <question> — Ask Claude a question (Sonnet)'],
  help_cc: ['!cc <question> — Ask Claude a question (Opus)'],
  help_plan: [
    '!plan <question> — Claude proposes an action plan',
    '!plan /status — Show current plan',
    '!plan /go — Approve and execute the plan',
    '!plan /stop — Cancel the plan',
    'In plan mode, your messages refine the plan. Say "go" to execute.',
  ],
  help_project: [
    '!project — Show active project',
    '!project <name> — Activate a project (auto-created if missing)',
    '!project <name> <question> — Activate + ask a question directly',
    '!project /list — List projects ([active] marked)',
    '!project /leave — Deactivate current project',
    '!project /delete <name> — Delete a project',
    '!project /md — Show active project CLAUDE.md',
    '!project /md <text> — Edit active project CLAUDE.md',
    'Once a project is active, !c, !cc and !plan use its directory.',
  ],
  help_seen: ['!seen <nick> — Show last activity of a user (persistent)'],
  help_tell: ['!tell <nick> <message> — Leave a message, delivered when nick speaks (persistent)'],
  help_yt: ['!yt <search> — Returns the first matching YouTube link'],
  help_uptime: ['!uptime — Show time since bot launch'],
  help_whoami: ['!whoami — Show your NickServ account and access level'],
  help_tasks: ['!tasks — List active Claude requests with their ID'],
  help_stop: ['!stop <id> — Cancel a running request by ID'],
  help_restart: ['!restart — Restart the bot (admin)'],
  help_help: ['!help [command] — Show general help or command details'],
  help_kick: ['!kick <nick> [reason] — Kick a user from the channel'],
  help_ban: ['!ban <nick|mask> — Ban a user or mask'],
  help_unban: ['!unban <nick|mask> — Remove a ban'],
  help_kickban: ['!kickban <nick> [reason] — Ban + kick in one command'],
  help_mute: ['!mute <nick|mask> — Mute a user (+q)'],
  help_unmute: ['!unmute <nick|mask> — Remove mute'],
  help_op: ['!op <nick> — Give operator status (+o)'],
  help_deop: ['!deop <nick> — Remove operator status'],
  help_voice: ['!voice <nick> — Give voice (+v)'],
  help_devoice: ['!devoice <nick> — Remove voice'],
  help_invite: ['!invite <nick> — Invite a user to the channel'],
  help_topic: ['!topic <text> — Change channel topic'],
  help_lock: ['!lock — Set channel to invite-only (+i)'],
  help_unlock: ['!unlock — Remove invite-only mode'],
  help_moderate: ['!moderate — Enable moderated mode (+m)'],
  help_unmoderate: ['!unmoderate — Disable moderated mode'],
};
