'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { UtilizationData } from '@/lib/types';

function fmt$(n: number) {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function UtilizationSummary({ summary }: { summary: UtilizationData['summary'] }) {
  const cards = [
    {
      label: 'Team Utilization',
      value: `${summary.overallUtilization}%`,
      tip: 'Percentage of total worked hours spent on billable client work. Higher is better — aim for 60-80% to leave room for internal work.',
    },
    {
      label: 'Total Labor Cost',
      value: fmt$(summary.totalLaborCost),
      tip: 'Combined salary cost of all employees for the selected period, calculated from their annual salary prorated to the date range.',
    },
    {
      label: 'Total Revenue',
      value: fmt$(summary.totalRevenue),
      tip: 'Sum of all client retainer revenue for the selected period. This is the total income generated from client work.',
    },
    {
      label: 'Profit / Margin',
      value: `${fmt$(summary.totalProfit)} / ${summary.profitMargin !== null ? summary.profitMargin + '%' : '—'}`,
      tip: 'Profit is revenue minus labor cost. Margin is profit as a percentage of revenue — e.g. 40% margin means $0.40 profit per $1.00 of revenue.',
    },
    {
      label: 'Over Budget',
      value: String(summary.overBudgetClients),
      tip: 'Number of clients where actual hours tracked have exceeded their budgeted hours for the period. These need immediate attention.',
    },
    {
      label: 'At Risk',
      value: String(summary.atRiskClients),
      tip: 'Number of clients approaching their budget limit (typically 80%+ used). Monitor these closely to avoid going over budget.',
    },
    {
      label: 'Billable Employees',
      value: String(summary.billableEmployees),
      tip: 'Number of team members who have logged at least some client (billable) hours in the selected period.',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <Tooltip>
                <TooltipTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px]">
                  {c.tip}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="mt-1 text-2xl font-extrabold text-[#0D1F17] dark:text-card-foreground">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
