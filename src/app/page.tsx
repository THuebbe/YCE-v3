import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isDemoMode } from '@/features/demo/config'
import { trialDays } from '@/features/billing/stripe-billing'
import { marketingContent } from '@/features/marketing/content'
import { MarketingShell } from '@/features/marketing/components/MarketingShell'
import { PlanCards } from '@/features/marketing/components/PlanCards'
import { Faq } from '@/features/marketing/components/Faq'
import { ExampleDisplays } from '@/features/marketing/components/ExampleDisplays'
import { FeatureIcon } from '@/features/marketing/components/FeatureIcon'
import { StakedSign } from '@/features/marketing/components/StakedSign'
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
  // The demo site has no marketing page: demos are by invitation (DEMO.md)
  if (isDemoMode()) redirect('/demo')

  const c = marketingContent({ trialDays: trialDays() })
  const assets = loadSceneAssets('classic', ['gold', 'red'])
  const exampleAssets = loadSceneAssets('classic', [...new Set(c.examples.displays.flatMap(d => d.rows.map(r => r.colorway)))])
  // The step numbers are real signs: 1 gold, 2 red, 3 gold
  const stepSigns = ['gold', 'red', 'gold'].map((colorway, i) => assets.find(a => a.character === String(i + 1) && a.colorway === colorway))

  return (
    <MarketingShell startLabel={c.startLabel} hero>
      {/* Hero: the one orange surface (DESIGN.md, "Marketing pages"), with the product itself, live */}
      <section data-hero data-surface="hero" className="bg-hero-bg text-on-hero">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-8 pb-14 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12 lg:pb-20">
          <div className="grid max-w-3xl content-center gap-4">
            <h1 className="font-display text-hero font-semibold text-balance">{c.hero.headline}</h1>
            <p className="max-w-prose text-lead text-on-hero-muted">{c.hero.sub}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <Link href="/auth/sign-up" className="flex h-12 items-center rounded-control border-2 border-on-hero bg-hero-action px-6 text-lead font-bold text-on-hero-action shadow-raised hover:bg-hero-action-hover focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
                {c.startLabel}
              </Link>
              <Link href="/pricing" className="rounded-control font-bold underline underline-offset-4 focus-visible:shadow-(--focus-ring) focus-visible:outline-none">See pricing</Link>
            </div>
            <p className="text-fine text-on-hero-muted">{c.trialNote}</p>
          </div>
          <TryItDemo assets={assets} />
        </div>
      </section>

      <section className="bg-brand text-on-brand">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6">
          <h2 className="font-display text-title font-semibold">{c.howItWorks.title}</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {c.howItWorks.steps.map((step, i) => {
              const sign = stepSigns[i]
              return (
                <li key={step.title} className="grid content-start gap-3">
                  {sign
                    ? <StakedSign asset={sign} className="h-20 w-auto justify-self-start" />
                    : <span aria-hidden className="font-display text-title font-semibold text-brand-accent">{i + 1}</span>}
                  <h3 className="font-display text-heading font-semibold">{step.title}</h3>
                  <p className="text-on-brand-muted">{step.body}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="bg-surface-sky">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6">
          <div className="grid gap-2">
            <h2 className="font-display text-title font-semibold">{c.examples.title}</h2>
            <p className="max-w-prose text-lead text-fg-muted">{c.examples.sub}</p>
          </div>
          <ExampleDisplays assets={exampleAssets} examples={c.examples.displays} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid gap-4">
          <h2 className="font-display text-title font-semibold">{c.customerView.title}</h2>
          <p className="max-w-prose text-lead text-fg-muted">{c.customerView.body}</p>
        </div>
        <figure className="mx-auto grid w-full max-w-[20rem] gap-2">
          <div className="overflow-hidden rounded-sheet border-8 border-fg bg-fg shadow-overlay md:rotate-2">
            <Image
              src="/marketing/booking-example.png"
              alt="A booking page on a phone in a sample agency’s purple: step 2 of 5, Design your display, with HAPPY 7TH BIRTHDAY over EMMA on a lawn and the signs held for the customer’s dates"
              width={780}
              height={1560}
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="text-center text-fine text-fg-muted">{c.customerView.caption}</figcaption>
        </figure>
      </section>

      <section className="bg-surface-warm">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6">
          <h2 className="font-display text-title font-semibold">{c.features.title}</h2>
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.items.map(f => (
              <div key={f.title} className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-4 gap-y-1">
                <FeatureIcon name={f.icon} className="row-span-2 size-14" />
                <h3 className="self-end font-display text-heading font-semibold">{f.title}</h3>
                <p className="text-fg-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6">
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
