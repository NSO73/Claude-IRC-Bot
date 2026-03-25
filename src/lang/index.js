import fr from './fr.js';
import en from './en.js';

const langs = { fr, en };
let strings = fr;

export function initLang(lang) {
  strings = langs[lang] || fr;
}

export function t(key, params = {}) {
  const val = strings[key];
  if (val === undefined) return key;
  if (typeof val === 'function') return val(params);
  return val;
}
