import type { Metadata } from 'next';
import { Logo } from '@/shared/components/brand/Logo';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = { title: 'Demo ended - YardCard Elite', robots: { index: false, follow: false } };

/** Where a demo lands when its 4 hours are up or the prospect ends it (DEMO.md) */
export default function DemoEndedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-fg">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
        <Logo className="h-9 w-auto" />
        <h1 className="mt-6 font-display text-title font-semibold">Your demo has ended</h1>
        <p className="mt-2 text-copy text-fg-muted">
          Thanks for trying YardCard Elite. Everything you set up in the demo has been cleared.
          Want another look, or ready to start for real? Email{' '}
          <a className="text-action-text underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <a href={SITE_URL.replace('demo.', '')} className="mt-6 inline-flex h-11 items-center rounded-control bg-action px-4 font-bold text-on-action hover:bg-action-hover">
          Visit yardcard-elite.com
        </a>
      </div>
    </main>
  );
}
