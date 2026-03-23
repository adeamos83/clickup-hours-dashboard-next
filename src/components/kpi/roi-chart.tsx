'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { SalaryScoping } from '@/lib/types';

export function RoiChart({ data }: { data: SalaryScoping[] }) {
  const chartData = [...data]
    .sort((a, b) => b.roi - a.roi)
    .map((e) => ({ name: e.name, roi: e.roi }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Employee ROI (%)
          <InfoTip text="Return on investment per employee: (revenue generated - salary cost) ÷ salary cost × 100. Positive (green) = generating more than they cost. Negative (red) = costing more than they generate." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 38, 250)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'ROI']}
            />
            <ReferenceLine x={0} stroke="#9CA3AF" strokeDasharray="3 3" />
            <Bar dataKey="roi" radius={[0, 6, 6, 0]} barSize={16}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.roi >= 0 ? '#2DC88A' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
