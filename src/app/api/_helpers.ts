import { fetchTimeEntries, enrichEntries } from '@/lib/clickup';
import { ensureSchema, getCachedEntries, cacheEntries, invalidateCache, getUncachedDates, getCachedEntriesForDates } from '@/lib/db';
import { getDefaultRetainer } from '@/lib/config';
import type { RetainerLookup } from '@/lib/types';

export async function getEntriesForRange(start: string, end: string, refresh = false) {
  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID || '14135096';

  if (!token) {
    throw new Error('CLICKUP_API_TOKEN not configured');
  }

  // Initialize DB schema on first call
  await ensureSchema();

  // If refresh requested, invalidate cache first
  if (refresh) {
    await invalidateCache(start, end);
  }

  // Try full cache hit first (fast path)
  if (!refresh) {
    const cached = await getCachedEntries(start, end);
    if (cached) {
      console.log(`Cache hit for ${start} to ${end}: ${cached.length} entries`);
      return { entries: cached, fromCache: true };
    }
  }

  // Incremental fetch — only get uncached dates
  const uncachedDates = refresh
    ? [start, end] // placeholder — full range on refresh
    : await getUncachedDates(start, end);

  if (uncachedDates.length === 0) {
    // All dates cached but getCachedEntries returned null (shouldn't happen, but handle it)
    const cached = await getCachedEntriesForDates(
      getAllDatesInRange(start, end)
    );
    return { entries: cached, fromCache: true };
  }

  // Determine the contiguous ranges to fetch from ClickUp
  const fetchRanges = refresh
    ? [{ start, end }]
    : getContiguousRanges(uncachedDates);

  console.log(`Cache partial miss for ${start} to ${end} — fetching ${uncachedDates.length} uncached dates in ${fetchRanges.length} range(s)...`);

  // Fetch and cache only the missing ranges
  for (const range of fetchRanges) {
    const startMs = new Date(range.start + 'T00:00:00Z').getTime();
    const endMs = new Date(range.end + 'T23:59:59.999Z').getTime();

    let entries = await fetchTimeEntries(token, teamId, startMs, endMs);
    entries = await enrichEntries(token, entries);

    await cacheEntries(entries, range.start, range.end);
    console.log(`Cached ${entries.length} entries for ${range.start} to ${range.end}`);
  }

  // Now read everything from the cache
  const allEntries = await getCachedEntriesForDates(
    getAllDatesInRange(start, end)
  );
  return { entries: allEntries, fromCache: false };
}

/** Get all YYYY-MM-DD strings in a range */
function getAllDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/** Group sorted dates into contiguous ranges to minimize API calls */
function getContiguousRanges(dates: string[]): { start: string; end: string }[] {
  if (dates.length === 0) return [];

  const sorted = [...dates].sort();
  const ranges: { start: string; end: string }[] = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(prev + 'T00:00:00Z');
    const currDate = new Date(sorted[i] + 'T00:00:00Z');
    const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000;

    if (diffDays > 1) {
      ranges.push({ start: rangeStart, end: prev });
      rangeStart = sorted[i];
    }
    prev = sorted[i];
  }
  ranges.push({ start: rangeStart, end: prev });

  return ranges;
}

export function buildRetainerLookup(): RetainerLookup {
  return (name: string) => getDefaultRetainer(name);
}
