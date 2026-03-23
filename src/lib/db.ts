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
 * Cache enriched entries for a date range.
 * Replaces any existing entries for the range, then marks all dates as cached.
 */
export async function cacheEntries(entries: ClickUpEntry[], start: string, end: string): Promise<void> {
  const allDates = dateRange(start, end);

  // Clear existing entries for this date range
  await sql`
    DELETE FROM time_entries
    WHERE entry_date >= ${start}::date AND entry_date <= ${end}::date
  `;

  // Batch insert entries
  if (entries.length > 0) {
    const rows = entries.map((entry) => {
      const startMs = parseInt(entry.start, 10);
      const entryDate = new Date(startMs).toISOString().split('T')[0];
      return {
        id: entry.id,
        entry_date: entryDate,
        raw_json: sql.json(entry as unknown as Record<string, unknown>),
      };
    });

    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      await sql`
        INSERT INTO time_entries ${sql(batch, 'id', 'entry_date', 'raw_json')}
        ON CONFLICT (id) DO UPDATE SET
          entry_date = EXCLUDED.entry_date,
          raw_json = EXCLUDED.raw_json
      `;
    }
  }

  // Mark all dates in range as cached
  if (allDates.length > 0) {
    const datesToInsert = allDates.map((d) => ({ date: d }));
    await sql`
      INSERT INTO cache_metadata ${sql(datesToInsert, 'date')}
      ON CONFLICT (date) DO UPDATE SET cached_at = NOW()
    `;
  }
}

/**
 * Invalidate cache for a date range — forces next request to re-fetch from ClickUp.
 */
export async function invalidateCache(start: string, end: string): Promise<void> {
  await sql`DELETE FROM cache_metadata WHERE date >= ${start}::date AND date <= ${end}::date`;
  await sql`DELETE FROM time_entries WHERE entry_date >= ${start}::date AND entry_date <= ${end}::date`;
}

export { sql };
