/**
 * Database helpers for the Client Tracker.
 * Stores task snapshots per folder in the `client_tasks` table.
 */

import { sql } from '../db';
import type { RawClickUpTask } from './clickup';

let schemaReady = false;

export async function ensureTrackerSchema(): Promise<void> {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS client_tasks (
      task_id TEXT PRIMARY KEY,
      folder_id TEXT NOT NULL,
      list_id TEXT,
      list_name TEXT,
      parent_id TEXT,
      name TEXT NOT NULL,
      status_name TEXT,
      status_type TEXT,
      status_color TEXT,
      priority TEXT,
      due_date BIGINT,
      start_date BIGINT,
      date_closed BIGINT,
      date_updated BIGINT,
      raw_json JSONB NOT NULL,
      cached_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_client_tasks_folder ON client_tasks (folder_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_client_tasks_parent ON client_tasks (parent_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS client_tracker_sync (
      folder_id TEXT PRIMARY KEY,
      last_synced TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  schemaReady = true;
}

function toBigint(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/**
 * Replace all cached tasks for a folder with the fresh fetch.
 * Upserts new/updated rows, then removes tasks no longer present in ClickUp.
 */
export async function replaceFolderTasks(
  folderId: string,
  tasks: RawClickUpTask[],
): Promise<void> {
  await ensureTrackerSchema();

  const currentIds = tasks.map((t) => t.id);

  if (tasks.length > 0) {
    const rows = tasks.map((t) => ({
      task_id: t.id,
      folder_id: folderId,
      list_id: t.list?.id ?? null,
      list_name: t.list?.name ?? null,
      parent_id: t.parent ?? null,
      name: t.name,
      status_name: t.status?.status ?? null,
      status_type: t.status?.type ?? null,
      status_color: t.status?.color ?? null,
      priority: t.priority?.priority ?? null,
      due_date: toBigint(t.due_date),
      start_date: toBigint(t.start_date),
      date_closed: toBigint(t.date_closed),
      date_updated: toBigint(t.date_updated),
      raw: t,
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      await sql`
        INSERT INTO client_tasks (
          task_id, folder_id, list_id, list_name, parent_id,
          name, status_name, status_type, status_color, priority,
          due_date, start_date, date_closed, date_updated, raw_json, cached_at
        )
        SELECT
          e->>'task_id',
          e->>'folder_id',
          e->>'list_id',
          e->>'list_name',
          e->>'parent_id',
          e->>'name',
          e->>'status_name',
          e->>'status_type',
          e->>'status_color',
          e->>'priority',
          NULLIF(e->>'due_date','')::bigint,
          NULLIF(e->>'start_date','')::bigint,
          NULLIF(e->>'date_closed','')::bigint,
          NULLIF(e->>'date_updated','')::bigint,
          e->'raw',
          NOW()
        FROM jsonb_array_elements(${sql.json(batch as unknown as Record<string, never>[])}) AS e
        ON CONFLICT (task_id) DO UPDATE SET
          folder_id = EXCLUDED.folder_id,
          list_id = EXCLUDED.list_id,
          list_name = EXCLUDED.list_name,
          parent_id = EXCLUDED.parent_id,
          name = EXCLUDED.name,
          status_name = EXCLUDED.status_name,
          status_type = EXCLUDED.status_type,
          status_color = EXCLUDED.status_color,
          priority = EXCLUDED.priority,
          due_date = EXCLUDED.due_date,
          start_date = EXCLUDED.start_date,
          date_closed = EXCLUDED.date_closed,
          date_updated = EXCLUDED.date_updated,
          raw_json = EXCLUDED.raw_json,
          cached_at = NOW()
      `;
    }
  }

  // Remove tasks from the folder that are no longer in ClickUp
  if (currentIds.length > 0) {
    await sql`
      DELETE FROM client_tasks
      WHERE folder_id = ${folderId} AND task_id <> ALL(${currentIds}::text[])
    `;
  } else {
    await sql`DELETE FROM client_tasks WHERE folder_id = ${folderId}`;
  }

  await sql`
    INSERT INTO client_tracker_sync (folder_id, last_synced)
    VALUES (${folderId}, NOW())
    ON CONFLICT (folder_id) DO UPDATE SET last_synced = NOW()
  `;
}

export async function getFolderTasks(folderId: string): Promise<RawClickUpTask[]> {
  await ensureTrackerSchema();
  const rows = await sql`
    SELECT raw_json FROM client_tasks WHERE folder_id = ${folderId}
  `;
  return rows.map((r) => r.raw_json as RawClickUpTask);
}

export async function getFolderSyncTime(folderId: string): Promise<Date | null> {
  await ensureTrackerSchema();
  const rows = await sql`
    SELECT last_synced FROM client_tracker_sync WHERE folder_id = ${folderId}
  `;
  return rows[0]?.last_synced ? new Date(rows[0].last_synced as string) : null;
}
