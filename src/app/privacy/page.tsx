import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, type LegalSection } from '@/shared/components/layout/LegalPage'
import { LEGAL_ENTITY, SUPPORT_EMAIL } from '@/lib/site'

export const metadata: Metadata = { title: 'Privacy Policy - YardCard Elite' }

// Owner's working draft (2026-10-20): to be compared against other
// policies and reviewed by a professional before go-live (STATE.md).
const EFFECTIVE = 'October 20, 2026'
const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>

const sections: LegalSection[] = [
  {
    title: 'Who we are',
    body: (
      <>
        <p>
          YardCard Elite is booking and management software for yard sign rental businesses
          (&ldquo;agencies&rdquo;). It is operated by {LEGAL_ENTITY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        </p>
        <p>
          <strong>If you booked a display,</strong> you booked with an agency, not with us. The agency
          decides how your booking information is used to provide your rental. We store and process it
          for the agency so it can take and fulfill your booking. Questions about your rental itself go
          to the agency; questions about this policy can come to us.
        </p>
      </>
    ),
  },
  {
    title: 'What we collect',
    body: (
      <>
        <p><strong>When you book a display:</strong></p>
        <ul>
          <li>Your name, email address and phone number.</li>
          <li>The address where the display goes, and your event date and setup and pickup times.</li>
          <li>Your display choices: the message, the name and any number shown, colors, theme and hobbies, and a picture of the design.</li>
          <li>Your order, payment, refund, cancellation and fee records.</li>
        </ul>
        <p>
          Your card details go straight to Stripe, our payment processor. We never see or store your
          full card number. Your card is saved with the agency&rsquo;s Stripe account so the agency can
          charge late or damage fees described in the booking terms you agree to.
        </p>
        <p><strong>When an agency uses YardCard Elite:</strong></p>
        <ul>
          <li>Account details: name, email address and sign-in information (handled by Clerk, including Google sign-in if used).</li>
          <li>Business details: business name, contact details, address, hours, prices, policies and sign inventory.</li>
          <li>Subscription status. Subscription payments are handled by Stripe; we don&rsquo;t store card numbers.</li>
        </ul>
        <p>
          <strong>Automatically:</strong> sign-in cookies that keep agency users signed in, and basic
          server logs (such as IP address and browser type) kept by our hosting providers for security
          and troubleshooting. We don&rsquo;t use advertising trackers or analytics cookies.
        </p>
      </>
    ),
  },
  {
    title: 'How we use it',
    body: (
      <ul>
        <li>To take, schedule, deliver, change and cancel bookings, and to let the agency fulfill them.</li>
        <li>To process payments, refunds and fees through the agency&rsquo;s Stripe account.</li>
        <li>To send emails about a booking: confirmation, changes, cancellation and fee notices.</li>
        <li>To run agency accounts and subscriptions, and to provide support.</li>
        <li>To keep the service secure, prevent fraud and meet legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    title: 'Who we share it with',
    body: (
      <>
        <ul>
          <li><strong>The agency you booked with</strong>, which needs your details to provide your rental.</li>
          <li>
            <strong>Service providers</strong> that run parts of YardCard Elite for us, only as needed:
            Stripe (payments), Clerk (agency sign-in), Supabase (database), Vercel (hosting and file
            storage) and Resend (email).
          </li>
          <li><strong>When required by law</strong>, or to protect the rights and safety of people or of the service.</li>
          <li>
            <strong>A business transfer:</strong> if YardCard Elite moves to another company, including an
            affiliate of {LEGAL_ENTITY} formed to run it, the information goes with it under this policy.
          </li>
        </ul>
        <p>We do not sell personal information, and we do not share it for advertising.</p>
      </>
    ),
  },
  {
    title: 'How long we keep it',
    body: (
      <p>
        We keep booking and order records for as long as they are needed for the purposes above,
        including the agency&rsquo;s tax, accounting and payment-dispute records. Agency account
        information is kept while the account is open and for a reasonable period after it closes. You
        can ask us to delete your information sooner (next section); we may keep what the law requires.
      </p>
    ),
  },
  {
    title: 'Your choices and rights',
    body: (
      <>
        <p>
          You can ask to see, correct or delete your personal information by emailing {mail}. If you
          booked a display, you can also ask the agency directly. We will confirm the request comes from
          you, and we respond within 45 days. Depending on where you live (for example California), you
          may have further rights under state law; we will honor them, and you won&rsquo;t be treated
          differently for using them.
        </p>
      </>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        Information is encrypted in transit (HTTPS), access is limited to the agency it belongs to and to
        the people who run the service, and card data stays with Stripe. No system is perfectly secure,
        so we can&rsquo;t promise information will never be accessed without permission; if a breach
        affects you, we will tell you as the law requires.
      </p>
    ),
  },
  {
    title: 'Children',
    body: (
      <p>
        YardCard Elite is for adults: bookings and agency accounts must be made by people 18 or older.
        A display often shows a child&rsquo;s name or age; that detail is given by the adult making the
        booking and is used only for that display. We don&rsquo;t knowingly collect information from
        children under 13.
      </p>
    ),
  },
  {
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy. The date at the top shows when it last changed. If a change is
        significant, we will tell agencies by email or in the app before it takes effect.
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <p>
        {LEGAL_ENTITY}, operator of YardCard Elite: {mail}. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate={EFFECTIVE}
      intro={<p>This policy explains what information YardCard Elite collects, how it is used and the choices you have.</p>}
      sections={sections}
    />
  )
}
