'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmployeeCharts } from './employee-charts';
import { EmployeeDailyChart } from './employee-daily-chart';
import { EmployeeTasksTable } from './employee-tasks-table';

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); });

interface Props {
  name?: string;
  start?: string;
  end?: string;
}

export function EmployeeContent({ name, start, end }: Props) {
  const { data, error, isLoading } = useSWR(
    name && start && end ? `/api/employee?name=${encodeURIComponent(name)}&start=${start}&end=${end}` : null,
    fetcher
  );

  if (!name || !start || !end) {
    return <Alert><AlertDescription>Missing URL parameters. Go back and click an employee name.</AlertDescription></Alert>;
  }

  if (error) {
    return <Alert variant="destructive"><AlertDescription>Failed to load employee data.</AlertDescription></Alert>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Hours', value: data.totalHours.toFixed(1) },
    { label: 'Client Hours', value: data.clientHours.toFixed(1) },
    { label: 'Internal Hours', value: data.internalHours.toFixed(1) },
    { label: 'Utilization', value: `${data.utilization.rate}%`, color: data.utilization.rate > 60 ? 'text-[#3ecf8e]' : 'text-[#f5be58]' },
    { label: 'Hourly Cost', value: data.utilization.hourlyCost !== null ? `$${data.utilization.hourlyCost.toFixed(0)}` : '—' },
    { label: 'Effective $/hr', value: data.utilization.effectiveHourlyCost !== null ? `$${data.utilization.effectiveHourlyCost.toFixed(0)}` : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{data.employee}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{data.utilization.role}</Badge>
            <Badge variant="outline">{data.utilization.department}</Badge>
            <Badge variant="outline">{data.utilization.type}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{c.label}</CardTitle></CardHeader>
            <CardContent><div className={`text-lg font-bold ${c.color || ''}`}>{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <EmployeeCharts clients={data.clients} internalCategories={data.internalCategories} />
      <EmployeeDailyChart dailyTrend={data.dailyTrend} />
      <EmployeeTasksTable tasks={data.topTasks} start={start} end={end} />
    </div>
  );
}
