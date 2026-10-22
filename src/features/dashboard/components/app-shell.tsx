'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, House, Settings, Signpost, type LucideIcon } from 'lucide-react';
import { Logo } from '@/shared/components/brand/Logo';
import { AgencyMark } from '@/features/agency/components/agency-mark';
import { cn } from '@/lib/utils';
import { CopyLinkButton } from './copy-link-button';

/**
 * Everything around a signed-in agency's pages: the four fixed tabs (bottom
 * bar on phones, sidebar from md up) and a top bar with the agency, its
 * booking link and the account menu.
 *
 * The tabs never change. Sections inside an area (settings sections, order
 * filters) sit at the top of that page, not in this bar. Check-in is a
 * full-screen task, so the tab bar steps aside there.
 */

interface Tab {
  label: string;
  icon: LucideIcon;
  /** First path segment after the slug that lights this tab */
  match: string[];
  path: string;
}

const TABS: Tab[] = [
  { label: 'Home', icon: House, match: ['dashboard'], path: 'dashboard' },
  { label: 'Orders', icon: ClipboardList, match: ['orders'], path: 'orders' },
  { label: 'Signs', icon: Signpost, match: ['inventory'], path: 'inventory' },
  { label: 'Settings', icon: Settings, match: ['settings', 'billing'], path: 'settings' },
];

export interface AppShellProps {
  slug: string;
  agencyName: string;
  logoUrl?: string;
  bookingUrl: string;
  /** The account menu (Clerk's UserButton); a stand-in in the lab */
  account: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ slug, agencyName, logoUrl, bookingUrl, account, children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const section = pathname.split('/').filter(Boolean)[1] ?? '';
  const focusTask = pathname.endsWith('/check-in');

  const tabs = TABS.map(tab => ({ ...tab, href: `/${slug}/${tab.path}`, active: tab.match.includes(section) }));

  return (
    <div className="min-h-dvh bg-canvas font-body text-fg md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:shadow-overlay">
        Skip to content
      </a>

      {/* Sidebar (md and up) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface px-3 py-5 md:flex">
        <Link href={`/${slug}/dashboard`} className="px-3" aria-label="YardCard Elite home">
          <Logo className="h-auto w-full max-w-[11rem]" title="" />
        </Link>
        <nav aria-label="Main" className="grid gap-1">
          {tabs.map(tab => (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-control px-3 font-semibold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
                tab.active ? 'bg-brand text-on-brand' : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
              )}
            >
              <tab.icon className="size-5" aria-hidden />
              {tab.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
            <AgencyMark name={agencyName} logoUrl={logoUrl} className={logoUrl ? 'h-9' : 'size-9 text-copy'} />
            <span className="min-w-0 flex-1 truncate font-display text-lead font-semibold">{agencyName}</span>
            <CopyLinkButton url={bookingUrl} compact />
            <div className="flex size-11 items-center justify-center">{account}</div>
          </div>
        </header>

        <main
          id="main"
          className={cn(
            'mx-auto w-full max-w-6xl flex-1 px-4 pt-6 sm:px-6 lg:pt-8',
            // room for the bottom tab bar and the phone's home indicator
            focusTask ? 'pb-8' : 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10',
          )}
        >
          {children}
        </main>
      </div>

      {/* Bottom tab bar (phones) */}
      {!focusTask && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <ul className="grid grid-cols-4">
            {tabs.map(tab => (
              <li key={tab.label}>
                <Link
                  href={tab.href}
                  aria-current={tab.active ? 'page' : undefined}
                  className="group flex h-16 flex-col items-center justify-center gap-1 text-fine focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-full transition-colors group-focus-visible:shadow-(--focus-ring)',
                      tab.active ? 'bg-brand text-on-brand' : 'text-fg-muted',
                    )}
                  >
                    <tab.icon className="size-5" aria-hidden />
                  </span>
                  <span className={tab.active ? 'font-bold text-fg' : 'font-semibold text-fg-muted'}>{tab.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
