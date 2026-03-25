import { getSeen, addTell } from '../services/memory.js';
import { t } from '../lang/index.js';

const startTime = Date.now();

// --- IRC commands ---

const ircCommands = {
  kick(client, channel, nick, args) {
    const [target, ...rest] = args.split(' ');
    if (!target) return t('kickUsage');
    client.raw(`KICK ${channel} ${target} :${rest.join(' ') || t('kickDefault')}`);
  },

  ban(client, channel, nick, args) {
    if (!args) return t('banUsage');
    const mask = args.includes('@') ? args : `${args}!*@*`;
    client.raw(`MODE ${channel} +b ${mask}`);
  },

  unban(client, channel, nick, args) {
    if (!args) return t('unbanUsage');
    const mask = args.includes('@') ? args : `${args}!*@*`;
    client.raw(`MODE ${channel} -b ${mask}`);
  },

  kickban(client, channel, nick, args) {
    const [target, ...rest] = args.split(' ');
    if (!target) return t('kickbanUsage');
    client.raw(`MODE ${channel} +b ${target}!*@*`);
    client.raw(`KICK ${channel} ${target} :${rest.join(' ') || t('kickDefault')}`);
  },

  mute(client, channel, nick, args) {
    if (!args) return t('muteUsage');
    const mask = args.includes('@') ? args : `${args}!*@*`;
    client.raw(`MODE ${channel} +q ${mask}`);
  },

  unmute(client, channel, nick, args) {
    if (!args) return t('unmuteUsage');
    const mask = args.includes('@') ? args : `${args}!*@*`;
    client.raw(`MODE ${channel} -q ${mask}`);
  },

  op(client, channel, nick, args) {
    if (!args) return t('opUsage');
    client.raw(`MODE ${channel} +o ${args.split(' ')[0]}`);
  },

  deop(client, channel, nick, args) {
    if (!args) return t('deopUsage');
    client.raw(`MODE ${channel} -o ${args.split(' ')[0]}`);
  },

  voice(client, channel, nick, args) {
    if (!args) return t('voiceUsage');
    client.raw(`MODE ${channel} +v ${args.split(' ')[0]}`);
  },

  devoice(client, channel, nick, args) {
    if (!args) return t('devoiceUsage');
    client.raw(`MODE ${channel} -v ${args.split(' ')[0]}`);
  },

  invite(client, channel, nick, args) {
    if (!args) return t('inviteUsage');
    client.raw(`INVITE ${args.split(' ')[0]} ${channel}`);
  },

  topic(client, channel, nick, args) {
    if (!args) return t('topicUsage');
    client.raw(`TOPIC ${channel} :${args}`);
  },

  lock(client, channel) {
    client.raw(`MODE ${channel} +i`);
  },

  unlock(client, channel) {
    client.raw(`MODE ${channel} -i`);
  },

  moderate(client, channel) {
    client.raw(`MODE ${channel} +m`);
  },

  unmoderate(client, channel) {
    client.raw(`MODE ${channel} -m`);
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
    addTell(target, nick, rest.join(' '));
    return t('tellSaved', { nick: target });
  },

  uptime() {
    return t('uptime', { time: timeSince(new Date(startTime)) });
  },
};

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
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return t('timeSeconds', { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('timeMinutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('timeHours', { h: hours, m: String(minutes % 60).padStart(2, '0') });
  const days = Math.floor(hours / 24);
  return t('timeDays', { d: days, h: hours % 24 });
}
