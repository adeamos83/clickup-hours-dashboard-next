'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoTip, ColTip } from '@/components/ui/tip';
import type { ClientValue } from '@/lib/types';

function fmt$(n: number) {
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function ClientValueTable({ data }: { data: ClientValue[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Client Value Analysis
          <InfoTip text="Profitability analysis per client — revenue, labor cost, profit, and efficiency metrics. Helps identify your most and least valuable clients." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Client" text="Client name." /></TableHead>
                <TableHead className="text-right"><ColTip label="Actual Hrs" text="Total hours logged for this client in the period." /></TableHead>
                <TableHead className="text-right"><ColTip label="Revenue" text="Retainer revenue from this client." /></TableHead>
                <TableHead className="text-right"><ColTip label="Labor Cost" text="Total salary cost of employees who worked on this client." /></TableHead>
                <TableHead className="text-right"><ColTip label="Profit" text="Revenue minus labor cost. Green = profitable, red = losing money." /></TableHead>
                <TableHead className="text-right"><ColTip label="Margin %" text="Profit as a percentage of revenue. Higher is better." /></TableHead>
                <TableHead className="text-right"><ColTip label="Rev/Hr" text="Revenue per hour of work. Higher means more efficient billing." /></TableHead>
                <TableHead className="text-right"><ColTip label="Cost/Hr" text="Average labor cost per hour for this client." /></TableHead>
                <TableHead className="text-right"><ColTip label="Team Size" text="Number of employees who worked on this client." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium text-primary">{c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.actualHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(c.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt$(c.totalCost)}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${c.profit >= 0 ? 'text-[#2DC88A]' : 'text-[#EF4444]'}`}>
                    {fmt$(c.profit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c.margin !== null ? `${c.margin}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">${c.revenuePerHour.toFixed(0)}</TableCell>
                  <TableCell className="text-right tabular-nums">${c.costPerHour.toFixed(0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.employeeCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
