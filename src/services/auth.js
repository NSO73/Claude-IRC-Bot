const WHOIS_TIMEOUT_MS = 5000;
const CACHE_TTL_OK_MS = 120000;
const CACHE_TTL_DENY_MS = 10000;
const authCache = new Map();

let allowedSet = new Set();
let requireId = false;

export function initAuth(authConfig) {
  allowedSet = new Set((authConfig.allowedNicks || []).map(n => n.toLowerCase()));
  requireId = !!authConfig.requireIdentified;

  // Periodic cache purge
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of authCache) {
      if (v.expiry <= now) authCache.delete(k);
    }
  }, 300_000).unref();
}

export function checkAuth(client, nick) {
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

    if (!allowedSet.has(nickLower)) return done({ authorized: false, reason: 'not_whitelisted', account: null });
    if (!requireId) return done({ authorized: true, reason: 'ok', account: null });

    const timeout = setTimeout(() => {
      done({ authorized: false, reason: 'whois_timeout', account: null });
    }, WHOIS_TIMEOUT_MS);

    client.whois(nick, (whoisData) => {
      clearTimeout(timeout);
      const account = whoisData.account || null;
      if (!account) {
        return done({ authorized: false, reason: 'not_identified', account: null });
      }
      const accountMatch = allowedSet.has(account.toLowerCase());
      done({
        authorized: accountMatch,
        reason: accountMatch ? 'ok' : 'account_mismatch',
        account,
      });
    });
  });
}
