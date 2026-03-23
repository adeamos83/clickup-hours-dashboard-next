'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useDateRange } from '@/hooks/use-date-range';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DateBar() {
  const { start, end, updateDates } = useDateRange();
  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);
  const [refreshing, setRefreshing] = useState(false);

  const { data: syncStatus } = useSWR('/api/sync/status', fetcher, {
    refreshInterval: 30000,
  });

  useEffect(() => {
    setLocalStart(start);
    setLocalEnd(end);
  }, [start, end]);

  const handleLoad = () => {
    updateDates(localStart, localEnd);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`/api/sync/refresh?start=${start}&end=${end}`, { method: 'POST' });
      updateDates(start, end);
    } finally {
      setRefreshing(false);
    }
  };

  const syncInfo = syncStatus
    ? `${syncStatus.totalCachedEntries.toLocaleString()} entries cached · ${syncStatus.totalCachedTasks.toLocaleString()} tasks${syncStatus.lastSync?.completedAt ? ' · last synced ' + getTimeAgo(syncStatus.lastSync.completedAt) : ''}`
    : '';

  return (
    <div className="flex h-14 items-center gap-4 border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Start</span>
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="rounded-[10px] border border-border bg-[#F9FAFB] px-2.5 py-1.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">End</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="rounded-[10px] border border-border bg-[#F9FAFB] px-2.5 py-1.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <button
        onClick={handleLoad}
        className="rounded-[10px] bg-primary px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-110 active:brightness-95"
      >
        Load Data
      </button>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>

      <div className="flex-1" />

      {syncInfo && (
        <span className="text-[11px] text-muted-foreground">{syncInfo}</span>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
