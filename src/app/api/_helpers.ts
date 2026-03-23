import { getTimeEntries, rowsToEntries, upsertTimeEntries, initSchema, getAllRetainerOverrides } from '@/lib/db';
import { fetchTimeEntries, enrichEntries } from '@/lib/clickup';
import { getDefaultRetainer } from '@/lib/config';
import type { RetainerLookup } from '@/lib/types';

let schemaInitialized = false;

export async function ensureSchema() {
  if (!schemaInitialized) {
    await initSchema();
    schemaInitialized = true;
  }
}

export async function getEntriesForRange(start: string, end: string) {
  await ensureSchema();
  const startMs = new Date(start + 'T00:00:00Z').getTime();
  const endMs = new Date(end + 'T23:59:59.999Z').getTime();

  const cachedRows = await getTimeEntries(startMs, endMs);
  if (cachedRows.length > 0) {
    return { entries: rowsToEntries(cachedRows), fromCache: true };
  }

  const token = process.env.CLICKUP_API_TOKEN;
  const teamId = process.env.CLICKUP_TEAM_ID || '14135096';

  if (!token) {
    throw new Error('CLICKUP_API_TOKEN not configured');
  }

  let entries = await fetchTimeEntries(token, teamId, startMs, endMs);
  entries = await enrichEntries(token, entries);
  await upsertTimeEntries(entries);
  return { entries, fromCache: false };
}

export async function buildRetainerLookup(): Promise<RetainerLookup> {
  const overrides = await getAllRetainerOverrides();
  const overrideMap: Record<string, { retainerHours: number; retainerRevenue: number }> = {};
  for (const o of overrides) {
    overrideMap[o.client_name] = {
      retainerHours: o.retainer_hours,
      retainerRevenue: o.retainer_revenue,
    };
  }

  return (name: string) => {
    const override = overrideMap[name];
    if (override) {
      return {
        retainerHours: override.retainerHours,
        retainerRevenue: override.retainerRevenue,
        isOverridden: true,
      };
    }
    return getDefaultRetainer(name);
  };
}
