'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';

const COLORS = [
  '#2DC88A', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#F43F5E', '#0EA5E9',
];

interface Props {
  categories: { name: string; totalHours: number }[];
}

export function InternalBreakdown({ categories }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Client vs Internal Split
          <InfoTip text="How total hours are divided between billable client work and internal categories like meetings, admin, and training." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="totalHours"
              nameKey="name"
              cx="38%"
              cy="50%"
              innerRadius={65}
              outerRadius={115}
              paddingAngle={1}
            >
              {categories.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Hours']}
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
