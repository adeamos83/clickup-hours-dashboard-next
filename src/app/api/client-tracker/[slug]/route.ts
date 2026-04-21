import { NextRequest, NextResponse } from 'next/server';
import { getTrackerClient } from '@/lib/client-tracker/clients';
import { getFolderSyncTime, getFolderTasks } from '@/lib/client-tracker/db';
import { syncFolderTasks } from '@/lib/client-tracker/sync';
import { buildTrackerData } from '@/lib/client-tracker/process';

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const refresh = req.nextUrl.searchParams.get('refresh') === '1';

  const client = getTrackerClient(slug);
  if (!client) {
    return NextResponse.json({ error: `Unknown client: ${slug}` }, { status: 404 });
  }

  try {
    // If a manual refresh was requested OR we've never synced before, sync now.
    const existingSync = await getFolderSyncTime(client.folderId);
    if (refresh || !existingSync) {
      await syncFolderTasks(client.folderId);
    }

    const [rawTasks, lastSynced] = await Promise.all([
      getFolderTasks(client.folderId),
      getFolderSyncTime(client.folderId),
    ]);

    const data = buildTrackerData(client, rawTasks, lastSynced);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
