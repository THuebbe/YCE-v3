import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, type LegalSection } from '@/shared/components/layout/LegalPage'
import { LEGAL_ENTITY, SUPPORT_EMAIL } from '@/lib/site'
import { PLAN_PRICES } from '@/features/billing/subscription'

export const metadata: Metadata = { title: 'Terms of Service - YardCard Elite' }

// Owner's working draft (2026-10-20): to be compared against other terms
// and reviewed by a professional before go-live (STATE.md). The Stripe
// Connect paragraph follows Stripe's required platform wording.
const EFFECTIVE = 'October 30, 2026'
const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
const p = PLAN_PRICES

const sections: LegalSection[] = [
  {
    title: 'If you booked a display',
    body: (
      <>
        <p>
          Your rental is an agreement between you and the agency you booked with. The agency sets the
          price, schedule, cancellation fees and late and damage fees, and shows them to you as booking
          terms before you pay. Those booking terms, which you agree to when you place your order,
          govern your rental.
        </p>
        <p>
          {LEGAL_ENTITY} provides the booking software only: we are not a party to your rental and
          don&rsquo;t deliver, install or remove signs. Payments go to the agency through Stripe.
          Questions about your display, changes, refunds or fees go to the agency; its contact details
          are in your confirmation email. Sections 11, 12, 14 and 15 also apply to you.
        </p>
      </>
    ),
  },
  {
    title: 'Agency accounts',
    body: (
      <ul>
        <li>You must be at least 18 and able to enter into contracts for your business.</li>
        <li>Give accurate information and keep it up to date.</li>
        <li>Keep your sign-in secure. You are responsible for what happens in your account.</li>
      </ul>
    ),
  },
  {
    title: 'Plans, trial and billing',
    body: (
      <ul>
        <li>
          YardCard Elite is a subscription: Essentials (${p.essentials.month}/month or ${p.essentials.year}/year)
          or Elite (${p.elite.month}/month or ${p.elite.year}/year). Current prices and features are on
          the <Link href="/pricing">pricing page</Link>. Taxes may be added where required.
        </li>
        <li>
          Your first subscription may start with a free trial. A card is required to start it, and the
          first payment is taken when the trial ends unless you cancel before then.
        </li>
        <li>
          Subscriptions renew automatically each month or year until cancelled. You can change plans,
          update your card or cancel at any time in Manage billing; a cancelled plan runs to the end of
          the period already paid. Payments are not refunded for partial periods, except where the law
          requires it.
        </li>
        <li>
          If a renewal payment fails, your booking page stays open for 7 days while the payment is
          retried. After that it closes to new bookings until the payment goes through. Your dashboard
          and existing orders keep working.
        </li>
        <li>We will give at least 30 days&rsquo; notice by email before a price increase affects you.</li>
      </ul>
    ),
  },
  {
    title: 'Customer payments (Stripe)',
    body: (
      <>
        <p>
          Payment processing services for agencies on YardCard Elite are provided by Stripe and are
          subject to the <a href="https://stripe.com/connect-account/legal">Stripe Connected Account
          Agreement</a>, which includes the <a href="https://stripe.com/legal">Stripe Terms of
          Service</a> (collectively, the &ldquo;Stripe Services Agreement&rdquo;). By agreeing to these
          terms or continuing to operate as an agency on YardCard Elite, you agree to be bound by the
          Stripe Services Agreement, as the same may be modified by Stripe from time to time. As a
          condition of YardCard Elite enabling payment processing services through Stripe, you agree to
          provide YardCard Elite accurate and complete information about you and your business, and you
          authorize YardCard Elite to share it and transaction information related to your use of the
          payment processing services provided by Stripe.
        </p>
        <p>
          Customer payments go to your Stripe account. Stripe charges its own processing fees. If we set
          up Stripe for you (&ldquo;Set it up for me&rdquo;), YardCard Elite also keeps $3 from each
          booking; that fee is not returned when you refund or cancel a booking. (If a customer is
          charged but the booking fails to save on our side, the whole payment, including the $3, is
          refunded automatically.) Agencies that connect
          their own Stripe account pay no per-booking fee to us.
        </p>
      </>
    ),
  },
  {
    title: 'Your responsibilities as an agency',
    body: (
      <ul>
        <li>You run your rental business: delivering, installing and collecting signs, and the condition of your inventory.</li>
        <li>You honor the prices and booking terms your customers agreed to, and charge cancellation, late or damage fees only as those terms allow.</li>
        <li>You follow the laws that apply to you, including taxes, consumer protection and any local or HOA rules about yard signs.</li>
        <li>You use customer information only to provide and manage their bookings, and as the law allows.</li>
        <li>You have the rights to anything you upload, such as logos and sign images.</li>
      </ul>
    ),
  },
  {
    title: 'Your data',
    body: (
      <p>
        Your business information and your customers&rsquo; booking information belong to you. You let
        us store, process and display it to provide YardCard Elite to you and your customers, as
        described in our <Link href="/privacy">Privacy Policy</Link>. We act on your behalf for your
        customers&rsquo; information. Ask us at {mail} for a copy of your data.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <p>
        Don&rsquo;t use YardCard Elite for anything unlawful or fraudulent; don&rsquo;t try to reach
        another agency&rsquo;s data, break or overload the service, get around plan limits or security,
        or copy or resell the software.
      </p>
    ),
  },
  {
    title: 'Ending or suspending an account',
    body: (
      <p>
        You can cancel at any time (section 3). We may suspend or close an account that doesn&rsquo;t
        pay or that breaks these terms, with notice where we reasonably can. Sections 6, 9 and 11 to 15
        continue after an account ends.
      </p>
    ),
  },
  {
    title: 'Our software',
    body: (
      <p>
        YardCard Elite, its software and its brand belong to {LEGAL_ENTITY} and its licensors. Your
        subscription gives you the right to use it for your business while the subscription is active.
        If you send us ideas or feedback, we may use them without owing you anything.
      </p>
    ),
  },
  {
    title: 'Changes to the service',
    body: (
      <p>
        We improve YardCard Elite over time and may add, change or remove features. If we remove
        something your plan depends on in a significant way, we will tell you in advance.
      </p>
    ),
  },
  {
    title: 'Disclaimer',
    body: (
      <p>
        YardCard Elite is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent
        the law allows, we make no warranties beyond those in these terms, including any implied
        warranties of merchantability or fitness for a particular purpose, and we don&rsquo;t promise
        the service will be uninterrupted or error-free.
      </p>
    ),
  },
  {
    title: 'Limitation of liability',
    body: (
      <p>
        To the extent the law allows, {LEGAL_ENTITY} is not liable for indirect, incidental, special or
        consequential damages, or for lost profits, revenue or data. Our total liability for any claim
        about YardCard Elite is limited to the amount you paid us in the 12 months before the claim, or
        $100 if you paid us nothing (for example, if you booked a display). We are not responsible for
        an agency&rsquo;s rental services.
      </p>
    ),
  },
  {
    title: 'Indemnity',
    body: (
      <p>
        Agencies will cover {LEGAL_ENTITY}&rsquo;s reasonable costs from claims brought by their
        customers or others about the agency&rsquo;s rental business or a breach of these terms.
      </p>
    ),
  },
  {
    title: 'Disputes and governing law',
    body: (
      <p>
        Please contact us first at {mail}; most problems can be solved that way. These terms are
        governed by the laws of the State of Iowa, without regard to its conflict-of-law rules, and
        disputes will be handled in the state or federal courts located in Iowa.
      </p>
    ),
  },
  {
    title: 'General',
    body: (
      <ul>
        <li>
          We may transfer these terms to an affiliate of {LEGAL_ENTITY} or to a company that takes over
          YardCard Elite; we will tell you if that happens. You may not transfer them without our consent.
        </li>
        <li>
          We may update these terms. If a change is significant, we will tell agencies by email or in
          the app at least 30 days before it takes effect. Continuing to use YardCard Elite after that
          means you accept the new terms.
        </li>
        <li>If part of these terms can&rsquo;t be enforced, the rest still applies.</li>
        <li>These terms, the Privacy Policy and any booking terms you agreed to are the whole agreement about YardCard Elite.</li>
      </ul>
    ),
  },
  {
    title: 'Contact',
    body: <p>{LEGAL_ENTITY}, operator of YardCard Elite: {mail}.</p>,
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      effectiveDate={EFFECTIVE}
      intro={
        <p>
          These terms are an agreement between you and {LEGAL_ENTITY}, which operates YardCard Elite. By
          creating an agency account, subscribing or booking a display, you agree to them. Section 1 is
          for people who book a display; the rest is mostly for agencies.
        </p>
      }
      sections={sections}
    />
  )
}
