import { t } from '../lang/index.js';

// --- Plan Mode: think first, iterate, then execute ---

const activePlans = new Map(); // nick -> { question, plan, context, createdAt }
const PLAN_TTL_MS = 30 * 60 * 1000; // 30 minutes

const GO_PATTERN = /^(go|ok|execute|do it|lance|fais[-\s]?le|exécute|oui|valide|ship it)$/i;

function isExpired(plan) {
  return Date.now() - plan.createdAt > PLAN_TTL_MS;
}

export function hasPlan(nick) {
  const plan = activePlans.get(nick);
  if (!plan) return false;
  if (isExpired(plan)) { activePlans.delete(nick); return false; }
  return true;
}

export function getPlan(nick) {
  const plan = activePlans.get(nick);
  if (!plan) return null;
  if (isExpired(plan)) { activePlans.delete(nick); return null; }
  return plan;
}

export function createPlan(nick, question, planText) {
  const plan = {
    question,
    plan: planText,
    createdAt: Date.now(),
    context: [
      { role: 'user', content: question },
      { role: 'assistant', content: planText },
    ],
  };
  activePlans.set(nick, plan);
  return plan;
}

export function updatePlan(nick, newPlanText) {
  const plan = getPlan(nick);
  if (!plan) return null;
  plan.plan = newPlanText;
  plan.createdAt = Date.now();
  return plan;
}

export function cancelPlan(nick) {
  return activePlans.delete(nick);
}

export function pushContext(nick, role, content) {
  const plan = getPlan(nick);
  if (!plan) return;
  plan.createdAt = Date.now();
  plan.context.push({ role, content });
  while (plan.context.length > 30) {
    plan.context.splice(2, 2);
  }
}

export function isGoMessage(message) {
  return GO_PATTERN.test(message.trim());
}

export function formatPlan(plan) {
  const lines = [];
  lines.push(t('planHeader', { question: plan.question }));
  lines.push('---');
  lines.push(plan.plan);
  lines.push('---');
  lines.push(t('planFooter'));
  return lines.join('\n');
}
