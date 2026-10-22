import { auth } from '@clerk/nextjs/server'
import { redirect, unstable_rethrow } from 'next/navigation'
import Link from 'next/link'
import { getUserById } from '@/lib/db/supabase-client'
import { AuthFrame } from '@/features/auth/components/auth-frame'
import { SUPPORT_EMAIL } from '@/lib/site'

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

/**
 * Where sign-in lands: on to the agency's dashboard, or to onboarding for a
 * user without an agency yet. loading.tsx shows while this runs.
 */
export default async function RoutingPage() {
  try {
    const { userId } = await auth()
    if (!userId) redirect('/auth/sign-in')

    // A brand-new user's row is written by the Clerk webhook, which can lag
    // the first sign-in by a few seconds: look again before giving up
    let user = await getUserById(userId)
    for (const wait of [2000, 3000]) {
      if (user) break
      await new Promise(resolve => setTimeout(resolve, wait))
      user = await getUserById(userId)
    }

    // A server redirect: the old page relied on an inline <script>, which
    // React never runs when /routing is reached by client-side navigation
    // (as it is right after sign-in), so it hung on "Redirecting..."
    if (user?.agency?.slug) redirect(`/${user.agency.slug}/dashboard`)
    redirect('/onboarding')
  } catch (error) {
    // Let Next.js handle its own redirect (and other framework) errors
    unstable_rethrow(error)
    console.error('Routing after sign-in failed:', error)

    return (
      <AuthFrame footer={<>Still stuck? Email <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-action-text underline underline-offset-4">{SUPPORT_EMAIL}</a></>}>
        <div className="grid w-full gap-4 rounded-card border border-line bg-surface p-6 text-center shadow-raised">
          <h1 className="font-display text-title font-semibold">We couldn&apos;t open your account</h1>
          <p className="text-fg-muted">Something went wrong on our side while signing you in. Trying again usually fixes it.</p>
          <Link href="/routing" className="flex h-11 items-center justify-center rounded-control bg-action px-5 font-bold text-on-action hover:bg-action-hover">
            Try again
          </Link>
          <Link href="/auth/sign-in" className="font-bold text-action-text underline underline-offset-4">Sign in again</Link>
        </div>
      </AuthFrame>
    )
  }
}
