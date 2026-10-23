import type { Metadata } from 'next'
import { sampleEmails } from '@/lib/email-samples'

export const metadata: Metadata = { title: 'Emails - lab' }

/** Every email we send, with sample data, as the inbox shows it (preview and dev only) */
export default function EmailsLabPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8">
      <div className="grid gap-1">
        <h1 className="font-display text-title font-semibold">Emails</h1>
        <p className="text-fg-muted">What each email looks like in an inbox, with sample data. Images load from the live site. To get them in a real inbox: <code>pnpm test-email you@example.com</code>.</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {sampleEmails().map(e => (
          <section key={e.title} className="grid gap-2">
            <h2 className="font-display text-heading font-semibold">{e.title} <span className="text-fine font-bold text-fg-muted">to the {e.to}</span></h2>
            <iframe title={e.title} srcDoc={e.html} className="h-[640px] w-full rounded-card border border-line bg-surface" />
          </section>
        ))}
      </div>
    </main>
  )
}
