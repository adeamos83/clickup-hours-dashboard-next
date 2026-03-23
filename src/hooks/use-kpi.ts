'use client';

import useSWR from 'swr';
import type { KPIData } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load KPI data');
    return r.json();
  });

export function useKpi(start: string, end: string) {
  return useSWR<KPIData>(
    start && end ? `/api/kpi?start=${start}&end=${end}` : null,
    fetcher
  );
}
