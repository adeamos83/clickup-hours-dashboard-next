'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { TRACKER_CLIENTS } from '@/lib/client-tracker/clients';

interface NavLink {
  href: string;
  label: string;
  letter: string;
}

const NAV_ITEMS: NavLink[] = [
  { href: '/', label: 'Hours Dashboard', letter: 'H' },
  { href: '/utilization', label: 'Utilization & Costs', letter: 'U' },
  { href: '/kpi', label: 'KPI Dashboard', letter: 'K' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-white">
          CH
        </span>
        <span className="text-[15px] font-semibold text-sidebar-foreground">ClickUp Hours</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                active
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.letter}
              </span>
              {item.label}
            </Link>
          );
        })}

        {/* Client Tracker group */}
        <div className="pt-5">
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Client Tracker
          </div>
          {TRACKER_CLIENTS.map((c) => {
            const href = `/client-tracker/${c.slug}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const initial = c.name.charAt(0).toUpperCase();
            return (
              <Link
                key={c.slug}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${
                    active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {initial}
                </span>
                {c.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
