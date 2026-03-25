import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';
import { createPaste, saveRawHtml } from './paste.js';
import { t } from '../lang/index.js';

let skillContent, scriptPath, pasteMode, uiEnabled = false;

export function initUi(config) {
  const base = process.cwd();
  const skillDir = join(base, 'src', 'skills-data');
  const skillPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillPath)) {
    console.warn(`UI: SKILL.md not found at ${skillPath} — !ui disabled`);
    return;
  }
  skillContent = readFileSync(skillPath, 'utf8');
  scriptPath = join(skillDir, 'scripts', 'search.py');
  pasteMode = config.paste?.mode || 'gist';
  uiEnabled = true;
  console.log('UI: skill loaded');
}

export function isUiEnabled() {
  return uiEnabled;
}

function searchDesignSystem(query) {
  try {
    return execFileSync(
      'python3',
      [scriptPath, query, '--design-system', '-f', 'markdown'],
      { timeout: 15000 }
    ).toString();
  } catch {
    return null;
  }
}

export function buildUiPrompt(question) {
  const ds = searchDesignSystem(question);

  let prompt = skillContent + '\n\n---\n\n';
  if (ds) prompt += t('uiDesignSystemIntro', { ds });
  prompt += t('uiBuildInstructions', { pasteMode, question });
  return prompt;
}

export function publishPrototype(response) {
  const html = extractHtml(response);
  if (pasteMode === 'html') return saveRawHtml(html);
  return createPaste(html, { filename: 'index.html' });
}

function extractHtml(response) {
  const fenced = response.match(/```html?\s*\n([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const doc = response.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
  if (doc) return doc[0].trim();
  return response.trim();
}
