/**
 * Date-range report logic for the Client Tracker.
 * Slices a set of TrackerTasks into Completed / Active / Upcoming for a window.
 */

import type { TrackerTask } from './types';

export type ReportPreset =
  | 'this-week'
  | 'last-week'
  | 'last-7'
  | 'last-14'
  | 'next-7'
  | 'next-14'
  | 'this-month'
  | 'custom';

export interface ReportRange {
  preset: ReportPreset;
  label: string;
  /** Inclusive start-of-day timestamp (ms). */
  startMs: number;
  /** Inclusive end-of-day timestamp (ms). */
  endMs: number;
  /** YYYY-MM-DD for the date inputs. */
  startDate: string;
  endDate: string;
}

function toLocalDate(ts: number): Date {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function buildRange(
  preset: ReportPreset,
  nowMs: number = Date.now(),
  customStart?: string,
  customEnd?: string,
): ReportRange {
  const today = toLocalDate(nowMs);

  const shift = (days: number): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  let start: Date;
  let end: Date;
  let label: string;

  switch (preset) {
    case 'last-7':
      start = shift(-6);
      end = today;
      label = 'Last 7 days';
      break;
    case 'last-14':
      start = shift(-13);
      end = today;
      label = 'Last 14 days';
      break;
    case 'next-7':
      start = today;
      end = shift(7);
      label = 'Next 7 days';
      break;
    case 'next-14':
      start = today;
      end = shift(14);
      label = 'Next 14 days';
      break;
    case 'this-week': {
      const dow = today.getDay(); // 0 = Sun, 1 = Mon, ...
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      start = shift(mondayOffset);
      end = shift(mondayOffset + 6);
      label = 'This week';
      break;
    }
    case 'last-week': {
      const dow = today.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      start = shift(mondayOffset - 7);
      end = shift(mondayOffset - 1);
      label = 'Last week';
      break;
    }
    case 'this-month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      label = 'This month';
      break;
    case 'custom':
    default:
      start = customStart ? parseLocal(customStart) : today;
      end = customEnd ? parseLocal(customEnd) : today;
      label = 'Custom range';
      break;
  }

  if (end < start) {
    const tmp = end;
    end = start;
    start = tmp;
  }

  return {
    preset,
    label,
    startMs: start.getTime(),
    endMs: endOfDay(end).getTime(),
    startDate: fmtISO(start),
    endDate: fmtISO(end),
  };
}

export interface ReportBuckets {
  completed: TrackerTask[];
  active: TrackerTask[];
  upcoming: TrackerTask[];
}

export function bucketTasksForRange(tasks: TrackerTask[], range: ReportRange): ReportBuckets {
  // Only count top-level tasks so the report matches the Kanban counts.
  const topLevel = tasks.filter((t) => !t.parentId);

  const completed = topLevel
    .filter(
      (t) =>
        t.bucket === 'done' &&
        t.dateClosed !== null &&
        t.dateClosed >= range.startMs &&
        t.dateClosed <= range.endMs,
    )
    .sort((a, b) => (b.dateClosed ?? 0) - (a.dateClosed ?? 0));

  const active = topLevel
    .filter(
      (t) =>
        t.bucket !== 'done' &&
        t.dateUpdated !== null &&
        t.dateUpdated >= range.startMs &&
        t.dateUpdated <= range.endMs,
    )
    .sort((a, b) => (b.dateUpdated ?? 0) - (a.dateUpdated ?? 0));

  const upcoming = topLevel
    .filter(
      (t) =>
        t.bucket !== 'done' &&
        t.dueDate !== null &&
        t.dueDate >= range.startMs &&
        t.dueDate <= range.endMs,
    )
    .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));

  return { completed, active, upcoming };
}

export const REPORT_PRESETS: { value: ReportPreset; label: string }[] = [
  { value: 'this-week', label: 'This week' },
  { value: 'last-week', label: 'Last week' },
  { value: 'last-7', label: 'Last 7 days' },
  { value: 'last-14', label: 'Last 14 days' },
  { value: 'next-7', label: 'Next 7 days' },
  { value: 'next-14', label: 'Next 14 days' },
  { value: 'this-month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];
