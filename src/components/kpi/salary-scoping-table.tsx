'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InfoTip, ColTip } from '@/components/ui/tip';
import type { SalaryScoping } from '@/lib/types';

const TYPE_COLORS: Record<string, string> = {
  employee: 'bg-[#3B82F6] text-white border-transparent',
  contractor: 'bg-[#2DC88A] text-white border-transparent',
  founder: 'bg-[#F59E0B] text-white border-transparent',
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
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function SalaryScopingTable({ data }: { data: SalaryScoping[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Salary Scoping & ROI Analysis
          <InfoTip text="Full breakdown of each employee's salary, hourly cost, billable output, revenue contribution, and return on investment." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Employee" text="Team member name." /></TableHead>
                <TableHead><ColTip label="Role" text="Job title or role within the company." /></TableHead>
                <TableHead><ColTip label="Dept" text="Department the employee belongs to." /></TableHead>
                <TableHead><ColTip label="Type" text="Employment type: employee (W-2), contractor (1099), or founder." /></TableHead>
                <TableHead className="text-right"><ColTip label="Annual Salary" text="Full annual salary or contracted annual rate." /></TableHead>
                <TableHead className="text-right"><ColTip label="$/Hr Cost" text="Hourly cost: annual salary ÷ ~2,080 working hours per year." /></TableHead>
                <TableHead className="text-right"><ColTip label="Billable Hrs" text="Hours spent on client (billable) work in the period." /></TableHead>
                <TableHead className="text-right"><ColTip label="Cost/Bill Hr" text="Period salary cost ÷ billable hours. Shows real cost per productive hour." /></TableHead>
                <TableHead className="text-right"><ColTip label="Revenue" text="Revenue attributed to this employee from client retainers." /></TableHead>
                <TableHead className="text-right"><ColTip label="ROI %" text="(Revenue - Cost) ÷ Cost × 100. Positive = generating more than they cost." /></TableHead>
                <TableHead className="text-right"><ColTip label="Salary:Rev" text="Ratio of salary to revenue. Below 1.0x means revenue exceeds salary." /></TableHead>
                <TableHead className="w-28"><ColTip label="Util %" text="Billable hours ÷ total hours worked. Green ≥60%, yellow ≥40%, red <40%." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow key={e.name}>
                  <TableCell className="font-medium text-primary">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.role}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.department}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] uppercase font-bold ${TYPE_COLORS[e.type] || ''}`}>
                      {e.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(e.annualSalary)}</TableCell>
                  <TableCell className="text-right tabular-nums">${e.hourlyCost.toFixed(0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.clientHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.costPerBillableHour !== null ? `$${e.costPerBillableHour.toFixed(0)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(e.revenueGenerated)}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${e.roi >= 0 ? 'text-[#2DC88A]' : 'text-[#EF4444]'}`}>
                    {e.roi}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {e.salaryToRevenueRatio !== null ? `${e.salaryToRevenueRatio.toFixed(2)}x` : '—'}
                  </TableCell>
                  <TableCell>
                    <UtilBar value={e.utilizationRate} />
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
