import { NextRequest, NextResponse } from 'next/server';
import { processClientDetail } from '@/lib/process';
import { getEntriesForRange, buildRetainerLookup } from '../_helpers';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!name || !start || !end) {
    return NextResponse.json({ error: 'Missing name, start, or end parameter' }, { status: 400 });
  }

  try {
    const [{ entries }, retainerLookup] = await Promise.all([
      getEntriesForRange(start, end),
      buildRetainerLookup(),
    ]);
    const data = processClientDetail(entries, name, start, end, retainerLookup);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
