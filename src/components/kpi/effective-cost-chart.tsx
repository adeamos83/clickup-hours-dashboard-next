'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { SalaryScoping } from '@/lib/types';

export function EffectiveCostChart({ data }: { data: SalaryScoping[] }) {
  const chartData = data
    .filter((e) => e.totalHours > 0)
    .map((e) => ({
      name: e.name,
      baseCost: e.hourlyCost,
      effectiveCost: e.costPerBillableHour ?? 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Effective Cost per Billable Hour
          <InfoTip text="Base hourly rate (blue) vs. effective cost when you only count billable hours (amber). A big gap means too much non-billable time is inflating the true cost." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 42, 250)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`$${Number(value).toFixed(0)}`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="baseCost" name="Base $/Hr" fill="#3B82F6" barSize={12} radius={[0, 4, 4, 0]} />
            <Bar dataKey="effectiveCost" name="Effective $/Billable Hr" fill="#F59E0B" barSize={12} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
