'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InfoTip, ColTip } from '@/components/ui/tip';
import { useDateRange } from '@/hooks/use-date-range';
import type { ClientUtilization } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  'over-budget': 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
  'at-risk': 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
  'on-track': 'bg-[#2DC88A]/10 text-[#2DC88A] border-[#2DC88A]/20',
  'no-budget': 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

function BudgetBar({ pct, status }: { pct: number | null; status: string }) {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  const clamped = Math.min(pct, 100);
  const color =
    status === 'over-budget' ? '#EF4444' :
    status === 'at-risk' ? '#F59E0B' :
    '#2DC88A';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

function fmt$(n: number | null) {
  if (n === null) return '—';
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function SaveButton({ clientName }: { clientName: string }) {
  const [saving, setSaving] = useState(false);

  return (
    <button
      onClick={async () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 500);
      }}
      className="rounded-lg bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white transition-colors hover:brightness-110"
    >
      {saving ? '...' : 'Save'}
    </button>
  );
}

export function ClientUtilizationTable({ clients }: { clients: ClientUtilization[] }) {
  const { start, end } = useDateRange();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Client Budget Detail
          <InfoTip text="Per-client view of budget usage, revenue, cost, and margin. Use this to monitor which clients are over or approaching their budget." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Client" text="Client name. Click to see detailed breakdown." /></TableHead>
                <TableHead className="text-right"><ColTip label="Budget Hrs" text="Total budgeted hours for this client in the period (from retainer agreement)." /></TableHead>
                <TableHead className="text-right"><ColTip label="Actual" text="Actual hours logged against this client so far." /></TableHead>
                <TableHead className="w-28"><ColTip label="Used" text="Percentage of budget hours consumed. Red = over budget, yellow = at risk, green = on track." /></TableHead>
                <TableHead className="text-right"><ColTip label="Remaining" text="Hours left before hitting the budget cap. Negative means over budget." /></TableHead>
                <TableHead className="text-right"><ColTip label="Revenue" text="Retainer revenue for this client in the period." /></TableHead>
                <TableHead className="text-right"><ColTip label="Cost" text="Total labor cost of employees who worked on this client." /></TableHead>
                <TableHead className="text-right"><ColTip label="Margin" text="Profit margin: (revenue - cost) ÷ revenue × 100. Higher is better." /></TableHead>
                <TableHead><ColTip label="Status" text="Over Budget = exceeded hours, At Risk = approaching limit, On Track = within budget." /></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.name}>
                  <TableCell>
                    <Link
                      href={`/client?name=${encodeURIComponent(c.name)}&start=${start}&end=${end}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.budgetHours !== null ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs tabular-nums">{c.budgetHours.toFixed(0)}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.actualHours.toFixed(1)}</TableCell>
                  <TableCell>
                    <BudgetBar pct={c.budgetUsedPct} status={c.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.hoursRemaining !== null ? c.hoursRemaining.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(c.retainerRevenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(c.totalCost)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.margin !== null ? `${c.margin}%` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${STATUS_COLORS[c.status] || ''}`}>
                      {c.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SaveButton clientName={c.name} />
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
