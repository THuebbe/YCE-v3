import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateAgencyForm } from '@/features/auth/components/CreateAgencyForm'
import { Logo } from '@/shared/components/brand/Logo'
import { SUPPORT_EMAIL } from '@/lib/site'

export const metadata = { title: 'Set up your agency' }

export default async function OnboardingPage() {
  const user = await currentUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <div className="flex min-h-dvh flex-col items-center bg-canvas px-4 py-8 font-body text-fg sm:py-12">
      <Link href="/" className="mb-8 block w-full max-w-[12rem]" aria-label="YardCard Elite home">
        <Logo className="h-auto w-full" title="" />
      </Link>
      <main className="grid w-full max-w-xl gap-6">
        <div className="grid gap-2">
          <h1 className="font-display text-title font-semibold">Set up your agency</h1>
          <p className="text-fg-muted">Four quick steps, then pick a plan and your booking page is ready.</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-5 shadow-raised sm:p-6">
          <CreateAgencyForm />
        </div>
        <p className="text-center text-fine text-fg-muted">
          Need help? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-action-text underline underline-offset-4">{SUPPORT_EMAIL}</a>
        </p>
      </main>
    </div>
  )
}
