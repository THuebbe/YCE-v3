import { CircleCheck, CircleAlert } from 'lucide-react'
import { getAgencyBySlug } from '@/lib/db/supabase-client'
import { activeBranding } from '@/features/agency/branding'
import { BookingFrame } from '@/features/booking/components/booking-frame'

/** Where a customer lands after paying a fee link (Stripe Checkout on the agency's account) */
export default async function PaidPage({ params, searchParams }: {
  params: Promise<{ agency: string }>
  searchParams: Promise<{ cancelled?: string }>
}) {
  const { agency: slug } = await params
  const { cancelled } = await searchParams
  const agency = await getAgencyBySlug(slug)
  const Icon = cancelled ? CircleAlert : CircleCheck
  return (
    <BookingFrame agencyName={agency?.name ?? ''} branding={activeBranding(agency)}>
      <main className="mx-auto grid w-full max-w-lg justify-items-center gap-3 px-4 py-12 text-center">
        <Icon className={cancelled ? 'size-12 text-caution' : 'size-12 text-positive'} aria-hidden />
        <h1 className="font-display text-title font-semibold">{cancelled ? 'Payment not completed' : 'Thank you, you’re paid up'}</h1>
        <p className="text-lead text-fg-muted">
          {cancelled ? 'Nothing was charged. You can use the link in your email to pay any time.' : 'Your payment went through. Stripe emails you a receipt.'}
        </p>
      </main>
    </BookingFrame>
  )
}
