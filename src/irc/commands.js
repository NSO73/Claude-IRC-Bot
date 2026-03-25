import { getSeen, addTell } from '../services/memory.js';
import { t } from '../lang/index.js';

const startTime = Date.now();

// --- Table-driven MODE commands ---

const modeTable = {
  ban:      { flag: '+b', mask: true,  usage: 'banUsage' },
  unban:    { flag: '-b', mask: true,  usage: 'unbanUsage' },
  mute:     { flag: '+q', mask: true,  usage: 'muteUsage' },
  unmute:   { flag: '-q', mask: true,  usage: 'unmuteUsage' },
  op:       { flag: '+o', usage: 'opUsage' },
  deop:     { flag: '-o', usage: 'deopUsage' },
  voice:    { flag: '+v', usage: 'voiceUsage' },
  devoice:  { flag: '-v', usage: 'devoiceUsage' },
};

function handleMode(client, channel, args, { flag, mask, usage }) {
  if (!args) return t(usage);
  const target = args.split(' ')[0];
  const modeTarget = mask && !target.includes('@') ? `${target}!*@*` : target;
  client.raw(`MODE ${channel} ${flag} ${modeTarget}`);
}

// --- IRC commands ---

const ircCommands = {
  kick(client, channel, nick, args) {
    const [target, ...rest] = args.split(' ');
    if (!target) return t('kickUsage');
    client.raw(`KICK ${channel} ${target} :${rest.join(' ') || t('kickDefault')}`);
  },

  kickban(client, channel, nick, args) {
    const target = args.split(' ')[0];
    if (!target) return t('kickbanUsage');
    const banMask = target.includes('@') ? target : `${target}!*@*`;
    client.raw(`MODE ${channel} +b ${banMask}`);
    ircCommands.kick(client, channel, nick, args);
  },

  invite(client, channel, nick, args) {
    if (!args) return t('inviteUsage');
    client.raw(`INVITE ${args.split(' ')[0]} ${channel}`);
  },

  topic(client, channel, nick, args) {
    if (!args) return t('topicUsage');
    client.raw(`TOPIC ${channel} :${args}`);
  },

  seen(client, channel, nick, args) {
    if (!args) return t('seenUsage');
    const target = args.split(' ')[0];
    const data = getSeen(target);
    if (!data) return t('seenNever', { nick: target });
    const ago = timeSince(new Date(data.time));
    return t('seenResult', { nick: target, ago, channel: data.channel, msg: data.message.slice(0, 100) });
  },

  tell(client, channel, nick, args) {
    const [target, ...rest] = args.split(' ');
    if (!target || rest.length === 0) return t('tellUsage');
    if (target.toLowerCase() === nick.toLowerCase()) return t('tellSelf');
    addTell(target, nick, rest.join(' '));
    return t('tellSaved', { nick: target });
  },

  uptime() {
    return t('uptime', { time: timeSince(new Date(startTime)) });
  },
};

// Table-driven toggle commands (no args)
const toggleTable = {
  lock: '+i', unlock: '-i',
  moderate: '+m', unmoderate: '-m',
};

// Register table-driven commands
for (const [name, spec] of Object.entries(modeTable)) {
  ircCommands[name] = (client, channel, _nick, args) => handleMode(client, channel, args, spec);
}
for (const [name, flag] of Object.entries(toggleTable)) {
  ircCommands[name] = (client, channel) => client.raw(`MODE ${channel} ${flag}`);
}

function sanitizeIrc(str) {
  return str.replace(/[\r\n]/g, '');
}

export function isIrcCommand(name) {
  return Object.hasOwn(ircCommands, name);
}

export function handleIrcCommand(client, channel, nick, command, args) {
  const handler = ircCommands[command];
  if (!handler) return null;
  return handler(client, channel, nick, sanitizeIrc(args || ''));
}

// --- Help ---

export function getHelp(topic) {
  const key = `help_${(topic || 'menu').toLowerCase()}`;
  const val = t(key);
  return Array.isArray(val) ? val : [t('helpUnknown')];
}

// --- Utility ---

function timeSince(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return t('timeSeconds', { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('timeMinutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('timeHours', { h: hours, m: String(minutes % 60).padStart(2, '0') });
  const days = Math.floor(hours / 24);
  return t('timeDays', { d: days, h: hours % 24 });
}
