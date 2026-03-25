const WHOIS_TIMEOUT_MS = 5000;
const CACHE_TTL_OK_MS = 120000;
const CACHE_TTL_DENY_MS = 10000;
const authCache = new Map();

export function checkAuth(client, nick, allowedNicks, requireIdentified) {
  const nickLower = nick.toLowerCase();

  const cached = authCache.get(nickLower);
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.result);
  }

  return new Promise((resolve) => {
    let resolved = false;
    function done(result) {
      if (resolved) return;
      resolved = true;
      const ttl = result.authorized ? CACHE_TTL_OK_MS : CACHE_TTL_DENY_MS;
      authCache.set(nickLower, { result, expiry: Date.now() + ttl });
      resolve(result);
    }

    const inWhitelist = allowedNicks.some(a => a.toLowerCase() === nickLower);
    if (!inWhitelist) return done({ authorized: false, reason: 'not_whitelisted', account: null });
    if (!requireIdentified) return done({ authorized: true, reason: 'ok', account: null });

    const timeout = setTimeout(() => {
      done({ authorized: false, reason: 'whois_timeout', account: null });
    }, WHOIS_TIMEOUT_MS);

    client.whois(nick, (whoisData) => {
      clearTimeout(timeout);
      const account = whoisData.account || null;
      if (!account) {
        return done({ authorized: false, reason: 'not_identified', account: null });
      }
      const accountMatch = allowedNicks.some(
        a => a.toLowerCase() === account.toLowerCase()
      );
      done({
        authorized: accountMatch,
        reason: accountMatch ? 'ok' : 'account_mismatch',
        account,
      });
    });
  });
}
