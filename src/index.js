import { readFileSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { createClient } from './irc/client.js';
import { initMemory } from './services/memory.js';
import { initPaste } from './services/paste.js';
import { initLang } from './lang/index.js';
import { setupBot } from './bot.js';

loadEnv();
initMemory();

const config = JSON.parse(readFileSync('./config.json', 'utf8'));
for (const key of ['irc', 'claude', 'auth']) {
  if (!config[key]) { console.error(`config.json: section "${key}" manquante`); process.exit(1); }
}

initLang(config.lang);
if (config.paste) initPaste();

const client = createClient(config, process.env.SASL_ACCOUNT, process.env.SASL_PASSWORD);
setupBot(client, config);
