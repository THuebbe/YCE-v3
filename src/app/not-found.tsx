import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/features/marketing/components/MarketingShell'
import { marketingContent } from '@/features/marketing/content'
import { trialDays } from '@/features/billing/stripe-billing'
import { loadSceneAssets } from '@/features/yard-scene/assets'
import { NotFoundScene } from '@/features/yard-scene/NotFoundScene'

export const metadata: Metadata = { title: 'Page not found' }

/**
 * Every 404: unknown addresses, and notFound() from an agency that doesn't
 * exist or an order that isn't theirs. Customers land here from an old
 * booking link as often as agencies do from a typo, so it speaks to both.
 */
export default function NotFound() {
  const c = marketingContent({ trialDays: trialDays() })
  return (
    <MarketingShell startLabel={c.startLabel}>
      <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        <NotFoundScene assets={loadSceneAssets('classic', ['gold', 'red'])} />
        <div className="grid gap-3">
          <h1 className="font-display text-title font-semibold text-balance">This page isn&apos;t in our yard</h1>
          <p className="max-w-prose text-lead text-fg-muted">
            The link may be old or mistyped. If a sign company sent you here to book, ask them for their current booking link.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <Link href="/" className="flex h-12 items-center rounded-control bg-action px-6 text-lead font-bold text-on-action hover:bg-action-hover">
              Go to the home page
            </Link>
            <Link href="/auth/sign-in" className="font-bold text-action-text underline underline-offset-4">Sign in to your dashboard</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
