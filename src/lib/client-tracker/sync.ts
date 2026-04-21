/**
 * Sync all tasks in a client folder from ClickUp into Postgres.
 * Called by the cron job and by manual refresh.
 */

import { fetchListsInFolder, fetchTasksInList, type RawClickUpTask } from './clickup';
import { replaceFolderTasks } from './db';

export async function syncFolderTasks(folderId: string): Promise<{ lists: number; tasks: number }> {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN not configured');

  const lists = await fetchListsInFolder(token, folderId);

  const allTasks: RawClickUpTask[] = [];
  const seen = new Set<string>();

  for (const list of lists) {
    const tasks = await fetchTasksInList(token, list.id);
    for (const t of tasks) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      // Ensure list info is present even if the API response didn't include it
      if (!t.list) t.list = { id: list.id, name: list.name };
      allTasks.push(t);
    }
  }

  await replaceFolderTasks(folderId, allTasks);

  return { lists: lists.length, tasks: allTasks.length };
}
