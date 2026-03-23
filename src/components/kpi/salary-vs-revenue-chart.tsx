'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { SalaryScoping } from '@/lib/types';

export function SalaryVsRevenueChart({ data }: { data: SalaryScoping[] }) {
  const chartData = data.map((e) => ({
    name: e.name,
    periodCost: e.periodCost,
    revenue: e.revenueGenerated,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Salary Cost vs Revenue Generated
          <InfoTip text="Compares each employee's prorated salary cost (red) against the revenue they helped generate (green). Revenue exceeding cost = positive ROI." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 42, 250)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="periodCost" name="Period Cost" fill="#EF4444" barSize={12} radius={[0, 4, 4, 0]} />
            <Bar dataKey="revenue" name="Revenue Generated" fill="#2DC88A" barSize={12} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
