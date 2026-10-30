import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Logo } from '@/shared/components/brand/Logo';
import { isDemoMode } from '@/features/demo/config';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = { title: 'Demo - YardCard Elite', robots: { index: false, follow: false } };

/** The demo site's front door without a link: demos are by invitation (DEMO.md) */
export default function DemoHomePage() {
  if (!isDemoMode()) notFound();
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-fg">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
        <Logo className="h-9 w-auto" />
        <h1 className="mt-6 font-display text-title font-semibold">Ask us for a demo</h1>
        <p className="mt-2 text-copy text-fg-muted">
          YardCard Elite demos are by invitation, so each one gets its own sample business.
          Email <a className="text-action-text underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we’ll send you a link.
        </p>
        <a href={SITE_URL.replace('demo.', '')} className="mt-6 inline-flex h-11 items-center rounded-control border border-line-strong px-4 font-bold hover:bg-surface-sunken">
          See yardcard-elite.com
        </a>
      </div>
    </main>
  );
}
