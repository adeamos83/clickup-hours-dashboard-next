import { NextRequest, NextResponse } from 'next/server';
import { getEntriesForRange } from '../_helpers';

/**
 * Cron-triggered sync route.
 * Pre-fetches the current month's data so dashboard loads are instant.
 * Also refreshes today's data since it changes throughout the day.
 *
 * Vercel Cron calls this automatically — see vercel.json.
 */
export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron (in production)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // Current month: 1st to last day
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));

  const start = monthStart.toISOString().split('T')[0];
  const end = monthEnd.toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  console.log(`[sync] Starting sync for ${start} to ${end}`);

  try {
    // First: refresh today's data (it changes throughout the day)
    console.log(`[sync] Refreshing today (${today})...`);
    await getEntriesForRange(today, today, true);

    // Then: fill in any other uncached dates (incremental — skips already-cached days)
    console.log(`[sync] Filling uncached dates for ${start} to ${end}...`);
    const result = await getEntriesForRange(start, end);

    console.log(`[sync] Sync complete: ${result.entries.length} total entries for the month`);

    return NextResponse.json({
      ok: true,
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      totalEntries: result.entries.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[sync] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow longer execution for cron jobs (up to 60s on Vercel Hobby, 300s on Pro)
export const maxDuration = 300;
