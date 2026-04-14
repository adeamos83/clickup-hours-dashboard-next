/**
 * Postgres caching layer for ClickUp data.
 * Uses the `postgres` package — works with Railway, Supabase, Neon, or any standard Postgres.
 */

import postgres from 'postgres';
import type { ClickUpEntry } from './types';

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

let schemaReady = false;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      entry_date DATE NOT NULL,
      raw_json JSONB NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries (entry_date)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cache_metadata (
      date DATE PRIMARY KEY,
      cached_at TIMESTAMPTZ DEFAULT NOW()
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
      cached_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  schemaReady = true;
}

/** Enumerate all dates in a range as YYYY-MM-DD strings */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Check if all dates in the range are cached.
 * Returns the cached entries if so, or null if any date is missing.
 */
export async function getCachedEntries(start: string, end: string): Promise<ClickUpEntry[] | null> {
  const allDates = dateRange(start, end);
  if (allDates.length === 0) return null;

  const cached = await sql`
    SELECT date FROM cache_metadata WHERE date = ANY(${allDates}::date[])
  `;

  if (cached.length < allDates.length) {
    return null; // not all dates are cached
  }

  const rows = await sql`
    SELECT raw_json FROM time_entries
    WHERE entry_date >= ${start}::date AND entry_date <= ${end}::date
  `;

  return rows.map((r) => r.raw_json as ClickUpEntry);
}

/**
 * Return which dates in a range are NOT yet cached.
 */
export async function getUncachedDates(start: string, end: string): Promise<string[]> {
  const allDates = dateRange(start, end);
  if (allDates.length === 0) return [];

  const cached = await sql`
    SELECT date::text FROM cache_metadata WHERE date = ANY(${allDates}::date[])
  `;
  const cachedSet = new Set(cached.map((r) => r.date));

  return allDates.filter((d) => !cachedSet.has(d));
}

/**
 * Get cached entries for specific dates only (partial range).
 */
export async function getCachedEntriesForDates(dates: string[]): Promise<ClickUpEntry[]> {
  if (dates.length === 0) return [];

  const rows = await sql`
    SELECT raw_json FROM time_entries
    WHERE entry_date = ANY(${dates}::date[])
  `;

  return rows.map((r) => r.raw_json as ClickUpEntry);
}

/**
 * Cache enriched entries for a date range.
 * Uses jsonb_array_elements for bulk insert in a single round-trip per batch.
 */
export async function cacheEntries(entries: ClickUpEntry[], start: string, end: string): Promise<void> {
  const allDates = dateRange(start, end);

  // Clear existing entries for this date range
  await sql`
    DELETE FROM time_entries
    WHERE entry_date >= ${start}::date AND entry_date <= ${end}::date
  `;

  // Build wrapped entries with entry_date computed, then bulk insert via jsonb_array_elements
  if (entries.length > 0) {
    const wrapped = entries.map((entry) => {
      const startMs = parseInt(entry.start, 10);
      const entryDate = new Date(startMs).toISOString().split('T')[0];
      return { _id: entry.id, _date: entryDate, _data: entry };
    });

    // Batch in groups of 300 to keep parameter size reasonable
    for (let i = 0; i < wrapped.length; i += 300) {
      const batch = wrapped.slice(i, i + 300);

      await sql`
        INSERT INTO time_entries (id, entry_date, raw_json)
        SELECT
          e->>'_id',
          (e->>'_date')::date,
          e->'_data'
        FROM jsonb_array_elements(${sql.json(batch as unknown as Record<string, never>[])}) AS e
        ON CONFLICT (id) DO UPDATE SET
          entry_date = EXCLUDED.entry_date,
          raw_json = EXCLUDED.raw_json
      `;
    }
  }

  // Bulk mark all dates as cached
  await sql`
    INSERT INTO cache_metadata (date, cached_at)
    SELECT d, NOW() FROM UNNEST(${allDates}::date[]) AS d
    ON CONFLICT (date) DO UPDATE SET cached_at = NOW()
  `;
}

/**
 * Invalidate cache for a date range — forces next request to re-fetch from ClickUp.
 */
export async function invalidateCache(start: string, end: string): Promise<void> {
  await sql`DELETE FROM cache_metadata WHERE date >= ${start}::date AND date <= ${end}::date`;
  await sql`DELETE FROM time_entries WHERE entry_date >= ${start}::date AND entry_date <= ${end}::date`;
}

// ── Task detail persistent cache ──

export interface TaskDetailRow {
  folder: { id?: string; name?: string } | null;
  list: { id?: string; name?: string } | null;
  space: { id?: string; name?: string } | null;
  status: string | null;
}

/**
 * Get cached task details from DB for the given task IDs.
 * Returns a map of taskId -> detail for those found.
 */
export async function getCachedTaskDetails(taskIds: string[]): Promise<Record<string, TaskDetailRow>> {
  if (taskIds.length === 0) return {};

  const rows = await sql`
    SELECT task_id, folder_id, folder_name, list_id, list_name, space_id, space_name, status
    FROM task_details
    WHERE task_id = ANY(${taskIds})
  `;

  const result: Record<string, TaskDetailRow> = {};
  for (const r of rows) {
    result[r.task_id] = {
      folder: r.folder_name ? { id: r.folder_id, name: r.folder_name } : null,
      list: r.list_name ? { id: r.list_id, name: r.list_name } : null,
      space: r.space_id ? { id: r.space_id, name: r.space_name } : null,
      status: r.status,
    };
  }
  return result;
}

/**
 * Store task details in the DB for future lookups (bulk UNNEST insert).
 */
export async function cacheTaskDetails(details: Record<string, TaskDetailRow>): Promise<void> {
  const entries = Object.entries(details);
  if (entries.length === 0) return;

  const taskIds: string[] = [];
  const folderIds: (string | null)[] = [];
  const folderNames: (string | null)[] = [];
  const listIds: (string | null)[] = [];
  const listNames: (string | null)[] = [];
  const spaceIds: (string | null)[] = [];
  const spaceNames: (string | null)[] = [];
  const statuses: (string | null)[] = [];

  for (const [taskId, d] of entries) {
    taskIds.push(taskId);
    folderIds.push(d.folder?.id ?? null);
    folderNames.push(d.folder?.name ?? null);
    listIds.push(d.list?.id ?? null);
    listNames.push(d.list?.name ?? null);
    spaceIds.push(d.space?.id ?? null);
    spaceNames.push(d.space?.name ?? null);
    statuses.push(d.status ?? null);
  }

  await sql`
    INSERT INTO task_details (task_id, folder_id, folder_name, list_id, list_name, space_id, space_name, status, cached_at)
    SELECT *, NOW() FROM UNNEST(
      ${taskIds}::text[],
      ${folderIds}::text[],
      ${folderNames}::text[],
      ${listIds}::text[],
      ${listNames}::text[],
      ${spaceIds}::text[],
      ${spaceNames}::text[],
      ${statuses}::text[]
    )
    ON CONFLICT (task_id) DO UPDATE SET
      folder_id = EXCLUDED.folder_id,
      folder_name = EXCLUDED.folder_name,
      list_id = EXCLUDED.list_id,
      list_name = EXCLUDED.list_name,
      space_id = EXCLUDED.space_id,
      space_name = EXCLUDED.space_name,
      status = EXCLUDED.status,
      cached_at = NOW()
  `;
}

export { sql };
