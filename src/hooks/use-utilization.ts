'use client';

import useSWR from 'swr';
import type { UtilizationData } from '@/lib/types';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load utilization data');
    return r.json();
  });

export function useUtilization(start: string, end: string) {
  return useSWR<UtilizationData>(
    start && end ? `/api/utilization?start=${start}&end=${end}` : null,
    fetcher
  );
}
