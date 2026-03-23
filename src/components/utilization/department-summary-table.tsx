'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoTip, ColTip } from '@/components/ui/tip';
import type { DepartmentBreakdown } from '@/lib/types';

function UtilBar({ value }: { value: number }) {
  const clamped = Math.min(value, 100);
  const color =
    value >= 60 ? '#2DC88A' :
    value >= 40 ? '#F59E0B' :
    '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-10 text-right tabular-nums">{value}%</span>
    </div>
  );
}

export function DepartmentSummaryTable({ departments }: { departments: DepartmentBreakdown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Department Summary
          <InfoTip text="Aggregated metrics by department — headcount, hours breakdown, utilization, and cost. Shows who's in each department." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Department" text="Team or department grouping." /></TableHead>
                <TableHead className="text-right"><ColTip label="Headcount" text="Number of employees in this department." /></TableHead>
                <TableHead className="text-right"><ColTip label="Client Hrs" text="Total billable client hours for the department." /></TableHead>
                <TableHead className="text-right"><ColTip label="Internal Hrs" text="Total non-billable internal hours for the department." /></TableHead>
                <TableHead className="text-right"><ColTip label="Available" text="Remaining capacity hours the department could work." /></TableHead>
                <TableHead className="w-32"><ColTip label="Util %" text="Department utilization: client hours ÷ total capacity." /></TableHead>
                <TableHead className="text-right"><ColTip label="Total Cost" text="Combined salary cost for all employees in this department." /></TableHead>
                <TableHead className="text-right"><ColTip label="Cost/Hr" text="Average cost per hour across the department." /></TableHead>
                <TableHead><ColTip label="Members" text="Names of team members in this department." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.department}>
                  <TableCell className="font-medium">{d.department}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.headcount}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.clientHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.internalHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.availableHours.toFixed(0)}</TableCell>
                  <TableCell>
                    <UtilBar value={d.utilizationRate} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${d.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${d.avgCostPerHour.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
