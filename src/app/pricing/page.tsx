import type { Metadata } from 'next'
import { trialDays } from '@/features/billing/stripe-billing'
import { marketingContent } from '@/features/marketing/content'
import { MarketingShell } from '@/features/marketing/components/MarketingShell'
import { PlanCards } from '@/features/marketing/components/PlanCards'
import { Faq } from '@/features/marketing/components/Faq'

export const metadata: Metadata = { title: 'Pricing - YardCard Elite' }

// Plans and the tier split: PRODUCT.md "Plans" (DECIDED 2026-10-19); copy in features/marketing/content.ts
export default function PricingPage() {
  const c = marketingContent({ trialDays: trialDays() })
  return (
    <MarketingShell startLabel={c.startLabel}>
      <section className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid max-w-3xl gap-3">
          <h1 className="font-display text-hero font-semibold text-balance">{c.pricing.title}</h1>
          <p className="text-lead text-fg-muted">{c.pricing.sub}</p>
          <p className="text-fine text-fg-muted">{c.trialNote}</p>
        </div>
        <PlanCards plans={c.pricing.plans} startLabel={c.startLabel} />
      </section>
      <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 pb-16 sm:px-6">
        <h2 className="font-display text-title font-semibold">{c.faq.title}</h2>
        <Faq items={c.faq.items} />
      </section>
    </MarketingShell>
  )
}
