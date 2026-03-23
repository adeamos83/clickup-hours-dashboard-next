'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InfoTip, ColTip } from '@/components/ui/tip';

interface Props {
  tasks: { name: string; client: string; totalHours: number; isInternal: boolean }[];
  start: string;
  end: string;
}

export function EmployeeTasksTable({ tasks, start, end }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Top Tasks
          <InfoTip text="This employee's most time-consuming tasks in the period, sorted by hours." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Task" text="Name of the task or time entry." /></TableHead>
                <TableHead><ColTip label="Client / Category" text="Which client or internal category this task belongs to." /></TableHead>
                <TableHead className="text-right"><ColTip label="Hours" text="Total hours logged on this task." /></TableHead>
                <TableHead><ColTip label="Type" text="Whether the task is billable client work or non-billable internal work." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="max-w-[250px] truncate font-medium">{t.name}</TableCell>
                  <TableCell>
                    {t.isInternal ? (
                      <span className="text-muted-foreground">{t.client}</span>
                    ) : (
                      <Link
                        href={`/client?name=${encodeURIComponent(t.client)}&start=${start}&end=${end}`}
                        className="text-primary hover:underline"
                      >
                        {t.client}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{t.totalHours.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.isInternal ? 'text-[#F59E0B] border-[#F59E0B]/20' : 'text-[#2DC88A] border-[#2DC88A]/20'}>
                      {t.isInternal ? 'Internal' : 'Client'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
