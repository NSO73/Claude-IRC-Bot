import { query } from '@anthropic-ai/claude-agent-sdk';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { t } from '../lang/index.js';

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
let defaultTimeout = DEFAULT_QUERY_TIMEOUT_MS;

export function initClaude(claudeConfig) {
  defaultTimeout = claudeConfig.queryTimeout || DEFAULT_QUERY_TIMEOUT_MS;
  if (!existsSync(CLAUDE_MEM_PATH)) {
    console.warn(`claude-mem plugin not found at ${CLAUDE_MEM_PATH}`);
  }
}

function spawnQuery(prompt, model, opts = {}) {
  const ac = new AbortController();
  const timeout = opts.queryTimeout || defaultTimeout;
  const timer = setTimeout(() => ac.abort(), timeout);

  const plugins = opts.skipPlugins
    ? (opts.plugins || [])
    : [{ type: 'local', path: CLAUDE_MEM_PATH }, ...(opts.plugins || [])];

  const sdkOpts = {
    model,
    abortController: ac,
    cwd: opts.cwd || process.cwd(),
    plugins,
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    persistSession: !opts.skipPlugins,
    maxTurns: opts.maxTurns || 5,
    ...(opts.tools != null && { tools: opts.tools }),
  };

  const promise = (async () => {
    try {
      const parts = [];
      const t0 = Date.now();
      for await (const message of query({ prompt, options: sdkOpts })) {
        if (message.type === 'system') console.log(`[claude] init +${Date.now() - t0}ms`);
        if (message.type === 'result') console.log(`[claude] done +${Date.now() - t0}ms turns=${message.num_turns} cost=$${message.total_cost_usd} error=${message.is_error}`);
        if (message.type === 'assistant') {
          const blocks = message.message?.content || [];
          const types = blocks.map(b => b.type).join(',');
          console.log(`[claude] assistant +${Date.now() - t0}ms blocks=${types}`);
          for (const block of blocks) {
            if (block.type === 'text') parts.push(block.text);
            if (opts.captureWrites && block.type === 'tool_use' && block.name === 'Write' && block.input?.content) {
              parts.push(block.input.content);
            }
          }
        }
      }
      return parts.join('').trim();
    } finally {
      clearTimeout(timer);
    }
  })();

  return { promise, abort: () => { clearTimeout(timer); ac.abort(); } };
}

export function ask(question, model, contextMessages = [], opts = {}) {
  const { model: resolved, question: q } = parseModel(question, model);

  let prompt = q;
  if (contextMessages.length > 0) {
    const userLabel = t('contextLabelUser');
    const assistantLabel = t('contextLabelAssistant');
    const history = contextMessages
      .map(m => `${m.role === 'user' ? userLabel : assistantLabel}: ${m.content}`)
      .join('\n\n');
    prompt = `${history}\n\n${userLabel}: ${q}`;
  }

  return spawnQuery(prompt, resolved, opts);
}
