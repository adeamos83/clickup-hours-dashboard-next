'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { ClientValue } from '@/lib/types';

const COLORS = [
  '#2DC88A', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#F43F5E', '#0EA5E9', '#A855F7', '#10B981',
];

export function RevenuePerHourChart({ data }: { data: ClientValue[] }) {
  const top = [...data]
    .sort((a, b) => b.revenuePerHour - a.revenuePerHour)
    .slice(0, 15)
    .map((c) => ({
      name: c.name.length > 22 ? c.name.slice(0, 20) + '...' : c.name,
      revenuePerHour: c.revenuePerHour,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Top Clients by Revenue per Hour
          <InfoTip text="Which clients generate the most revenue per hour of work. Higher $/hr clients are more valuable from a profitability standpoint." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(top.length * 32, 250)}>
          <BarChart data={top} layout="vertical" margin={{ left: 140, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`$${Number(value).toFixed(0)}/hr`]}
            />
            <Bar dataKey="revenuePerHour" radius={[0, 6, 6, 0]} barSize={14}>
              {top.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
