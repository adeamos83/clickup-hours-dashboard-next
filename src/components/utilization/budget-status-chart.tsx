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

export function BudgetStatusChart({ clients }: Props) {
  const withBudget = clients
    .filter((c) => c.budgetHours !== null && c.budgetHours > 0)
    .slice(0, 15)
    .map((c) => ({
      name: c.name.length > 25 ? c.name.slice(0, 23) + '...' : c.name,
      actualHours: c.actualHours,
      budgetHours: c.budgetHours,
    }));

  if (withBudget.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Client Budget Status (Top 15)
          <InfoTip text="Compares actual hours worked (red) against budgeted hours (green) for each client. When red exceeds green, the client is over budget." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(withBudget.length * 36, 250)}>
          <BarChart data={withBudget} layout="vertical" margin={{ left: 160, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="actualHours" name="Actual Hours" fill="#EF4444" barSize={12} radius={[0, 4, 4, 0]} />
            <Bar dataKey="budgetHours" name="Budget Hours" fill="#2DC88A" barSize={12} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
