'use client';

import { useDateRange } from '@/hooks/use-date-range';
import { useUtilization } from '@/hooks/use-utilization';
import { UtilizationSummary } from './utilization-summary';
import { EmployeeUtilizationChart } from './employee-utilization-chart';
import { DepartmentChart } from './department-chart';
import { BudgetStatusChart } from './budget-status-chart';
import { ProfitabilityChart } from './profitability-chart';
import { EmployeeUtilizationTable } from './employee-utilization-table';
import { ClientUtilizationTable } from './client-utilization-table';
import { DepartmentSummaryTable } from './department-summary-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function UtilizationContent() {
  const { start, end, loaded } = useDateRange();
  const { data, error, isLoading } = useUtilization(start, end);

  if (!loaded) return null;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load utilization data.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Loading utilization data from ClickUp...</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <UtilizationSummary summary={data.summary} />

      {/* Row 1: Employee Utilization + Department Utilization */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EmployeeUtilizationChart employees={data.employeeUtilization} />
        <DepartmentChart departments={data.departmentBreakdown} />
      </div>

      {/* Row 2: Client Budget Status + Profitability */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetStatusChart clients={data.clientUtilization} />
        <ProfitabilityChart clients={data.clientUtilization} />
      </div>

      {/* Employee Utilization Detail table */}
      <EmployeeUtilizationTable employees={data.employeeUtilization} />

      {/* Client Budget Detail table */}
      <ClientUtilizationTable clients={data.clientUtilization} />

      {/* Department Summary table */}
      <DepartmentSummaryTable departments={data.departmentBreakdown} />
    </div>
  );
}
