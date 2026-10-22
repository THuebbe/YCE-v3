import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { trialDays } from '@/features/billing/stripe-billing'
import { marketingContent } from '@/features/marketing/content'
import { MarketingShell } from '@/features/marketing/components/MarketingShell'
import { PlanCards } from '@/features/marketing/components/PlanCards'
import { Faq } from '@/features/marketing/components/Faq'
import { loadSceneAssets } from '@/features/yard-scene/assets'
import { TryItDemo } from '@/features/yard-scene/TryItDemo'

// Signed-in agencies go straight to their dashboard
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'YardCard Elite - Online booking for yard sign rentals',
  description: 'Booking software for yard sign rental businesses. Customers design their display, pay and pick a date. You get the order.',
}

export default async function HomePage() {
  try {
    const { userId } = await auth()
    if (userId) redirect('/routing')
  } catch (error) {
    // redirect() works by throwing; anything else (auth unavailable) shows the page
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
  }

  const c = marketingContent({ trialDays: trialDays() })
  const assets = loadSceneAssets('classic', ['gold', 'red'])

  return (
    <MarketingShell startLabel={c.startLabel}>
      {/* Hero: the product itself, live */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-10 pb-12 sm:px-6 sm:pt-16">
        <div className="grid max-w-3xl gap-4">
          <h1 className="font-display text-hero font-semibold text-balance">{c.hero.headline}</h1>
          <p className="max-w-prose text-lead text-fg-muted">{c.hero.sub}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <Link href="/auth/sign-up" className="flex h-12 items-center rounded-control bg-action px-6 text-lead font-bold text-on-action hover:bg-action-hover">
              {c.startLabel}
            </Link>
            <Link href="/pricing" className="font-bold text-action-text underline underline-offset-4">See pricing</Link>
          </div>
          <p className="text-fine text-fg-muted">{c.trialNote}</p>
        </div>
        <TryItDemo assets={assets} />
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6">
          <h2 className="font-display text-title font-semibold">{c.howItWorks.title}</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {c.howItWorks.steps.map((step, i) => (
              <li key={step.title} className="grid content-start gap-2">
                <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-brand font-display text-heading font-semibold text-on-brand">{i + 1}</span>
                <h3 className="font-display text-heading font-semibold">{step.title}</h3>
                <p className="text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid gap-4">
          <h2 className="font-display text-title font-semibold">{c.customerView.title}</h2>
          <p className="max-w-prose text-lead text-fg-muted">{c.customerView.body}</p>
        </div>
        <figure className="mx-auto grid w-full max-w-[20rem] gap-2">
          <div className="overflow-hidden rounded-sheet border-8 border-fg bg-fg shadow-overlay">
            <Image
              src="/marketing/booking-example.png"
              alt="A booking page on a phone: step 2 of 5, Design your display, with HAPPY BIRTHDAY EMMA on a lawn and the signs reserved"
              width={780}
              height={1560}
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="text-center text-fine text-fg-muted">{c.customerView.caption}</figcaption>
        </figure>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6">
          <h2 className="font-display text-title font-semibold">{c.features.title}</h2>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.items.map(f => (
              <div key={f.title} className="grid content-start gap-1">
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-fg-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6">
        <div className="grid gap-2">
          <h2 className="font-display text-title font-semibold">{c.pricing.title}</h2>
          <p className="text-lead text-fg-muted">{c.pricing.sub}</p>
        </div>
        <PlanCards plans={c.pricing.plans} startLabel={c.startLabel} />
        <Link href="/pricing" className="justify-self-start font-bold text-action-text underline underline-offset-4">Compare plans and read the pricing questions</Link>
      </section>

      <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 pb-12 sm:px-6">
        <h2 className="font-display text-title font-semibold">{c.faq.title}</h2>
        <Faq items={c.faq.items} />
      </section>

      <section className="bg-brand text-on-brand">
        <div className="mx-auto grid w-full max-w-6xl justify-items-start gap-4 px-4 py-12 sm:px-6">
          <h2 className="font-display text-title font-semibold">{c.closing.title}</h2>
          <p className="text-lead opacity-90">{c.closing.sub}</p>
          <Link href="/auth/sign-up" className="flex h-12 items-center rounded-control bg-action px-6 text-lead font-bold text-on-action hover:bg-action-hover">
            {c.startLabel}
          </Link>
          <p className="text-fine opacity-80">{c.trialNote}</p>
        </div>
      </section>
    </MarketingShell>
  )
}
