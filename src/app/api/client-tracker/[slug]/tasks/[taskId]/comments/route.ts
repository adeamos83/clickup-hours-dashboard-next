import { NextRequest, NextResponse } from 'next/server';
import { getTrackerClient } from '@/lib/client-tracker/clients';
import { fetchTaskComments, postTaskComment, type RawClickUpComment } from '@/lib/client-tracker/clickup';
import type { TrackerComment } from '@/lib/client-tracker/types';

export const maxDuration = 30;

function normalizeComment(c: RawClickUpComment): TrackerComment {
  const text = c.comment_text
    || (c.comment || []).map((p) => p.text).join('')
    || '';
  return {
    id: c.id,
    author: c.user?.username || 'Unknown',
    authorEmail: c.user?.email,
    text,
    date: c.date ? Number(c.date) : 0,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; taskId: string }> },
) {
  const { slug, taskId } = await params;
  const client = getTrackerClient(slug);
  if (!client) {
    return NextResponse.json({ error: `Unknown client: ${slug}` }, { status: 404 });
  }

  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'CLICKUP_API_TOKEN not configured' }, { status: 500 });
  }

  try {
    const raw = await fetchTaskComments(token, taskId);
    const comments = raw.map(normalizeComment).sort((a, b) => a.date - b.date);
    return NextResponse.json({ comments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const ALLOWED_AUTHORS = new Set(['Ade', 'Dre']);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; taskId: string }> },
) {
  const { slug, taskId } = await params;
  const client = getTrackerClient(slug);
  if (!client) {
    return NextResponse.json({ error: `Unknown client: ${slug}` }, { status: 404 });
  }

  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'CLICKUP_API_TOKEN not configured' }, { status: 500 });
  }

  let body: { author?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const author = (body.author || '').trim();
  const text = (body.text || '').trim();

  if (!author || !ALLOWED_AUTHORS.has(author)) {
    return NextResponse.json({ error: 'Invalid author' }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
  }

  // Prefix the ClickUp comment so the team can see who on the client side sent it.
  const prefixed = `[Client Tracker — ${author}] ${text}`;

  try {
    const result = await postTaskComment(token, taskId, prefixed);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
