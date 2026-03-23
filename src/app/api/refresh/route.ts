import { NextRequest, NextResponse } from 'next/server';
import { getEntriesForRange } from '../_helpers';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing start or end' }, { status: 400 });
    }

    const { entries } = await getEntriesForRange(start, end, true);
    return NextResponse.json({ refreshed: true, entries: entries.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
