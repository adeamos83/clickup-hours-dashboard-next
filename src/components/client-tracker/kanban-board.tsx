'use client';

import { useMemo } from 'react';
import type { TrackerBucket, TrackerTask } from '@/lib/client-tracker/types';
import { TaskCard } from './task-card';

const BUCKET_META: Record<TrackerBucket, { label: string; hint: string; tone: string }> = {
  todo: {
    label: 'To Do',
    hint: 'Not yet started',
    tone: 'bg-slate-500',
  },
  in_progress: {
    label: 'In Progress',
    hint: 'Being worked on',
    tone: 'bg-blue-500',
  },
  review: {
    label: 'Review',
    hint: 'Awaiting review or approval',
    tone: 'bg-amber-500',
  },
  done: {
    label: 'Done',
    hint: 'Complete',
    tone: 'bg-primary',
  },
};

const BUCKET_ORDER: TrackerBucket[] = ['todo', 'in_progress', 'review', 'done'];

function groupAndSort(tasks: TrackerTask[]): Record<TrackerBucket, TrackerTask[]> {
  const now = Date.now();
  const topLevel = tasks.filter((t) => !t.parentId);
  const groups: Record<TrackerBucket, TrackerTask[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };
  for (const t of topLevel) groups[t.bucket].push(t);

  for (const b of BUCKET_ORDER) {
    groups[b].sort((a, z) => {
      const aOverdue = a.dueDate && a.dueDate < now && a.bucket !== 'done';
      const zOverdue = z.dueDate && z.dueDate < now && z.bucket !== 'done';
      if (aOverdue && !zOverdue) return -1;
      if (!aOverdue && zOverdue) return 1;
      if (a.dueDate && z.dueDate) return a.dueDate - z.dueDate;
      if (a.dueDate) return -1;
      if (z.dueDate) return 1;
      return (z.dateUpdated || 0) - (a.dateUpdated || 0);
    });
  }
  return groups;
}

export function KanbanBoard({
  tasks,
  onTaskClick,
}: {
  tasks: TrackerTask[];
  onTaskClick: (task: TrackerTask) => void;
}) {
  const byBucket = useMemo(() => groupAndSort(tasks), [tasks]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BUCKET_ORDER.map((bucket) => {
        const meta = BUCKET_META[bucket];
        const items = byBucket[bucket];
        return (
          <div
            key={bucket}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-3"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${meta.tone}`} />
                <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background/50 px-3 py-6 text-center text-xs text-muted-foreground">
                  {meta.hint}
                </div>
              ) : (
                items.map((t) => <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
