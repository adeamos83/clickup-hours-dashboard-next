'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InfoTip, ColTip } from '@/components/ui/tip';
import type { PositionForecast } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  'needs-hire': 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
  'monitor': 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
  'balanced': 'bg-[#2DC88A]/10 text-[#2DC88A] border-[#2DC88A]/20',
  'overstaffed': 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
};

function UtilBar({ value }: { value: number }) {
  const clamped = Math.min(value, 100);
  const color = value >= 60 ? '#2DC88A' : value >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-14 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] tabular-nums">{value}%</span>
    </div>
  );
}

function fmt$(n: number) {
  if (n === 0) return '$0';
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function PositionForecastTable({ data }: { data: PositionForecast[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Position Forecasting & Hiring Needs
          <InfoTip text="Analyzes each department's workload to recommend whether you should hire, monitor, or consider the team balanced or overstaffed." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Department" text="Team or department grouping." /></TableHead>
                <TableHead className="text-right"><ColTip label="Current HC" text="Current headcount in this department." /></TableHead>
                <TableHead className="w-28"><ColTip label="Util %" text="Current utilization rate for the department." /></TableHead>
                <TableHead className="text-right"><ColTip label="Recommended HC" text="Recommended headcount based on workload analysis." /></TableHead>
                <TableHead className="text-right"><ColTip label="Gap" text="Difference between recommended and current. Positive (red) = need to hire." /></TableHead>
                <TableHead className="text-right"><ColTip label="Avg Salary" text="Average annual salary in this department." /></TableHead>
                <TableHead className="text-right"><ColTip label="Cost/Hire (Loaded)" text="Fully loaded cost per new hire including benefits, equipment, onboarding." /></TableHead>
                <TableHead className="text-right"><ColTip label="Add'l Annual Cost" text="Additional annual cost if all recommended hires are made." /></TableHead>
                <TableHead className="text-right"><ColTip label="Rev/Head" text="Revenue generated per person in this department." /></TableHead>
                <TableHead><ColTip label="Status" text="Needs Hire = understaffed, Monitor = watch closely, Balanced = right-sized, Overstaffed = too many." /></TableHead>
                <TableHead><ColTip label="Members" text="Current team members in this department." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.department}>
                  <TableCell className="font-medium">{d.department}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.currentHeadcount}</TableCell>
                  <TableCell>
                    <UtilBar value={d.currentUtilization} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{d.recommendedHeadcount}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${d.hiringGap > 0 ? 'text-[#EF4444]' : 'text-[#2DC88A]'}`}>
                    {d.hiringGap > 0 ? `+${d.hiringGap}` : d.hiringGap}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(d.avgSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(d.costPerNewHire)}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.additionalCostAnnual > 0 ? fmt$(d.additionalCostAnnual) : '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.revenuePerHead > 0 ? fmt$(d.revenuePerHead) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${STATUS_COLORS[d.status] || ''}`}>
                      {d.status.replace(/-/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {d.members.join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
