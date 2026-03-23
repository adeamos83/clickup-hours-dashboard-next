'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { DepartmentBreakdown } from '@/lib/types';

export function DepartmentChart({ departments }: { departments: DepartmentBreakdown[] }) {
  const data = departments.map((d) => ({
    department: d.department,
    clientHours: d.clientHours,
    availableHours: Math.max(d.availableHours, 0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Department Utilization
          <InfoTip text="Each department's client hours vs. remaining available capacity. Tall gray sections mean the department has room to take on more work." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="department" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="clientHours" name="Client Hours" fill="#2DC88A" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="availableHours" name="Available Hours" fill="#E5E7EB" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
