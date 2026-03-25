import { t } from '../lang/index.js';

let token;

export function initPaste() {
  token = process.env.GITHUB_TOKEN;
  if (!token) console.warn('Paste: GITHUB_TOKEN missing — pastes disabled');
}

export async function createPaste(content) {
  if (!token) throw new Error(t('githubTokenMissing'));

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Claude-IRC-Bot',
    },
    body: JSON.stringify({
      public: false,
      files: { 'response.md': { content } },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub Gist ${res.status}: ${err.slice(0, 100)}`);
  }

  const json = await res.json();
  return json.html_url;
}
