import { NextRequest, NextResponse } from 'next/server';
import { processEntries } from '@/lib/process';
import { getEntriesForRange } from '../_helpers';

function getPreviousPeriod(start: string, end: string): { start: string; end: string } {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  const durationMs = e.getTime() - s.getTime() + 86400000; // inclusive
  const prevEnd = new Date(s.getTime() - 86400000); // day before start
  const prevStart = new Date(prevEnd.getTime() - durationMs + 86400000);
  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  };
}

export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end parameter' }, { status: 400 });
  }

  try {
    // Fetch current and previous period in parallel
    const prev = getPreviousPeriod(start, end);
    const [current, previous] = await Promise.all([
      getEntriesForRange(start, end),
      getEntriesForRange(prev.start, prev.end).catch(() => null),
    ]);

    const data = processEntries(current.entries, start, end);

    // Add previous period comparison if available
    if (previous) {
      const prevData = processEntries(previous.entries, prev.start, prev.end);
      data.summary.previousPeriod = {
        totalHours: prevData.summary.totalHours,
        clientHours: prevData.summary.clientHours,
        internalHours: prevData.summary.internalHours,
        employeesActive: prevData.summary.employeesActive,
        totalEntries: prevData.summary.totalEntries,
      };
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
