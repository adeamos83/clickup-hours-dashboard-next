'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoTip, ColTip } from '@/components/ui/tip';
import { useDateRange } from '@/hooks/use-date-range';
import type { EmployeeUtilization } from '@/lib/types';

function UtilBar({ value }: { value: number }) {
  const clamped = Math.min(value, 100);
  const color =
    value >= 60 ? '#2DC88A' :
    value >= 40 ? '#F59E0B' :
    '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-10 text-right tabular-nums">{value}%</span>
    </div>
  );
}

export function EmployeeUtilizationTable({ employees }: { employees: EmployeeUtilization[] }) {
  const { start, end } = useDateRange();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Employee Utilization Detail
          <InfoTip text="Per-employee breakdown of hours, utilization rate, and cost efficiency. Green bars = good utilization, red = underutilized." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Employee" text="Team member name. Click to see their full detail page." /></TableHead>
                <TableHead><ColTip label="Dept" text="The department this employee belongs to." /></TableHead>
                <TableHead className="text-right"><ColTip label="Client Hrs" text="Hours spent on billable client work." /></TableHead>
                <TableHead className="text-right"><ColTip label="Internal Hrs" text="Hours spent on non-billable internal work (meetings, admin, etc.)." /></TableHead>
                <TableHead className="text-right"><ColTip label="Total Hrs" text="Sum of client + internal hours logged." /></TableHead>
                <TableHead className="w-36"><ColTip label="Util %" text="Utilization rate: client hours ÷ total hours. Green ≥60%, yellow ≥40%, red <40%." /></TableHead>
                <TableHead className="text-right"><ColTip label="$/hr" text="Base hourly cost calculated from annual salary ÷ annual working hours." /></TableHead>
                <TableHead className="text-right"><ColTip label="Eff. $/hr" text="Effective cost per billable hour: salary cost ÷ client hours only. Higher than base means non-billable time is driving up the real cost." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.name}>
                  <TableCell>
                    <Link
                      href={`/employee?name=${encodeURIComponent(e.name)}&start=${start}&end=${end}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.department}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.clientHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.internalHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.totalHours.toFixed(1)}</TableCell>
                  <TableCell>
                    <UtilBar value={e.utilizationRate} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">${e.hourlyCost.toFixed(0)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.effectiveHourlyCost !== null ? `$${e.effectiveHourlyCost.toFixed(0)}` : '—'}
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
