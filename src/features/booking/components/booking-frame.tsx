import React from 'react';
import Link from 'next/link';
import { Logo } from '@/shared/components/brand/Logo';
import { BRAND } from '@/lib/brand';
import { brandingStyle, type AgencyBranding } from '@/features/agency/branding';

/**
 * Everything around an agency's booking page: its colors (white label, on
 * the [data-agency] wrapper), its name and logo up top, and our small
 * "Powered by" line at the bottom (on every plan, DESIGN.md).
 */
export function BookingFrame({
  agencyName,
  branding,
  children,
}: {
  agencyName: string;
  branding: AgencyBranding;
  children: React.ReactNode;
}) {
  return (
    <div data-agency="" style={brandingStyle(branding)} className="flex min-h-screen flex-col bg-canvas font-body text-fg">
      <header className="bg-brand text-on-brand">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
          {branding.logoUrl ? (
            // Agency-supplied image from any https host, so a plain img (no next/image domain list)
            <img src={branding.logoUrl} alt="" className="h-10 w-auto max-w-[9rem] rounded-control bg-surface object-contain p-1" />
          ) : (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-accent font-display text-heading font-semibold text-brand"
            >
              {initials(agencyName)}
            </span>
          )}
          <span className="min-w-0 truncate font-display text-heading font-semibold">{agencyName}</span>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-fine text-fg-muted sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-fg">
            Powered by <Logo variant="icon" className="size-5" title="" />
            <span className="font-semibold">{BRAND.name}</span>
          </Link>
          <nav className="flex gap-4" aria-label="Legal">
            <Link href="/terms" className="hover:text-fg">Terms</Link>
            <Link href="/privacy" className="hover:text-fg">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** "Lucky Lawn Signs" -> "LL": a stand-in until the agency uploads a logo */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => /[a-z0-9]/i.test(w));
  return (words.slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
}
