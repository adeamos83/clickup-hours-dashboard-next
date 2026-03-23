'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { EmployeeUtilization } from '@/lib/types';

interface Props {
  employees: EmployeeUtilization[];
}

export function EmployeeUtilizationChart({ employees }: Props) {
  const data = employees.map((e) => ({
    name: e.name,
    clientHours: e.clientHours,
    internalHours: e.internalHours,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Employee Utilization
          <InfoTip text="Stacked view of each employee's hours split between billable client work (green) and internal work (amber)." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(data.length * 42, 250)}>
          <BarChart data={data} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="clientHours" name="Client Hours" fill="#2DC88A" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="internalHours" name="Internal Hours" fill="#F59E0B" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
