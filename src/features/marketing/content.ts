import { PLAN_PRICES } from '@/features/billing/subscription'
import { SITE_HOST, SUPPORT_EMAIL } from '@/lib/site'
import type { ExampleDisplay } from './components/ExampleDisplays'
import type { FeatureIconName } from './components/FeatureIcon'

/**
 * Every word on the marketing pages (home, pricing). Edit copy here; the
 * components only lay it out. Prices come from PLAN_PRICES and the trial
 * from the billing settings, so the pages can't drift from what Stripe
 * charges.
 *
 * Rules: DESIGN.md (voice, no invented stats or testimonials).
 */

export interface PlanCopy {
  id: 'essentials' | 'elite'
  name: string
  tagline: string
  monthly: number
  annual: number
  featured: boolean
  features: string[]
}

export function marketingContent({ trialDays }: { trialDays: number }) {
  const trial = trialDays > 0
  const startLabel = trial ? 'Start free trial' : 'Get started'

  const plans: PlanCopy[] = [
    {
      id: 'essentials',
      name: 'Essentials',
      tagline: 'Everything you need to run your agency',
      monthly: PLAN_PRICES.essentials.month,
      annual: PLAN_PRICES.essentials.year,
      featured: false,
      features: [
        'Online booking page for your customers',
        'Card payments straight to your account',
        'Email for every new order',
        'Sign inventory and order board',
        'Order summary PDF for every job',
      ],
    },
    {
      id: 'elite',
      name: 'Elite',
      tagline: 'For agencies that run a tight operation',
      monthly: PLAN_PRICES.elite.month,
      annual: PLAN_PRICES.elite.year,
      featured: true,
      features: [
        'Everything in Essentials',
        'Pick tickets and pickup checklists',
        'Set your own cancellation, late and damage fees',
        'Revenue tracking on your dashboard',
      ],
    },
  ]

  return {
    startLabel,
    trialNote: trial ? `${trialDays}-day free trial on either plan. Card required, cancel anytime.` : 'Cancel anytime.',

    hero: {
      headline: 'Your yard sign business, booked online.',
      sub: 'Customers design their display, pay, and pick a date. You get the order.',
      demoLabel: 'Try it: type a name',
    },

    howItWorks: {
      title: 'How it works',
      steps: [
        { title: 'Set up your shop', body: 'Add your prices and the signs you own. Connect Stripe so customers can pay you by card.' },
        { title: 'Share your booking link', body: `Your page lives at ${SITE_HOST}/your-name/booking. Put it on your website, Facebook page or flyers.` },
        { title: 'Get the order', body: 'Customers design their display, choose a date and pay. You get an email and a ready-to-go order with every sign listed.' },
      ],
    },

    examples: {
      title: 'Any occasion, any name',
      sub: 'Every display is built from real signs, so what your customer sees is what goes in their yard.',
      displays: [
        { occasion: 'Graduation', rows: [{ text: 'CONGRATS', colorway: 'blue' }, { text: 'CLASS OF 2026', colorway: 'gold' }] },
        { occasion: 'Homecoming', rows: [{ text: 'WELCOME HOME', colorway: 'green' }, { text: 'JAKE', colorway: 'red' }] },
        { occasion: 'New baby', rows: [{ text: 'OH BABY', colorway: 'pink' }, { text: 'LILY', colorway: 'purple' }] },
      ] satisfies ExampleDisplay[],
    },

    customerView: {
      title: 'What your customers see',
      body: 'A booking page with your name on it. They pick the message, type the name and watch the signs go up on the lawn before they book. Their signs are held while they finish, so nothing gets double-booked.',
      caption: 'Example booking page, in a sample agency’s own colors',
    },

    features: {
      title: 'Built for yard sign rentals',
      items: [
        { icon: 'preview', title: 'Live display preview', body: 'Customers see their display on a lawn as they design it, built from the signs you actually stock.' },
        { icon: 'paid', title: 'Paid up front', body: 'Card payments go straight to your Stripe account. No invoices to chase.' },
        { icon: 'calendar', title: 'No double bookings', body: 'Signs are held for each booking’s dates, so two customers can’t book the same letters.' },
        { icon: 'orders', title: 'Orders in one place', body: 'An order board for the week ahead and a printable summary for every job.' },
        { icon: 'brand', title: 'Your brand on the page', body: 'Your business name and contact details on every booking page and confirmation email.' },
        { icon: 'rules', title: 'Your rules (Elite)', body: 'Set your own cancellation window and fees, late fees and damage fees.' },
      ] satisfies { icon: FeatureIconName; title: string; body: string }[],
    },

    pricing: {
      title: 'Simple pricing',
      sub: trial
        ? `Two plans. Try either free for ${trialDays} days.`
        : 'Two plans. Pay monthly or save with a year.',
      plans,
    },

    faq: {
      title: 'Questions',
      items: [
        ...(trial
          ? [{ q: 'Do you offer a free trial?', a: `Yes. Your first subscription starts with a ${trialDays}-day free trial on either plan. A card is needed to start, and you aren't charged until the trial ends.` }]
          : []),
        { q: 'Can I pay yearly?', a: `Yes. Annual billing is $${PLAN_PRICES.essentials.year}/year for Essentials and $${PLAN_PRICES.elite.year}/year for Elite.` },
        { q: 'Can I cancel anytime?', a: 'Yes. Cancel in Manage billing whenever you like. Your plan runs to the end of the period you paid for.' },
        { q: 'How do my customers pay me?', a: 'By card, through Stripe. Connect your own Stripe account at no extra cost, or let us set up card payments for you in a few minutes for $3 per booking. Payments go to you either way. Venmo and PayPal are coming soon.' },
        { q: 'Do my customers need an account?', a: 'No. They book and pay on your page in a few minutes, and get a confirmation by email.' },
      ],
    },

    closing: {
      title: 'Ready for your next booking?',
      sub: 'Set up your page this afternoon.',
    },

    supportEmail: SUPPORT_EMAIL,
  }
}

export type MarketingContent = ReturnType<typeof marketingContent>
