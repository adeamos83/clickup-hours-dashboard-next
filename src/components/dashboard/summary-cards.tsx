'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Clock, Users, Building2, Briefcase, FileText, Info } from 'lucide-react';
import type { DashboardSummary } from '@/lib/types';

const CARDS = [
  {
    key: 'totalHours' as const,
    label: 'Total Hours',
    icon: Clock,
    color: '#2DC88A',
    tip: 'Total tracked hours across all employees in the selected date range, including both client (billable) and internal work.',
  },
  {
    key: 'clientHours' as const,
    label: 'Client Hours',
    icon: Briefcase,
    color: '#3B82F6',
    tip: 'Hours spent on client-facing, billable work. This is the time that directly generates revenue for the company.',
  },
  {
    key: 'internalHours' as const,
    label: 'Internal Hours',
    icon: Building2,
    color: '#F59E0B',
    tip: 'Hours spent on non-billable internal activities like meetings, training, admin, and company projects.',
  },
  {
    key: 'employeesActive' as const,
    label: 'Employees Active',
    icon: Users,
    color: '#8B5CF6',
    tip: 'Number of team members who logged at least one time entry during the selected period.',
  },
  {
    key: 'totalEntries' as const,
    label: 'Time Entries',
    icon: FileText,
    color: '#06B6D4',
    tip: 'Total number of individual time tracking entries recorded. More entries generally means more granular time tracking.',
  },
];

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map(({ key, label, icon: Icon, color, tip }) => (
        <Card key={key} className="relative overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <Tooltip>
                    <TooltipTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px]">
                      {tip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="mt-2 text-3xl font-extrabold text-[#0D1F17] dark:text-card-foreground">
                  {key === 'employeesActive' || key === 'totalEntries'
                    ? summary[key].toLocaleString()
                    : summary[key].toFixed(1)}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}14` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
