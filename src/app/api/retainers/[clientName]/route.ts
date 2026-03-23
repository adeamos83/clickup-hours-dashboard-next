import { NextRequest, NextResponse } from 'next/server';
import { getRetainerOverride, upsertRetainerOverride, deleteRetainerOverride } from '@/lib/db';
import { getDefaultRetainer } from '@/lib/config';
import { ensureSchema } from '../../_helpers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientName: string }> }
) {
  try {
    await ensureSchema();
    const { clientName } = await params;
    const name = decodeURIComponent(clientName);
    const override = await getRetainerOverride(name);
    const defaults = getDefaultRetainer(name);

    return NextResponse.json({
      clientName: name,
      retainerHours: override?.retainer_hours ?? defaults?.retainerHours ?? null,
      retainerRevenue: override?.retainer_revenue ?? defaults?.retainerRevenue ?? null,
      isOverridden: !!override,
      defaults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ clientName: string }> }
) {
  try {
    await ensureSchema();
    const { clientName } = await params;
    const name = decodeURIComponent(clientName);
    const body = await req.json();
    const { retainerHours, retainerRevenue } = body;

    if (retainerHours === undefined || retainerRevenue === undefined) {
      return NextResponse.json({ error: 'Missing retainerHours or retainerRevenue' }, { status: 400 });
    }

    await upsertRetainerOverride(name, retainerHours, retainerRevenue);
    return NextResponse.json({ success: true, clientName: name, retainerHours, retainerRevenue });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientName: string }> }
) {
  try {
    await ensureSchema();
    const { clientName } = await params;
    const name = decodeURIComponent(clientName);
    await deleteRetainerOverride(name);
    return NextResponse.json({ success: true, clientName: name });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
