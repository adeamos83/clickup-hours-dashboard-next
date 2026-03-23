'use client';

import { useDateRange } from '@/hooks/use-date-range';
import { useKpi } from '@/hooks/use-kpi';
import { KpiSummaryCards } from './kpi-summary-cards';
import { SalaryVsRevenueChart } from './salary-vs-revenue-chart';
import { CapacityChart } from './capacity-chart';
import { RoiChart } from './roi-chart';
import { HiringForecastChart } from './hiring-forecast-chart';
import { RevenuePerHourChart } from './revenue-per-hour-chart';
import { EffectiveCostChart } from './effective-cost-chart';
import { SalaryScopingTable } from './salary-scoping-table';
import { CapacityTable } from './capacity-table';
import { PositionForecastTable } from './position-forecast-table';
import { ClientValueTable } from './client-value-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function KpiContent() {
  const { start, end, loaded } = useDateRange();
  const { data, error, isLoading } = useKpi(start, end);

  if (!loaded) return null;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load KPI data.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Loading KPI data from ClickUp...</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 12 Summary Cards (2 rows of 6) */}
      <KpiSummaryCards summary={data.summary} />

      {/* Row 1: Salary Cost vs Revenue + Team Billable Capacity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalaryVsRevenueChart data={data.salaryScoping} />
        <CapacityChart data={data.capacityPlanning} />
      </div>

      {/* Row 2: Employee ROI + Department Hiring Forecast */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RoiChart data={data.salaryScoping} />
        <HiringForecastChart data={data.positionForecast} />
      </div>

      {/* Row 3: Revenue per Hour + Effective Cost per Billable Hour */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenuePerHourChart data={data.clientValueAnalysis} />
        <EffectiveCostChart data={data.salaryScoping} />
      </div>

      {/* Salary Scoping & ROI Analysis table */}
      <SalaryScopingTable data={data.salaryScoping} />

      {/* Capacity Planning & Availability table */}
      <CapacityTable data={data.capacityPlanning} />

      {/* Position Forecasting & Hiring Needs table */}
      <PositionForecastTable data={data.positionForecast} />

      {/* Client Value Analysis table */}
      <ClientValueTable data={data.clientValueAnalysis} />
    </div>
  );
}
