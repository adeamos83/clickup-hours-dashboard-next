'use client';

import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TrackerSummary } from '@/lib/client-tracker/types';

export function TrackerSummaryPanel({ summary }: { summary: TrackerSummary }) {
  const cards = [
    {
      label: 'Total Tasks',
      value: summary.totalTasks,
      icon: ListTodo,
      tone: 'text-foreground',
    },
    {
      label: 'Completed',
      value: `${summary.completedTasks} / ${summary.totalTasks}`,
      icon: CheckCircle2,
      tone: 'text-primary',
    },
    {
      label: 'Due Soon',
      value: summary.dueSoon,
      icon: Clock,
      tone: summary.dueSoon > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: AlertTriangle,
      tone: summary.overdue > 0 ? 'text-destructive' : 'text-foreground',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Overall progress</div>
              <div className="text-2xl font-bold">
                {summary.progressPct}%{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({summary.completedTasks} of {summary.totalTasks} tasks complete)
                </span>
              </div>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${summary.progressPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className={`text-xl font-bold ${c.tone}`}>{c.value}</div>
              </div>
              <c.icon className={`h-5 w-5 ${c.tone} opacity-60`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-list progress */}
      {summary.lists.length > 0 && (
        <Card>
          <CardContent className="space-y-3 py-5">
            <div className="text-sm font-semibold text-foreground">By Workstream</div>
            <div className="space-y-2.5">
              {summary.lists.map((list) => {
                const pct = list.total > 0 ? Math.round((list.done / list.total) * 100) : 0;
                return (
                  <div key={list.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{list.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {list.done} / {list.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
