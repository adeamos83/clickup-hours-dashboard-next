'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';

const COLORS = [
  '#2DC88A', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#F43F5E', '#0EA5E9', '#A855F7', '#10B981',
];

interface Props {
  tasks: { name: string; client: string; totalHours: number; employees: string[] }[];
}

export function TopTasksTable({ tasks }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Top 15 Tasks by Hours
          <InfoTip text="The most time-consuming tasks in the selected period. Hover over a bar to see client and team details." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(tasks.length * 32, 200)}>
          <BarChart data={tasks} layout="vertical" margin={{ left: 180, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={180}
              tickFormatter={(v) => v.length > 30 ? v.slice(0, 28) + '...' : v}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Hours']}
              labelFormatter={(_, payload) => {
                const task = payload?.[0]?.payload;
                return task ? `${task.name}\nClient: ${task.client}\nTeam: ${task.employees?.join(', ')}` : '';
              }}
              contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', whiteSpace: 'pre-line' }}
            />
            <Bar dataKey="totalHours" radius={[0, 6, 6, 0]}>
              {tasks.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
