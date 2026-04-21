'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { LayoutGrid, Loader2, RefreshCcw, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { TrackerData, TrackerTask } from '@/lib/client-tracker/types';
import { TrackerSummaryPanel } from './tracker-summary';
import { KanbanBoard } from './kanban-board';
import { TaskDrawer } from './task-drawer';
import { TrackerReport } from './tracker-report';

type ViewMode = 'board' | 'report';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed');
    return r.json();
  });

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'never';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function TrackerContent({ slug, initialName }: { slug: string; initialName: string }) {
  const { data, error, isLoading, mutate, isValidating } = useSWR<TrackerData>(
    `/api/client-tracker/${slug}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [openTask, setOpenTask] = useState<TrackerTask | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<ViewMode>('board');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/client-tracker/${slug}?refresh=1`);
      if (!res.ok) throw new Error('Failed to refresh');
      const fresh = (await res.json()) as TrackerData;
      await mutate(fresh, { revalidate: false });
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load {initialName} tasks.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading {initialName} tasks from ClickUp…
          </span>
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.client.name}</h1>
          {data.client.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {data.client.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Updated {formatSyncTime(data.lastSynced)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isValidating}
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <TrackerSummaryPanel summary={data.summary} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {view === 'board' ? 'Tasks' : 'Weekly Report'}
          </h2>
          <ViewToggle view={view} onChange={setView} />
        </div>
        {view === 'board' ? (
          <KanbanBoard tasks={data.tasks} onTaskClick={setOpenTask} />
        ) : (
          <TrackerReport tasks={data.tasks} onTaskClick={setOpenTask} />
        )}
      </div>

      <TaskDrawer
        slug={slug}
        task={openTask}
        allTasks={data.tasks}
        onClose={() => setOpenTask(null)}
      />
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { value: ViewMode; label: string; icon: React.ElementType }[] = [
    { value: 'board', label: 'Board', icon: LayoutGrid },
    { value: 'report', label: 'Report', icon: FileText },
  ];
  return (
    <div className="flex overflow-hidden rounded-lg border border-border">
      {options.map((opt) => {
        const active = view === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
