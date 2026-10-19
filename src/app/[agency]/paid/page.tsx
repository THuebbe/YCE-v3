import { getAgencyBySlug } from '@/lib/db/supabase-client'

/** Where a customer lands after paying a fee link (Stripe Checkout on the agency's account) */
export default async function PaidPage({ params, searchParams }: {
  params: Promise<{ agency: string }>
  searchParams: Promise<{ cancelled?: string }>
}) {
  const { agency: slug } = await params
  const { cancelled } = await searchParams
  const agency = await getAgencyBySlug(slug)
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <main className="mx-auto max-w-lg rounded-xl bg-white p-6 text-center shadow-default">
        <p className="text-sm font-medium text-neutral-500">{agency?.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">{cancelled ? 'Payment not completed' : 'Thank you, you’re paid up'}</h1>
        <p className="mt-3 text-neutral-700">
          {cancelled ? 'You can use the link in your email to pay any time.' : 'Your payment went through. Stripe emails you a receipt.'}
        </p>
      </main>
    </div>
  )
}
