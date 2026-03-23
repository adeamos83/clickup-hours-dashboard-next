'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { InfoTip, ColTip } from '@/components/ui/tip';
import { useDateRange } from '@/hooks/use-date-range';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 25;

interface Props {
  data: { employee: string; client: string; hours: number }[];
}

export function EmployeeClientTable({ data }: Props) {
  const { start, end } = useDateRange();
  const sorted = [...data].sort((a, b) => b.hours - a.hours);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            Employee &times; Client Breakdown
            <InfoTip text="Every employee-client combination and how many hours were logged. Sorted by most hours first." />
          </CardTitle>
          {totalPages > 1 && (
            <span className="text-[11px] text-muted-foreground">
              {sorted.length.toLocaleString()} rows
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><ColTip label="Employee" text="Team member who logged the time." /></TableHead>
                <TableHead><ColTip label="Client / Category" text="The client or internal category the hours were logged against." /></TableHead>
                <TableHead className="text-right"><ColTip label="Hours" text="Total hours for this employee-client pair, sorted highest first." /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((row, i) => (
                <TableRow key={page * PAGE_SIZE + i}>
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-[12px] text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`min-w-[28px] rounded-lg px-2 py-1 text-[12px] font-medium transition-colors ${
                    i === page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(
                Math.max(0, page - 2),
                Math.min(totalPages, page + 3)
              )}
              {page + 3 < totalPages && (
                <span className="px-1 text-[12px] text-muted-foreground">...</span>
              )}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
