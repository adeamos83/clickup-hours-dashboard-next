'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { ClientUtilization } from '@/lib/types';

interface Props {
  clients: ClientUtilization[];
}

export function ProfitabilityChart({ clients }: Props) {
  const withProfit = clients
    .filter((c) => c.retainerRevenue !== null && c.retainerRevenue > 0)
    .map((c) => ({
      name: c.name.length > 25 ? c.name.slice(0, 23) + '...' : c.name,
      revenue: c.retainerRevenue ?? 0,
      cost: c.totalCost,
      profit: (c.retainerRevenue ?? 0) - c.totalCost,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 15);

  if (withProfit.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Profitability by Client
          <InfoTip text="Revenue (green) vs. labor cost (red) per client. Profitable clients have revenue bars that extend further than cost bars." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(withProfit.length * 36, 250)}>
          <BarChart data={withProfit} layout="vertical" margin={{ left: 160, right: 20 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}k`}
            />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#2DC88A" barSize={14} radius={[0, 4, 4, 0]} />
            <Bar dataKey="cost" name="Cost" fill="#EF4444" barSize={14} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
