import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { t } from '../lang/index.js';

const PROJECTS_DIR = join(process.cwd(), 'projects');
const MAX_PROMPT_LENGTH = 2000;

export function initSessions() {
  mkdirSync(PROJECTS_DIR, { recursive: true });
}

export function isValidProjectName(name) {
  if (!name || name.length > 64 || !/^[\w-]+$/.test(name)) return false;
  return resolve(PROJECTS_DIR, name).startsWith(PROJECTS_DIR + '/');
}

export function listProjects() {
  return readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

export function ensureProject(name) {
  if (!isValidProjectName(name)) throw new Error(t('sessionInvalidName'));
  const dir = join(PROJECTS_DIR, name);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'CLAUDE.md'), t('sessionTemplate', { name }));
  }
  return dir;
}

export function deleteProject(name) {
  if (!isValidProjectName(name)) return false;
  const dir = join(PROJECTS_DIR, name);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true });
  return true;
}

export function getProjectPrompt(name) {
  if (!isValidProjectName(name)) return null;
  const file = join(PROJECTS_DIR, name, 'CLAUDE.md');
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8');
}

export function setProjectPrompt(name, content) {
  if (!isValidProjectName(name)) throw new Error(t('sessionInvalidName'));
  if (content.length > MAX_PROMPT_LENGTH) {
    throw new Error(t('sessionTooLong', { max: MAX_PROMPT_LENGTH }));
  }
  ensureProject(name);
  writeFileSync(join(PROJECTS_DIR, name, 'CLAUDE.md'), content);
}
