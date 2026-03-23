'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { CapacityPlanning } from '@/lib/types';

export function CapacityChart({ data }: { data: CapacityPlanning[] }) {
  const chartData = data.map((e) => ({
    name: e.name,
    billable: e.clientHours,
    internal: e.internalHours,
    available: Math.max(e.availableHours, 0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Team Billable Capacity
          <InfoTip text="Each person's time split into billable (green), internal (amber), and available (gray). Large gray sections mean unused capacity that could be billed." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 42, 250)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="billable" name="Billable Hours" fill="#2DC88A" stackId="a" />
            <Bar dataKey="internal" name="Internal Hours" fill="#F59E0B" stackId="a" />
            <Bar dataKey="available" name="Available" fill="#E5E7EB" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
