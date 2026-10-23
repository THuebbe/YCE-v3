import type { Metadata } from 'next'
import { CreateAgencyForm } from '@/features/auth/components/CreateAgencyForm'
import { Logo } from '@/shared/components/brand/Logo'

export const metadata: Metadata = { title: 'Onboarding - lab' }

/** The agency signup form without signing in (preview and dev only). The last step creates nothing. */
export default function OnboardingLabPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8 sm:py-12">
      <div className="mb-8 block w-full max-w-[12rem]"><Logo className="h-auto w-full" title="YardCard Elite" /></div>
      <main className="grid w-full max-w-xl gap-6">
        <div className="grid gap-2">
          <h1 className="font-display text-title font-semibold">Set up your agency</h1>
          <p className="text-fg-muted">Four quick steps, then pick a plan and your booking page is ready.</p>
        </div>
        <p className="rounded-control bg-notice-soft p-3 text-fine text-notice">Demo: the address check is real, but the last step creates nothing.</p>
        <div className="rounded-card border border-line bg-surface p-5 shadow-raised sm:p-6">
          <CreateAgencyForm demo />
        </div>
      </main>
    </div>
  )
}
