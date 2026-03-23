'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTip } from '@/components/ui/tip';
import { useDateRange } from '@/hooks/use-date-range';

interface Props {
  employees: { name: string; totalHours: number; isPayroll: boolean }[];
}

export function EmployeeChart({ employees }: Props) {
  const router = useRouter();
  const { start, end } = useDateRange();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Employee Hours
          <InfoTip text="Total hours logged by each team member in the selected period. Click a bar to see that employee's detailed breakdown." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(employees.length * 38, 200)}>
          <BarChart data={employees} layout="vertical" margin={{ left: 100, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)} hrs`, 'Hours']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            />
            <Bar
              dataKey="totalHours"
              fill="#2DC88A"
              radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(data) => {
                if (data?.name) router.push(`/employee?name=${encodeURIComponent(String(data.name))}&start=${start}&end=${end}`);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
