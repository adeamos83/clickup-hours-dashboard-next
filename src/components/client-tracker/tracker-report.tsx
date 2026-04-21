'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TrackerTask } from '@/lib/client-tracker/types';
import {
  bucketTasksForRange,
  buildRange,
  REPORT_PRESETS,
  type ReportPreset,
  type ReportRange,
} from '@/lib/client-tracker/report';

function formatRangeLabel(range: ReportRange): string {
  const start = new Date(range.startMs);
  const end = new Date(range.endMs);
  const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined,
  });
  return `${startStr} — ${endStr}`;
}

function formatShortDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function statusPillColor(color: string): { background: string } {
  return { background: color };
}

function TaskRow({
  task,
  rightLabel,
  onClick,
}: {
  task: TrackerTask;
  rightLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-accent/40"
    >
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
        style={statusPillColor(task.status.color)}
      >
        {task.status.status}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{task.name}</div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.listName && <span className="truncate">{task.listName}</span>}
          {task.assignees.length > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">
                {task.assignees
                  .slice(0, 2)
                  .map((a) => a.username)
                  .join(', ')}
                {task.assignees.length > 2 ? ` +${task.assignees.length - 2}` : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
        {rightLabel}
      </div>
    </button>
  );
}

function ReportSection({
  title,
  caption,
  icon,
  tone,
  tasks,
  emptyText,
  rightLabel,
  onTaskClick,
}: {
  title: string;
  caption: string;
  icon: React.ReactNode;
  tone: string;
  tasks: TrackerTask[];
  emptyText: string;
  rightLabel: (t: TrackerTask) => string;
  onTaskClick: (t: TrackerTask) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
              {icon}
            </span>
            <div>
              <div className="text-sm font-semibold">
                {title} <span className="text-muted-foreground">({tasks.length})</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{caption}</div>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                rightLabel={rightLabel(t)}
                onClick={() => onTaskClick(t)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TrackerReport({
  tasks,
  onTaskClick,
}: {
  tasks: TrackerTask[];
  onTaskClick: (t: TrackerTask) => void;
}) {
  const [preset, setPreset] = useState<ReportPreset>('this-week');
  const [presetOpen, setPresetOpen] = useState(false);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Compute the initial custom defaults once based on "today"
  const todayMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const range = useMemo(
    () =>
      buildRange(
        preset,
        todayMs,
        customStart || undefined,
        customEnd || undefined,
      ),
    [preset, todayMs, customStart, customEnd],
  );

  const buckets = useMemo(() => bucketTasksForRange(tasks, range), [tasks, range]);

  const totalInReport = buckets.completed.length + buckets.active.length + buckets.upcoming.length;

  const handlePresetPick = (next: ReportPreset) => {
    setPreset(next);
    setPresetOpen(false);
    if (next === 'custom') {
      const defaultRange = buildRange('this-week', todayMs);
      if (!customStart) setCustomStart(defaultRange.startDate);
      if (!customEnd) setCustomEnd(defaultRange.endDate);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date range bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          Reporting period
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-muted"
          >
            {REPORT_PRESETS.find((p) => p.value === preset)?.label ?? 'Custom range'}
            <ChevronDown className="h-3 w-3" />
          </button>
          {presetOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPresetOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg">
                {REPORT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePresetPick(p.value)}
                    className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors ${
                      p.value === preset
                        ? 'bg-accent text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        <div className="ml-auto text-[12px] text-muted-foreground tabular-nums">
          {formatRangeLabel(range)} · {totalInReport} tasks in report
        </div>
      </div>

      {/* Summary row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="text-xl font-bold text-primary">{buckets.completed.length}</div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-primary opacity-60" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="text-xs text-muted-foreground">Active</div>
              <div className="text-xl font-bold">{buckets.active.length}</div>
            </div>
            <Loader2 className="h-5 w-5 text-muted-foreground opacity-60" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
              <div className="text-xl font-bold">{buckets.upcoming.length}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-60" />
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <ReportSection
        title="Completed"
        caption={`Finished between ${formatRangeLabel(range)}`}
        icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
        tone="bg-primary/10"
        tasks={buckets.completed}
        emptyText="Nothing was completed in this window."
        rightLabel={(t) => (t.dateClosed ? `Closed ${formatShortDate(t.dateClosed)}` : '')}
        onTaskClick={onTaskClick}
      />

      <ReportSection
        title="Active"
        caption={`Tasks that were worked on between ${formatRangeLabel(range)}`}
        icon={<Loader2 className="h-4 w-4 text-blue-500" />}
        tone="bg-blue-500/10"
        tasks={buckets.active}
        emptyText="No active work updated in this window."
        rightLabel={(t) => (t.dateUpdated ? `Updated ${formatShortDate(t.dateUpdated)}` : '')}
        onTaskClick={onTaskClick}
      />

      <ReportSection
        title="Upcoming"
        caption={`Due between ${formatRangeLabel(range)}`}
        icon={<ArrowRight className="h-4 w-4 text-amber-500" />}
        tone="bg-amber-500/10"
        tasks={buckets.upcoming}
        emptyText="Nothing is due in this window."
        rightLabel={(t) => (t.dueDate ? `Due ${formatShortDate(t.dueDate)}` : '')}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
