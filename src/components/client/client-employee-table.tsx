'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoTip, ColTip } from '@/components/ui/tip';

interface Props {
  employees: { name: string; totalHours: number }[];
  start: string;
  end: string;
}

export function ClientEmployeeTable({ employees, start, end }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Employee Breakdown
          <InfoTip text="All team members who logged time on this client, with their total hours." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Employee" text="Team member name. Click to see their full profile." /></TableHead>
                <TableHead className="text-right"><ColTip label="Hours" text="Total hours this employee logged for this client." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.name}>
                  <TableCell>
                    <Link
                      href={`/employee?name=${encodeURIComponent(e.name)}&start=${start}&end=${end}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{e.totalHours.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
