'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { KPIData } from '@/lib/types';

function fmt$(n: number) {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const TIPS: Record<string, string> = {
  'Team Utilization': 'Percentage of total worked hours spent on billable client work across the entire team. Target: 60-80%.',
  'Revenue / Employee': 'Average revenue generated per employee in the selected period. Higher means each person is driving more income.',
  'Avg Cost / Billable Hr': 'Average cost to the company for each billable hour worked. Includes salary cost spread across only client hours.',
  'Salary:Revenue Ratio': 'How many dollars of salary are spent per dollar of revenue. Below 1.0x means you\'re generating more revenue than you spend on salaries.',
  'Profit Margin': 'Revenue minus total salary cost, as a percentage of revenue. Shows how much profit remains after labor costs.',
  'Depts Need Hiring': 'Number of departments where current utilization is high enough to justify adding headcount.',
  'Billable Hrs Available': 'Total remaining billable hours the team could work based on capacity minus hours already logged.',
  'Monthly Billable Rate': 'Current pace of billable hours being logged per month, projected from the selected period.',
  'Monthly Capacity': 'Total available working hours per month across all employees based on standard work schedules.',
  'Annualized Revenue': 'Current period revenue extrapolated to a full year. Useful for forecasting and planning.',
  'Annualized Profit': 'Current period profit (revenue minus labor cost) extrapolated to a full year.',
  'Billable Team Size': 'Number of employees who do client work vs. total headcount. Format: billable / total.',
};

export function KpiSummaryCards({ summary }: { summary: KPIData['summary'] }) {
  const row1 = [
    { label: 'Team Utilization', value: `${summary.teamUtilization}%` },
    { label: 'Revenue / Employee', value: fmt$(summary.avgRevenuePerEmployee) },
    { label: 'Avg Cost / Billable Hr', value: fmt$(summary.avgCostPerBillableHour) },
    { label: 'Salary:Revenue Ratio', value: summary.overallSalaryToRevenueRatio !== null ? `${summary.overallSalaryToRevenueRatio.toFixed(2)}x` : '—' },
    { label: 'Profit Margin', value: summary.profitMargin !== null ? `${summary.profitMargin}%` : '—' },
    { label: 'Depts Need Hiring', value: String(summary.hiringNeeded) },
  ];

  const row2 = [
    { label: 'Billable Hrs Available', value: `${summary.totalBillableAvailable.toFixed(1)} hrs` },
    { label: 'Monthly Billable Rate', value: `${summary.monthlyBillableRate.toFixed(1)} hrs` },
    { label: 'Monthly Capacity', value: `${summary.monthlyCapacity.toFixed(1)} hrs` },
    { label: 'Annualized Revenue', value: fmt$(summary.annualizedRevenue) },
    { label: 'Annualized Profit', value: fmt$(summary.annualizedProfit) },
    { label: 'Billable Team Size', value: `${summary.billableEmployeeCount} / ${summary.totalEmployeeCount}` },
  ];

  const renderCard = (c: { label: string; value: string }) => (
    <Card key={c.label}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
          {TIPS[c.label] && (
            <Tooltip>
              <TooltipTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[240px]">
                {TIPS[c.label]}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="mt-1 text-2xl font-extrabold text-[#0D1F17] dark:text-card-foreground">{c.value}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {row1.map(renderCard)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {row2.map(renderCard)}
      </div>
    </div>
  );
}
