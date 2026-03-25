// --- Active tasks registry ---

const activeTasks = new Map();
let nextTaskId = 1;

export function registerTask(nick, description, abortFn) {
  const id = nextTaskId++;
  activeTasks.set(id, { nick, description, startTime: Date.now(), abort: abortFn });
  return id;
}

export function unregisterTask(id) {
  activeTasks.delete(id);
}

export function cancelTask(id) {
  const task = activeTasks.get(id);
  if (!task) return null;
  task.abort();
  activeTasks.delete(id);
  return task;
}

export function cancelAllTasks() {
  for (const task of activeTasks.values()) {
    task.abort();
  }
  activeTasks.clear();
}

export function listTasks() {
  return [...activeTasks.entries()].map(([id, task]) => {
    const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
    return { id, nick: task.nick, description: task.description, elapsed };
  });
}

export function countTasksByNick(nick) {
  let count = 0;
  for (const task of activeTasks.values()) {
    if (task.nick === nick) count++;
  }
  return count;
}
