import Link from 'next/link'
import { Logo } from '@/shared/components/brand/Logo'
import { LEGAL_ENTITY, SUPPORT_EMAIL } from '@/lib/site'
import { MarketingHeader } from './MarketingHeader'

/**
 * Header and footer for the public marketing pages (home, pricing).
 * `hero`: the page opens with an orange `data-hero` section, so
 * the header starts orange and lifts away as it scrolls by.
 */
export function MarketingShell({ startLabel, hero = false, children }: { startLabel: string; hero?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-body text-fg">
      <MarketingHeader startLabel={startLabel} hero={hero} />

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
