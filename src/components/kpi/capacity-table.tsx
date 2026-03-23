'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InfoTip, ColTip } from '@/components/ui/tip';
import type { CapacityPlanning } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  'at-capacity': 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
  'high-load': 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
  'underutilized': 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  'available': 'bg-[#2DC88A]/10 text-[#2DC88A] border-[#2DC88A]/20',
};

function UtilBar({ value }: { value: number }) {
  const clamped = Math.min(value, 100);
  const color = value >= 95 ? '#EF4444' : value >= 80 ? '#F59E0B' : '#2DC88A';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-14 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] tabular-nums">{value}%</span>
    </div>
  );
}

export function CapacityTable({ data }: { data: CapacityPlanning[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Capacity Planning & Availability
          <InfoTip text="Shows each person's total capacity, how much they've worked, and how much room is left for additional billable work." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Team Member" text="Employee name." /></TableHead>
                <TableHead><ColTip label="Role" text="Job title or role." /></TableHead>
                <TableHead className="text-right"><ColTip label="Capacity" text="Total working hours available in the period based on schedule." /></TableHead>
                <TableHead className="text-right"><ColTip label="Worked" text="Total hours actually logged (client + internal)." /></TableHead>
                <TableHead className="text-right"><ColTip label="Billable" text="Hours logged on client (billable) work." /></TableHead>
                <TableHead className="text-right"><ColTip label="Internal" text="Hours logged on non-billable internal work." /></TableHead>
                <TableHead className="text-right"><ColTip label="Avail for Billing" text="Remaining hours that could be used for billable work." /></TableHead>
                <TableHead className="w-28"><ColTip label="Used %" text="Capacity used: total worked ÷ total capacity. Red ≥95%, yellow ≥80%." /></TableHead>
                <TableHead className="text-right"><ColTip label="Proj. Next Mo" text="Projected client hours for next month based on current trends." /></TableHead>
                <TableHead className="w-28"><ColTip label="Proj. Util %" text="Projected utilization for next month." /></TableHead>
                <TableHead><ColTip label="Status" text="High Load = near/over capacity, At Capacity = fully booked, Available = has room, Underutilized = significantly below capacity." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((e) => (
                <TableRow key={e.name}>
                  <TableCell className="font-medium text-primary">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.role}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.totalCapacity.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.totalHoursWorked.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.clientHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.internalHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{e.billableAvailable.toFixed(1)}</TableCell>
                  <TableCell>
                    <UtilBar value={e.capacityUsedPct} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{e.projectedNextMonthClient.toFixed(1)}</TableCell>
                  <TableCell>
                    <UtilBar value={e.projectedUtilization} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${STATUS_COLORS[e.status] || STATUS_COLORS['at-capacity']}`}>
                      {e.status.replace(/-/g, ' ')}
                    </Badge>
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
