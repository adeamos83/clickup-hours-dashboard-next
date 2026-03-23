import { NextRequest, NextResponse } from 'next/server';
import { processEmployeeDetail } from '@/lib/process';
import { getEntriesForRange } from '../_helpers';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');

  if (!name || !start || !end) {
    return NextResponse.json({ error: 'Missing name, start, or end parameter' }, { status: 400 });
  }

  try {
    const { entries } = await getEntriesForRange(start, end);
    const data = processEmployeeDetail(entries, name, start, end);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
