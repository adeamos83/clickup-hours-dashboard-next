'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { InfoTip, ColTip } from '@/components/ui/tip';
import { useDateRange } from '@/hooks/use-date-range';

interface Props {
  data: { employee: string; client: string; hours: number }[];
}

export function EmployeeClientTable({ data }: Props) {
  const { start, end } = useDateRange();
  const sorted = [...data].sort((a, b) => b.hours - a.hours);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Employee &times; Client Breakdown
          <InfoTip text="Every employee-client combination and how many hours were logged. Sorted by most hours first." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Employee" text="Team member who logged the time." /></TableHead>
                <TableHead><ColTip label="Client / Category" text="The client or internal category the hours were logged against." /></TableHead>
                <TableHead className="text-right"><ColTip label="Hours ▼" text="Total hours for this employee-client pair, sorted highest first." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Link
                      href={`/employee?name=${encodeURIComponent(row.employee)}&start=${start}&end=${end}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.employee}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/client?name=${encodeURIComponent(row.client)}&start=${start}&end=${end}`}
                      className="text-primary hover:underline"
                    >
                      {row.client}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.hours.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
