import { NextRequest, NextResponse } from 'next/server';
import { upsertTimeEntries, startSyncLog, completeSyncLog } from '@/lib/db';
import { fetchTimeEntries, enrichEntries } from '@/lib/clickup';
import { ensureSchema } from '../../_helpers';

export async function POST(req: NextRequest) {
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end parameter' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const token = process.env.CLICKUP_API_TOKEN;
    const teamId = process.env.CLICKUP_TEAM_ID || '14135096';

    if (!token) {
      return NextResponse.json({ error: 'CLICKUP_API_TOKEN not configured' }, { status: 500 });
    }

    const startMs = new Date(start + 'T00:00:00Z').getTime();
    const endMs = new Date(end + 'T23:59:59.999Z').getTime();

    const logId = await startSyncLog('refresh', start, end);
    let entries = await fetchTimeEntries(token, teamId, startMs, endMs);
    entries = await enrichEntries(token, entries);
    await upsertTimeEntries(entries);
    await completeSyncLog(logId, entries.length, entries.length);

    return NextResponse.json({ success: true, entriesCached: entries.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
