'use client';

import { Sidebar } from './sidebar';
import { DateBar } from './date-bar';
import { DateRangeProvider } from '@/hooks/use-date-range';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DateRangeProvider>
      <TooltipProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <DateBar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </DateRangeProvider>
  );
}
