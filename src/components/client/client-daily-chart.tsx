'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';

interface Props {
  dailyTrend: { date: string; hours: number }[];
}

export function ClientDailyChart({ dailyTrend }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Daily Hours Trend
          <InfoTip text="Hours logged per day for this client. Helps track work consistency and identify periods of high or low activity." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={dailyTrend}>
            <defs>
              <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DC88A" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2DC88A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} hrs`]} labelFormatter={(l) => `Date: ${l}`} contentStyle={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
            <Area type="monotone" dataKey="hours" stroke="#2DC88A" fill="url(#clientGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
