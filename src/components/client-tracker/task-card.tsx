'use client';

import { Calendar, MessageSquare, ListChecks, AlertTriangle } from 'lucide-react';
import type { TrackerTask } from '@/lib/client-tracker/types';

function formatDueDate(ts: number): { label: string; tone: 'normal' | 'soon' | 'overdue' } {
  const now = Date.now();
  const diffDays = Math.round((ts - now) / (24 * 60 * 60 * 1000));
  const date = new Date(ts);
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diffDays < 0) return { label, tone: 'overdue' };
  if (diffDays <= 7) return { label, tone: 'soon' };
  return { label, tone: 'normal' };
}

function priorityBadge(priority: string): { label: string; className: string } | null {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', className: 'bg-destructive/10 text-destructive' };
    case 'high':
      return { label: 'High', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' };
    case 'normal':
      return null;
    case 'low':
      return { label: 'Low', className: 'bg-muted text-muted-foreground' };
    default:
      return null;
  }
}

export function TaskCard({ task, onClick }: { task: TrackerTask; onClick: () => void }) {
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  const badge = task.priority ? priorityBadge(task.priority.priority) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-medium leading-snug text-foreground">
          {task.name}
        </div>
        {badge && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      {task.listName && (
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
          {task.listName}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) => (
            <span
              key={a.id}
              title={a.username}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-white"
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
          ))}
          {task.assignees.length > 3 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
              +{task.assignees.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.subtaskProgress && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {task.subtaskProgress.done}/{task.subtaskProgress.total}
            </span>
          )}
          {due && (
            <span
              className={`flex items-center gap-1 ${
                due.tone === 'overdue'
                  ? 'text-destructive'
                  : due.tone === 'soon'
                  ? 'text-amber-600 dark:text-amber-400'
                  : ''
              }`}
            >
              {due.tone === 'overdue' ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {due.label}
            </span>
          )}
          <MessageSquare className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-80" />
        </div>
      </div>
    </button>
  );
}
