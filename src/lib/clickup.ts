/**
 * ClickUp API client — fetches time entries and task details.
 */

import { EMPLOYEE_IDS, USER_ID_TO_NAME } from './config';
import { getCachedTaskDetails, cacheTaskDetails } from './db';
import type { ClickUpEntry } from './types';

const API_BASE = 'https://api.clickup.com/api/v2';

// Space IDs to exclude from all data
const EXCLUDED_SPACE_IDS = new Set(['20235871']);

// In-memory cache for task details to avoid re-fetching within the same server process
const taskDetailCache = new Map<string, { folder: { id?: string; name?: string } | null; list: { id?: string; name?: string } | null; space: { id?: string; name?: string } | null; status: string | null }>();

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429 && attempt < retries) {
      const backoff = Math.pow(2, attempt) * 1000;
      console.log(`  Rate limited. Retrying in ${backoff / 1000}s (attempt ${attempt}/${retries})...`);
      await sleep(backoff);
      continue;
    }

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  throw new Error('Max retries exceeded');
}

export async function fetchTimeEntries(
  token: string,
  teamId: string,
  startMs: number | string,
  endMs: number | string,
): Promise<ClickUpEntry[]> {
  const allUserIds = Object.values(EMPLOYEE_IDS).filter(Boolean).join(',');

  console.log(`Fetching time entries...`);

  const params = new URLSearchParams({
    start_date: String(startMs),
    end_date: String(endMs),
    assignee: allUserIds,
  });

  const data = await fetchWithRetry<{ data: ClickUpEntry[] }>(
    `${API_BASE}/team/${teamId}/time_entries?${params.toString()}`,
    {
      method: 'GET',
      headers: { Authorization: token },
    },
  );

  const entries = data?.data || [];
  console.log(`  Got ${entries.length} entries`);

  return entries;
}

interface TaskDetailResult {
  folder: { id?: string; name?: string } | null;
  list: { id?: string; name?: string } | null;
  space: { id?: string; name?: string } | null;
  status: string | null;
}

/**
 * Fetch full task details for an array of task IDs.
 * Runs in parallel batches to speed things up.
 */
export async function fetchTaskDetails(
  token: string,
  taskIds: string[],
  batchSize = 10,
): Promise<Record<string, TaskDetailResult>> {
  const taskDetailsMap: Record<string, TaskDetailResult> = {};
  const total = taskIds.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = taskIds.slice(i, i + batchSize);
    const progress = Math.min(i + batchSize, total);
    console.log(`  Fetching task details ${progress}/${total}...`);

    const params = new URLSearchParams({
      custom_task_ids: 'false',
      include_subtasks: 'false',
    });

    const results = await Promise.allSettled(
      batch.map((taskId) =>
        fetchWithRetry<{
          folder?: { id?: string; name?: string };
          list?: { id?: string; name?: string };
          space?: { id?: string; name?: string };
          status?: { status?: string };
        }>(
          `${API_BASE}/task/${taskId}?${params.toString()}`,
          {
            method: 'GET',
            headers: { Authorization: token },
          },
        )
      )
    );

    for (let j = 0; j < batch.length; j++) {
      const taskId = batch[j];
      const result = results[j];

      if (result.status === 'fulfilled') {
        const task = result.value;
        taskDetailsMap[taskId] = {
          folder: task.folder || null,
          list: task.list || null,
          space: task.space || null,
          status: task.status?.status || null,
        };
      } else {
        taskDetailsMap[taskId] = { folder: null, list: null, space: null, status: null };
      }
    }
  }

  return taskDetailsMap;
}

/**
 * Enrich time entries with full task details (folder, list, space).
 * Uses a 3-tier cache: in-memory → DB → ClickUp API.
 */
export async function enrichEntries(
  token: string,
  entries: ClickUpEntry[],
): Promise<ClickUpEntry[]> {
  const uniqueTaskIds = [...new Set(
    entries.filter((e) => e.task?.id).map((e) => e.task.id!)
  )];

  // Tier 1: in-memory cache
  const needDbLookup = uniqueTaskIds.filter((id) => !taskDetailCache.has(id));
  const inMemoryHits = uniqueTaskIds.length - needDbLookup.length;

  // Tier 2: DB cache
  let dbHits = 0;
  if (needDbLookup.length > 0) {
    const dbCached = await getCachedTaskDetails(needDbLookup);
    for (const [taskId, detail] of Object.entries(dbCached)) {
      taskDetailCache.set(taskId, detail);
    }
    dbHits = Object.keys(dbCached).length;
  }

  // Tier 3: ClickUp API for anything still missing
  const needApiFetch = uniqueTaskIds.filter((id) => !taskDetailCache.has(id));
  console.log(`  ${uniqueTaskIds.length} unique tasks — ${inMemoryHits} in-memory, ${dbHits} from DB, ${needApiFetch.length} to fetch from API`);

  if (needApiFetch.length > 0) {
    const newDetails = await fetchTaskDetails(token, needApiFetch, 25);
    // Save to both in-memory and DB
    for (const [taskId, detail] of Object.entries(newDetails)) {
      taskDetailCache.set(taskId, detail);
    }
    await cacheTaskDetails(newDetails);
    console.log(`  Fetched and cached ${needApiFetch.length} task details`);
  }

  for (const entry of entries) {
    const taskId = entry.task?.id;
    if (taskId) {
      const cached = taskDetailCache.get(taskId);
      if (cached) {
        if (!entry.task) entry.task = { id: taskId };
        entry.task.folder = cached.folder ?? undefined;
        entry.task.list = cached.list ?? undefined;
        entry.task.space = cached.space ?? undefined;
      }
    }
  }

  // Filter out entries from excluded spaces
  const filtered = entries.filter((entry) => {
    const spaceId = entry.task?.space?.id;
    return !spaceId || !EXCLUDED_SPACE_IDS.has(spaceId);
  });

  if (filtered.length < entries.length) {
    console.log(`  Excluded ${entries.length - filtered.length} entries from excluded spaces`);
  }

  return filtered;
}

export { EMPLOYEE_IDS, USER_ID_TO_NAME };
