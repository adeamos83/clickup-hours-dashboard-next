'use client';

import { useDateRange } from '@/hooks/use-date-range';
import { useDashboard } from '@/hooks/use-dashboard';
import { SummaryCards } from './summary-cards';
import { EmployeeChart } from './employee-chart';
import { ClientChart } from './client-chart';
import { DailyTrendChart } from './daily-trend-chart';
import { InternalBreakdown } from './internal-breakdown';
import { TopTasksTable } from './top-tasks-table';
import { EmployeeClientTable } from './employee-client-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DashboardContent() {
  const { start, end, loaded } = useDateRange();
  const { data, error, isLoading } = useDashboard(start, end);

  if (!loaded) return null;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load dashboard data. Check your API configuration.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={data.summary} />

      {/* Row 1: Employee Hours + Hours by Client (donut) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EmployeeChart employees={data.employees} />
        <ClientChart clients={data.clients} />
      </div>

      {/* Row 2: Top Tasks + Client vs Internal Split */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopTasksTable tasks={data.topTasks} />
        <InternalBreakdown categories={data.internalCategories} />
      </div>

      {/* Row 3: Daily Hours Trend — full width */}
      <DailyTrendChart dailyTrend={data.dailyTrend} />

      {/* Row 4: Employee × Client Breakdown table */}
      <EmployeeClientTable data={data.employeeByClient} />
    </div>
  );
}
