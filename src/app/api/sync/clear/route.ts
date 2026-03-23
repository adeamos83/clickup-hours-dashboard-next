import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/db';
import { ensureSchema } from '../../_helpers';

export async function POST() {
  try {
    await ensureSchema();
    await clearCache();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
