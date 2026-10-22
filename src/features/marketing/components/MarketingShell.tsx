import Link from 'next/link'
import { Logo } from '@/shared/components/brand/Logo'
import { LEGAL_ENTITY, SUPPORT_EMAIL } from '@/lib/site'

/** Header and footer for the public marketing pages (home, pricing) */
export function MarketingShell({ startLabel, children }: { startLabel: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-body text-fg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="YardCard Elite home" className="shrink-0">
            <Logo className="h-8 w-auto sm:h-9" title="" />
          </Link>
          <nav className="flex items-center gap-1 text-fine font-bold sm:gap-2" aria-label="Main">
            <Link href="/pricing" className="hidden rounded-control px-3 py-2 hover:bg-surface-sunken sm:block">Pricing</Link>
            <Link href="/auth/sign-in" className="rounded-control px-3 py-2 hover:bg-surface-sunken">Sign in</Link>
            <Link href="/auth/sign-up" className="hidden h-10 items-center rounded-control bg-action px-4 text-on-action hover:bg-action-hover sm:flex">
              {startLabel}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 text-fine text-fg-muted sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
          <div className="grid gap-2">
            <Logo className="h-7 w-auto" title="YardCard Elite" />
            <p>Booking software for yard sign rental businesses. Run by {LEGAL_ENTITY}.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            <Link href="/pricing" className="hover:text-fg">Pricing</Link>
            <Link href="/terms" className="hover:text-fg">Terms</Link>
            <Link href="/privacy" className="hover:text-fg">Privacy</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-fg">{SUPPORT_EMAIL}</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
