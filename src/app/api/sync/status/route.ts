import { NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/db';
import { ensureSchema } from '../../_helpers';

export async function GET() {
  try {
    await ensureSchema();
    const status = await getSyncStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
