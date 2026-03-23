'use client';

import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import { useDateRange } from '@/hooks/use-date-range';

const COLORS = [
  '#2DC88A', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#F43F5E', '#0EA5E9',
];

interface Props {
  clients: { name: string; totalHours: number }[];
}

export function ClientChart({ clients }: Props) {
  const router = useRouter();
  const { start, end } = useDateRange();
  const top = clients.slice(0, 12);
  const otherHours = clients.slice(12).reduce((sum, c) => sum + c.totalHours, 0);
  const data = otherHours > 0 ? [...top, { name: 'Other', totalHours: otherHours }] : top;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Hours by Client
          <InfoTip text="Distribution of billable hours across clients. Click a slice to see that client's detailed breakdown." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={data}
              dataKey="totalHours"
              nameKey="name"
              cx="38%"
              cy="50%"
              innerRadius={65}
              outerRadius={115}
              paddingAngle={1}
              cursor="pointer"
              onClick={(entry) => {
                if (entry?.name && entry.name !== 'Other') {
                  router.push(`/client?name=${encodeURIComponent(entry.name)}&start=${start}&end=${end}`);
                }
              }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
