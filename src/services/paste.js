import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { t } from '../lang/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, '..', 'templates');

let mode, ghToken, htmlDir, htmlBaseUrl, template, author, lang;

export function initPaste(config) {
  const paste = config.paste || {};
  mode = paste.mode || 'gist';

  if (mode === 'gist') {
    ghToken = process.env.GITHUB_TOKEN;
    if (!ghToken) console.warn('Paste: GITHUB_TOKEN missing — gist pastes disabled');
  } else if (mode === 'html') {
    htmlDir = paste.dir;
    htmlBaseUrl = paste.baseUrl?.replace(/\/+$/, '');
    author = config.irc?.nick || 'Bot';
    lang = config.lang || 'en';
    if (!htmlDir || !htmlBaseUrl) {
      console.error('Paste: html mode requires "dir" and "baseUrl" in paste config');
      process.exit(1);
    }
    mkdirSync(join(htmlDir, 'assets'), { recursive: true });
    cpSync(join(TEMPLATES, 'assets'), join(htmlDir, 'assets'), { recursive: true });
    template = readFileSync(join(TEMPLATES, 'paste.html'), 'utf8');
    console.log(`Paste: html mode → ${htmlDir}`);
  } else {
    console.error(`Paste: unknown mode "${mode}"`);
    process.exit(1);
  }
}

export function createPaste(content, { filename } = {}) {
  if (mode === 'gist') return createGist(content, filename);
  return createHtml(content);
}

// --- Gist backend ---

async function createGist(content, filename = 'response.md') {
  if (!ghToken) throw new Error(t('githubTokenMissing'));

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ghToken}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Claude-IRC-Bot',
    },
    body: JSON.stringify({
      public: false,
      files: { [filename]: { content } },
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

// --- Shared filename generation ---

function generateFilename(now = new Date()) {
  const ts = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + '-' + String(now.getHours()).padStart(2, '0')
    + String(now.getMinutes()).padStart(2, '0')
    + String(now.getSeconds()).padStart(2, '0');
  const id = randomBytes(4).toString('hex');
  return `${ts}-${id}.html`;
}

// --- Raw HTML save (for UI prototypes) ---

export function saveRawHtml(content) {
  const filename = generateFilename();
  writeFileSync(join(htmlDir, filename), content);
  return `${htmlBaseUrl}/${filename}`;
}

// --- HTML backend ---

function createHtml(content) {
  const title = extractTitle(content);
  const now = new Date();
  const filename = generateFilename(now);
  const date = formatDate(now);

  const html = template
    .replace(/__LANG__/g, lang)
    .replace(/__TITLE__/g, escapeHtml(title))
    .replace(/__AUTHOR__/g, escapeHtml(author))
    .replace(/__DATE__/g, escapeHtml(date))
    .replace(/__MD__/, JSON.stringify(content));

  writeFileSync(join(htmlDir, filename), html);
  return `${htmlBaseUrl}/${filename}`;
}

function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Paste';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (lang === 'fr') {
    const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()} à ${hh}:${mm}`;
  }
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${hh}:${mm}`;
}
