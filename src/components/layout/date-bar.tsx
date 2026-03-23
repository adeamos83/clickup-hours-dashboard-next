'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { useDateRange } from '@/hooks/use-date-range';
import { useSWRConfig } from 'swr';

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getPresetRange(key: string): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = fmt(today);

  switch (key) {
    case 'today':
      return { start: end, end };
    case 'yesterday': {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return { start: fmt(d), end: fmt(d) };
    }
    case '7days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { start: fmt(d), end };
    }
    case '14days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 13);
      return { start: fmt(d), end };
    }
    case '30days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { start: fmt(d), end };
    }
    case '90days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 89);
      return { start: fmt(d), end };
    }
    case '6months': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return { start: fmt(d), end };
    }
    case 'this-week': {
      const d = new Date(today);
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
      return { start: fmt(d), end };
    }
    case 'last-week': {
      const d = new Date(today);
      const day = d.getDay();
      const lastMonday = new Date(d);
      lastMonday.setDate(d.getDate() - (day === 0 ? 6 : day - 1) - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { start: fmt(lastMonday), end: fmt(lastSunday) };
    }
    case 'this-month': {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmt(d), end };
    }
    case 'last-month': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(first), end: fmt(last) };
    }
    default:
      return { start: end, end };
  }
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this-week', label: 'This Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '14days', label: 'Last 14 Days' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: '30days', label: 'Last 30 Days' },
  { key: '90days', label: 'Last 90 Days' },
  { key: '6months', label: 'Last 6 Months' },
];

export function DateBar() {
  const { start, end, updateDates } = useDateRange();
  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);
  const [refreshing, setRefreshing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    setLocalStart(start);
    setLocalEnd(end);
  }, [start, end]);

  const handleLoad = () => {
    updateDates(localStart, localEnd);
  };

  const handlePreset = (key: string) => {
    const { start: s, end: e } = getPresetRange(key);
    setLocalStart(s);
    setLocalEnd(e);
    updateDates(s, e);
    setShowPresets(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`/api/refresh?start=${start}&end=${end}`, { method: 'POST' });
      mutate((key: unknown) => typeof key === 'string' && key.startsWith('/api/'));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex h-14 items-center gap-4 border-b border-border bg-card px-6">
      {/* Quick presets dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-sm transition-all hover:bg-muted"
        >
          Quick Select
          <ChevronDown className="h-3 w-3" />
        </button>
        {showPresets && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-[10px] border border-border bg-card py-1 shadow-lg">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePreset(p.key)}
                  className="block w-full px-3 py-1.5 text-left text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Custom date inputs */}
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
        title="Force re-fetch from ClickUp (ignores cache)"
        className="flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>

      <div className="flex-1" />
    </div>
  );
}
