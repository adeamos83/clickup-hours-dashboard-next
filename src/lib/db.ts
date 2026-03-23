/**
 * Database layer for ClickUp data — @vercel/postgres.
 *
 * Stores time entries and task details so the dashboard
 * loads instantly after the first sync. Only new/changed data
 * needs to be fetched from ClickUp.
 */

import { sql } from '@vercel/postgres';
import type { ClickUpEntry, ClientRetainer, SyncStatus } from './types';
import { resolveClientName, CLIENT_RETAINERS } from './config';

// ── Schema Initialization ──

export async function initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      task_name TEXT,
      user_id TEXT,
      username TEXT,
      start_ms BIGINT,
      end_ms BIGINT,
      duration_ms BIGINT,
      description TEXT,
      synced_at BIGINT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS task_details (
      task_id TEXT PRIMARY KEY,
      folder_id TEXT,
      folder_name TEXT,
      list_id TEXT,
      list_name TEXT,
      space_id TEXT,
      space_name TEXT,
      status TEXT,
      synced_at BIGINT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sync_log (
      id SERIAL PRIMARY KEY,
      sync_type TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      entries_fetched INTEGER,
      tasks_enriched INTEGER,
      started_at BIGINT NOT NULL,
      completed_at BIGINT,
      status TEXT DEFAULT 'running'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS client_retainer_overrides (
      client_name TEXT PRIMARY KEY,
      retainer_hours REAL,
      retainer_revenue REAL,
      updated_at BIGINT NOT NULL
    )
  `;

  // Create indexes (IF NOT EXISTS not supported for indexes in all PG versions, so use DO block)
  await sql`CREATE INDEX IF NOT EXISTS idx_time_entries_start ON time_entries(start_ms)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id)`;
}

// ── Time Entries ──

export async function upsertTimeEntries(entries: ClickUpEntry[]): Promise<void> {
  const now = Date.now();

  for (const e of entries) {
    const taskId = e.task?.id || null;
    const taskName = e.task?.name || null;
    const userId = e.user?.id?.toString() || null;
    const username = e.user?.username || null;
    const startMs = parseInt(e.start, 10) || null;
    const endMs = parseInt(e.end, 10) || null;
    const durationMs = parseInt(e.duration as string, 10) || 0;
    const description = e.description || null;

    await sql`
      INSERT INTO time_entries (id, task_id, task_name, user_id, username, start_ms, end_ms, duration_ms, description, synced_at)
      VALUES (${e.id}, ${taskId}, ${taskName}, ${userId}, ${username}, ${startMs}, ${endMs}, ${durationMs}, ${description}, ${now})
      ON CONFLICT (id) DO UPDATE SET
        task_id = ${taskId},
        task_name = ${taskName},
        user_id = ${userId},
        username = ${username},
        start_ms = ${startMs},
        end_ms = ${endMs},
        duration_ms = ${durationMs},
        description = ${description},
        synced_at = ${now}
    `;
  }
}

export async function getTimeEntries(startMs: number, endMs: number) {
  const result = await sql`
    SELECT
      te.id, te.task_id, te.task_name, te.user_id, te.username,
      te.start_ms, te.end_ms, te.duration_ms, te.description,
      td.folder_id, td.folder_name, td.list_id, td.list_name,
      td.space_id, td.space_name, td.status as task_status
    FROM time_entries te
    LEFT JOIN task_details td ON te.task_id = td.task_id
    WHERE te.start_ms >= ${startMs} AND te.start_ms <= ${endMs}
    ORDER BY te.start_ms
  `;
  return result.rows;
}

/**
 * Convert cached DB rows back into the entry format the processor expects.
 */
export function rowsToEntries(rows: Record<string, unknown>[]): ClickUpEntry[] {
  return rows.map((r) => ({
    id: r.id as string,
    user: { id: r.user_id as string, username: r.username as string },
    task: {
      id: r.task_id as string,
      name: r.task_name as string,
      folder: r.folder_name ? { id: r.folder_id as string, name: r.folder_name as string } : undefined,
      list: r.list_name ? { id: r.list_id as string, name: r.list_name as string } : undefined,
      space: r.space_name ? { id: r.space_id as string, name: r.space_name as string } : undefined,
    },
    start: (r.start_ms as number)?.toString(),
    end: (r.end_ms as number)?.toString(),
    duration: (r.duration_ms as number)?.toString(),
    description: r.description as string | undefined,
  }));
}

// ── Task Details ──

export async function upsertTaskDetails(
  taskDetailsMap: Record<string, {
    folder?: { id?: string; name?: string } | null;
    list?: { id?: string; name?: string } | null;
    space?: { id?: string; name?: string } | null;
    status?: string | null;
  }>,
): Promise<void> {
  const now = Date.now();

  for (const [taskId, details] of Object.entries(taskDetailsMap)) {
    const folderId = details.folder?.id || null;
    const folderName = details.folder?.name || null;
    const listId = details.list?.id || null;
    const listName = details.list?.name || null;
    const spaceId = details.space?.id || null;
    const spaceName = details.space?.name || null;
    const status = details.status || null;

    await sql`
      INSERT INTO task_details (task_id, folder_id, folder_name, list_id, list_name, space_id, space_name, status, synced_at)
      VALUES (${taskId}, ${folderId}, ${folderName}, ${listId}, ${listName}, ${spaceId}, ${spaceName}, ${status}, ${now})
      ON CONFLICT (task_id) DO UPDATE SET
        folder_id = ${folderId},
        folder_name = ${folderName},
        list_id = ${listId},
        list_name = ${listName},
        space_id = ${spaceId},
        space_name = ${spaceName},
        status = ${status},
        synced_at = ${now}
    `;
  }
}

export async function getCachedTaskIds(): Promise<Set<string>> {
  const result = await sql`SELECT task_id FROM task_details`;
  return new Set(result.rows.map((r) => r.task_id as string));
}

export async function getTaskDetail(taskId: string): Promise<{
  folder_id?: string | null;
  folder_name?: string | null;
  list_id?: string | null;
  list_name?: string | null;
  space_id?: string | null;
  space_name?: string | null;
  status?: string | null;
} | null> {
  const result = await sql`
    SELECT folder_id, folder_name, list_id, list_name, space_id, space_name, status
    FROM task_details
    WHERE task_id = ${taskId}
  `;
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    folder_id: r.folder_id as string | null,
    folder_name: r.folder_name as string | null,
    list_id: r.list_id as string | null,
    list_name: r.list_name as string | null,
    space_id: r.space_id as string | null,
    space_name: r.space_name as string | null,
    status: r.status as string | null,
  };
}

// ── Sync Log ──

export async function startSyncLog(
  type: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  const now = Date.now();
  const result = await sql`
    INSERT INTO sync_log (sync_type, start_date, end_date, started_at, status)
    VALUES (${type}, ${startDate}, ${endDate}, ${now}, 'running')
    RETURNING id
  `;
  return result.rows[0].id as number;
}

export async function completeSyncLog(
  logId: number,
  entriesFetched: number,
  tasksEnriched: number,
): Promise<void> {
  const now = Date.now();
  await sql`
    UPDATE sync_log
    SET completed_at = ${now}, entries_fetched = ${entriesFetched}, tasks_enriched = ${tasksEnriched}, status = 'done'
    WHERE id = ${logId}
  `;
}

export async function failSyncLog(logId: number, errorMsg: string): Promise<void> {
  const now = Date.now();
  const statusMsg = `error: ${errorMsg}`;
  await sql`
    UPDATE sync_log SET completed_at = ${now}, status = ${statusMsg} WHERE id = ${logId}
  `;
}

export async function getLastSync(): Promise<Record<string, unknown> | null> {
  const result = await sql`
    SELECT * FROM sync_log WHERE status = 'done' ORDER BY completed_at DESC LIMIT 1
  `;
  return (result.rows[0] as Record<string, unknown>) || null;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const lastSync = await getLastSync();

  const totalEntriesResult = await sql`SELECT COUNT(*) as count FROM time_entries`;
  const totalEntries = parseInt(totalEntriesResult.rows[0].count as string, 10) || 0;

  const totalTasksResult = await sql`SELECT COUNT(*) as count FROM task_details`;
  const totalTasks = parseInt(totalTasksResult.rows[0].count as string, 10) || 0;

  const runningResult = await sql`SELECT * FROM sync_log WHERE status = 'running' LIMIT 1`;
  const running = runningResult.rows[0] || null;

  return {
    lastSync: lastSync ? {
      completedAt: new Date(Number(lastSync.completed_at)).toISOString(),
    } : null,
    isSyncing: !!running,
    totalCachedEntries: totalEntries,
    totalCachedTasks: totalTasks,
  };
}

export async function clearCache(): Promise<void> {
  await sql`DELETE FROM time_entries`;
  await sql`DELETE FROM task_details`;
  await sql`DELETE FROM sync_log`;
}

// ── Client Retainer Overrides ──

export async function getRetainerOverride(clientName: string): Promise<{
  retainer_hours: number;
  retainer_revenue: number;
} | null> {
  const result = await sql`
    SELECT retainer_hours, retainer_revenue
    FROM client_retainer_overrides
    WHERE client_name = ${clientName}
  `;
  if (result.rows.length === 0) return null;
  return {
    retainer_hours: result.rows[0].retainer_hours as number,
    retainer_revenue: result.rows[0].retainer_revenue as number,
  };
}

export async function getAllRetainerOverrides(): Promise<{
  client_name: string;
  retainer_hours: number;
  retainer_revenue: number;
}[]> {
  const result = await sql`
    SELECT client_name, retainer_hours, retainer_revenue
    FROM client_retainer_overrides
  `;
  return result.rows as { client_name: string; retainer_hours: number; retainer_revenue: number }[];
}

export async function upsertRetainerOverride(
  clientName: string,
  hours: number,
  revenue: number,
): Promise<void> {
  const now = Date.now();
  await sql`
    INSERT INTO client_retainer_overrides (client_name, retainer_hours, retainer_revenue, updated_at)
    VALUES (${clientName}, ${hours}, ${revenue}, ${now})
    ON CONFLICT (client_name) DO UPDATE SET
      retainer_hours = ${hours},
      retainer_revenue = ${revenue},
      updated_at = ${now}
  `;
}

export async function deleteRetainerOverride(clientName: string): Promise<void> {
  await sql`DELETE FROM client_retainer_overrides WHERE client_name = ${clientName}`;
}

/**
 * Combines config defaults + DB override into a single retainer lookup.
 * This is the async version that should be called once, then the result
 * can be used as the synchronous RetainerLookup function.
 */
export async function getClientRetainerWithOverride(clientName: string): Promise<ClientRetainer | null> {
  const canonical = resolveClientName(clientName);
  const lookupName = CLIENT_RETAINERS[clientName] ? clientName : canonical;

  // Check DB override first
  const override = await getRetainerOverride(lookupName);
  if (override) {
    return {
      retainerHours: override.retainer_hours,
      retainerRevenue: override.retainer_revenue,
      isOverridden: true,
    };
  }

  const defaults = CLIENT_RETAINERS[lookupName];
  return defaults ? { ...defaults, isOverridden: false } : null;
}
