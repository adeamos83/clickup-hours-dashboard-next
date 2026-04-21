'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthorSelector, useTrackerAuthor } from './author-selector';
import type { TrackerComment } from '@/lib/client-tracker/types';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed');
    return r.json();
  });

function formatTimestamp(ts: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CommentThread({ slug, taskId }: { slug: string; taskId: string }) {
  const { data, error, isLoading, mutate } = useSWR<{ comments: TrackerComment[] }>(
    `/api/client-tracker/${slug}/tasks/${taskId}/comments`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [author, setAuthor] = useTrackerAuthor();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/client-tracker/${slug}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to post comment');
      }
      setText('');
      // Optimistically add to the thread; revalidate so the ClickUp-returned version appears
      const optimistic: TrackerComment = {
        id: `tmp-${Date.now()}`,
        author,
        text: `[Client Tracker — ${author}] ${trimmed}`,
        date: Date.now(),
      };
      await mutate(
        (cur) => ({ comments: [...(cur?.comments || []), optimistic] }),
        { revalidate: true },
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Conversation</h3>
        <AuthorSelector author={author} onChange={setAuthor} />
      </div>

      <div className="space-y-2">
        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Failed to load comments.
          </div>
        )}
        {data && data.comments.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            No comments yet. Start the conversation below.
          </div>
        )}
        {data?.comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{c.author}</span>
              <span className="text-muted-foreground">{formatTimestamp(c.date)}</span>
            </div>
            <div className="whitespace-pre-wrap text-[13px] text-foreground">{c.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Leave a note or ask a question…"
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={submitting}
        />
        {submitError && <div className="text-xs text-destructive">{submitError}</div>}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Visible to the Geek Power Studios team in ClickUp.
          </span>
          <Button type="submit" size="sm" disabled={!text.trim() || submitting}>
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Post comment
          </Button>
        </div>
      </form>
    </div>
  );
}
