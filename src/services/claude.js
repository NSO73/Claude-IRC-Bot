import { query } from '@anthropic-ai/claude-agent-sdk';
import { homedir } from 'os';
import { join } from 'path';

const MODEL_ALIASES = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
};

const CLAUDE_MEM_PATH = join(homedir(), '.claude/plugins/marketplaces/thedotmack/plugin');

function resolveModel(name) {
  return MODEL_ALIASES[name?.toLowerCase()] || name;
}

function parseModel(question, defaultModel) {
  const match = question.match(/^(opus|sonnet):\s*/i);
  if (match) {
    return { model: resolveModel(match[1].toLowerCase()), question: question.slice(match[0].length) };
  }
  return { model: resolveModel(defaultModel), question };
}

const DEFAULT_QUERY_TIMEOUT_MS = 300000; // 5 minutes

function spawnQuery(prompt, model, opts = {}) {
  const ac = new AbortController();
  const timeout = opts.queryTimeout || DEFAULT_QUERY_TIMEOUT_MS;
  const timer = setTimeout(() => ac.abort(), timeout);

  const sdkOpts = {
    model,
    abortController: ac,
    cwd: opts.cwd || process.cwd(),
    plugins: [
      { type: 'local', path: CLAUDE_MEM_PATH },
      ...(opts.plugins || []),
    ],
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    persistSession: true,
    maxTurns: opts.maxTurns || 3,
  };

  const promise = (async () => {
    try {
      let result = '';
      for await (const message of query({ prompt, options: sdkOpts })) {
        if (message.type === 'assistant') {
          for (const block of message.message?.content || []) {
            if (block.type === 'text') result += block.text;
          }
        }
      }
      return result.trim();
    } finally {
      clearTimeout(timer);
    }
  })();

  return { promise, abort: () => { clearTimeout(timer); ac.abort(); } };
}

export function ask(question, claudeConfig, contextMessages = [], opts = {}) {
  const { model, question: q } = parseModel(question, claudeConfig.model);

  let prompt = q;
  if (contextMessages.length > 0) {
    const history = contextMessages
      .map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    prompt = `${history}\n\nUtilisateur: ${q}`;
  }

  return spawnQuery(prompt, model, {
    cwd: opts.cwd,
    plugins: opts.plugins,
    maxTurns: opts.maxTurns,
    queryTimeout: opts.queryTimeout,
  });
}
