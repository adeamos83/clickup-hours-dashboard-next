'use client';

import useSWR from 'swr';
import type { DashboardData } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load dashboard data');
    return r.json();
  });

export function useDashboard(start: string, end: string) {
  return useSWR<DashboardData>(
    start && end ? `/api/dashboard?start=${start}&end=${end}` : null,
    fetcher
  );
}
