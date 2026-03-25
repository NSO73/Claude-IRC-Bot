import IRC from 'irc-framework';

export function buildConnectOpts(config, saslAccount, saslPassword) {
  const opts = {
    host: config.irc.host,
    port: config.irc.port,
    tls: config.irc.tls,
    nick: config.irc.nick,
    username: config.irc.username,
    gecos: config.irc.gecos,
    auto_reconnect: config.irc.autoReconnect,
    auto_reconnect_max_retries: config.irc.autoReconnectMaxRetries,
    auto_reconnect_wait: config.irc.autoReconnectWait || 5000,
  };
  if (saslAccount && saslPassword) {
    opts.account = { account: saslAccount, password: saslPassword };
  }
  return opts;
}

export function createClient(config, saslAccount, saslPassword) {
  const client = new IRC.Client();
  client.connect(buildConnectOpts(config, saslAccount, saslPassword));
  return client;
}
