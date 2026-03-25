import { readFileSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { createClient } from './irc/client.js';
import { initMemory } from './services/memory.js';
import { initPaste } from './services/paste.js';
import { initAuth } from './services/auth.js';
import { initClaude } from './services/claude.js';
import { initSessions } from './services/sessions.js';
import { initLang } from './lang/index.js';
import { setupBot } from './bot.js';
import { initUi } from './services/ui.js';

loadEnv();

const config = JSON.parse(readFileSync('./config.json', 'utf8'));
for (const key of ['irc', 'claude', 'auth']) {
  if (!config[key]) { console.error(`config.json: section "${key}" manquante`); process.exit(1); }
}
const requiredFields = { irc: ['host', 'port', 'nick', 'channel'], claude: ['model'], auth: ['allowedNicks'] };
for (const [section, fields] of Object.entries(requiredFields)) {
  for (const f of fields) {
    if (config[section][f] == null) { console.error(`config.json: "${section}.${f}" manquant`); process.exit(1); }
  }
}

initLang(config.lang);
initMemory();
initAuth(config.auth);
initClaude(config.claude);
initSessions();
if (config.paste) initPaste(config);
initUi(config);

const client = createClient(config, process.env.SASL_ACCOUNT, process.env.SASL_PASSWORD);
setupBot(client, config);
