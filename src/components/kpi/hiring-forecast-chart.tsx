'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import type { PositionForecast } from '@/lib/types';

export function HiringForecastChart({ data }: { data: PositionForecast[] }) {
  const chartData = data.map((d) => ({
    department: d.department,
    current: d.currentHeadcount,
    recommended: d.recommendedHeadcount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Department Hiring Forecast
          <InfoTip text="Current headcount (green) vs. recommended headcount (amber) by department. When recommended exceeds current, that department may need to hire." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="current" name="Current Headcount" fill="#2DC88A" barSize={20} radius={[4, 4, 0, 0]} />
            <Bar dataKey="recommended" name="Recommended" fill="#F59E0B" barSize={20} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
