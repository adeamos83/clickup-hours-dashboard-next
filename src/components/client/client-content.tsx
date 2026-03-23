'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { ClientCharts } from './client-charts';
import { ClientDailyChart } from './client-daily-chart';
import { ClientEmployeeTable } from './client-employee-table';

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); });

interface Props {
  name?: string;
  start?: string;
  end?: string;
}

function fmt$(n: number | null) {
  if (n === null) return '—';
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function ClientContent({ name, start, end }: Props) {
  const { data, error, isLoading } = useSWR(
    name && start && end ? `/api/client?name=${encodeURIComponent(name)}&start=${start}&end=${end}` : null,
    fetcher
  );

  if (!name || !start || !end) {
    return <Alert><AlertDescription>Missing URL parameters. Go back and click a client name.</AlertDescription></Alert>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>Failed to load client data.</AlertDescription></Alert>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Loading client data from ClickUp...</span>
        </div>
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Hours', value: data.totalHours.toFixed(1) },
    { label: 'Employees', value: String(data.employees.length) },
    { label: 'Top Contributor', value: data.employees[0]?.name || '—' },
    ...(data.budget ? [
      { label: 'Budget Hours', value: data.budget.budgetHours.toFixed(1) },
      { label: 'Budget Used', value: `${data.budget.budgetUsedPct}%`, color: data.budget.budgetUsedPct > 100 ? 'text-[#df1b41]' : data.budget.budgetUsedPct > 80 ? 'text-[#f5be58]' : 'text-[#3ecf8e]' },
    ] : []),
    { label: 'Labor Cost', value: fmt$(data.cost.totalCost) },
    { label: 'Profit', value: fmt$(data.cost.profit), color: (data.cost.profit ?? 0) >= 0 ? 'text-[#3ecf8e]' : 'text-[#df1b41]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{data.client}</h1>
          <p className="text-sm text-muted-foreground">{start} to {end}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{c.label}</CardTitle></CardHeader>
            <CardContent><div className={`text-lg font-bold ${c.color || ''}`}>{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <ClientCharts employees={data.employees} topTasks={data.topTasks} />
      <ClientDailyChart dailyTrend={data.dailyTrend} />
      <ClientEmployeeTable employees={data.employees} start={start} end={end} />
    </div>
  );
}
