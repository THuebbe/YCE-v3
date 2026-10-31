import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Logo } from '@/shared/components/brand/Logo';
import { DEMO_HOURS, isDemoMode, maskEmail } from '@/features/demo/config';
import { inviteState } from '@/features/demo/invites';
import { StartDemo } from '@/features/demo/components/start-demo';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = { title: 'Your demo - YardCard Elite', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Where a demo link lands (DEMO.md "Flow"). Only exists on the demo site. */
export default async function StartPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isDemoMode()) notFound();
  const { token } = await params;
  const state = await inviteState(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-fg">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-raised">
        <Logo className="h-9 w-auto" />
        {state.state === 'ready' || state.state === 'running' ? (
          <>
            <h1 className="mt-6 font-display text-title font-semibold">{state.state === 'running' ? 'Welcome back' : 'Your YardCard Elite demo'}</h1>
            <p className="mt-2 text-copy text-fg-muted">
              {state.state === 'running'
                ? 'Your demo is still running. Sign in again with the code we emailed you.'
                : `A real dashboard and booking page, with sample bookings and test payments. You’ll have ${DEMO_HOURS} hours from when you sign in.`}
            </p>
            <div className="mt-6">
              {state.state === 'ready' && state.locked ? (
                <p className="text-copy text-danger">Too many wrong codes for this link. Ask us for a new one at {SUPPORT_EMAIL}.</p>
              ) : (
                <StartDemo token={token} maskedEmail={maskEmail(state.email)} codeAlreadySent={state.state === 'running' || state.codeSent} running={state.state === 'running'} />
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-title font-semibold">
              {state.state === 'expired' ? 'This link has expired' : state.state === 'ended' ? 'This demo has ended' : 'This link isn’t valid'}
            </h1>
            <p className="mt-2 text-copy text-fg-muted">
              {state.state === 'expired' ? 'Demo links work for 7 days. ' : state.state === 'ended' ? 'Thanks for trying YardCard Elite. ' : ''}
              For a new demo, email <a className="text-action-text underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </>
        )}
        <p className="mt-8 text-fine text-fg-muted">This is a demo. Nothing here is real: no signs, no charges. <a className="text-action-text hover:underline" href={SITE_URL.replace('demo.', '')}>yardcard-elite.com</a></p>
      </div>
    </main>
  );
}
