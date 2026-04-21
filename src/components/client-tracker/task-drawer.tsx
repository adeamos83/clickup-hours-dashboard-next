'use client';

import { useEffect } from 'react';
import { X, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import type { TrackerTask } from '@/lib/client-tracker/types';
import { CommentThread } from './comment-thread';

function formatDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TaskDrawer({
  slug,
  task,
  allTasks,
  onClose,
}: {
  slug: string;
  task: TrackerTask | null;
  allTasks: TrackerTask[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!task) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    // Lock body scroll while drawer is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [task, onClose]);

  if (!task) return null;

  const subtasks = allTasks.filter((t) => t.parentId === task.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-[540px] flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: task.status.color }}
              >
                {task.status.status}
              </span>
              {task.listName && (
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {task.listName}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold leading-tight">{task.name}</h2>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={task.url}
              target="_blank"
              rel="noreferrer"
              title="Open in ClickUp"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Due date
                </div>
                <div className="font-medium">{formatDate(task.dueDate)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Priority
                </div>
                <div className="font-medium capitalize">
                  {task.priority?.priority || '—'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  Assigned to
                </div>
                {task.assignees.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Unassigned</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {task.assignees.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-card px-2 py-1 text-xs"
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                          style={{ backgroundColor: a.color || '#94a3b8' }}
                        >
                          {a.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.profilePicture}
                              alt={a.username}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            (a.initials || a.username.slice(0, 2)).toUpperCase()
                          )}
                        </span>
                        {a.username}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <div className="mb-2 text-sm font-semibold">Description</div>
                <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm text-foreground">
                  {task.description}
                </div>
              </div>
            )}

            {/* Subtasks */}
            {subtasks.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold">
                  Subtasks{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({subtasks.filter((s) => s.bucket === 'done').length} / {subtasks.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {subtasks.map((s) => {
                    const isDone = s.bucket === 'done';
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={isDone ? 'line-through text-muted-foreground' : ''}>
                          {s.name}
                        </span>
                        <span
                          className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: s.status.color }}
                        >
                          {s.status.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comment thread */}
            <CommentThread slug={slug} taskId={task.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
