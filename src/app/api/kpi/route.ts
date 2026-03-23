import { NextRequest, NextResponse } from 'next/server';
import { processKPIs } from '@/lib/kpi';
import { getEntriesForRange, buildRetainerLookup } from '../_helpers';

export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end parameter' }, { status: 400 });
  }

  try {
    const [{ entries }, retainerLookup] = await Promise.all([
      getEntriesForRange(start, end),
      buildRetainerLookup(),
    ]);
    const data = processKPIs(entries, start, end, retainerLookup);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
