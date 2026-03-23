import { fetchTimeEntries, enrichEntries } from '@/lib/clickup';
import { ensureSchema, getCachedEntries, cacheEntries, invalidateCache } from '@/lib/db';
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

  // Try cache
  if (!refresh) {
    const cached = await getCachedEntries(start, end);
    if (cached) {
      console.log(`Cache hit for ${start} to ${end}: ${cached.length} entries`);
      return { entries: cached, fromCache: true };
    }
  }

  // Cache miss — fetch from ClickUp
  console.log(`Cache miss for ${start} to ${end} — fetching from ClickUp...`);
  const startMs = new Date(start + 'T00:00:00Z').getTime();
  const endMs = new Date(end + 'T23:59:59.999Z').getTime();

  let entries = await fetchTimeEntries(token, teamId, startMs, endMs);
  entries = await enrichEntries(token, entries);

  // Cache the results
  await cacheEntries(entries, start, end);
  console.log(`Cached ${entries.length} entries for ${start} to ${end}`);

  return { entries, fromCache: false };
}

export function buildRetainerLookup(): RetainerLookup {
  return (name: string) => getDefaultRetainer(name);
}
