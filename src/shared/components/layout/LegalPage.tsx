import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/shared/components/brand/Logo'

export interface LegalSection {
  title: string
  body: ReactNode
}

interface LegalPageProps {
  title: string
  effectiveDate: string
  intro: ReactNode
  sections: LegalSection[]
}

/** Shared layout for /terms and /privacy: public, readable on a phone, printable */
export function LegalPage({ title, effectiveDate, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-canvas font-body text-fg">
      <header className="border-b border-line bg-surface print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="YardCard Elite home" className="shrink-0">
            <Logo className="h-8 w-auto" title="" />
          </Link>
          <nav className="flex gap-1 text-fine font-bold" aria-label="Legal">
            <Link href="/terms" className="rounded-control px-3 py-2 hover:bg-surface-sunken">Terms</Link>
            <Link href="/privacy" className="rounded-control px-3 py-2 hover:bg-surface-sunken">Privacy</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-title font-semibold">{title}</h1>
        <p className="mt-2 text-fine text-fg-muted">Effective {effectiveDate}</p>
        <div className="mt-6 max-w-prose space-y-4 leading-relaxed">{intro}</div>
        <ol className="mt-10 max-w-prose space-y-8">
          {sections.map((section, i) => (
            <li key={section.title} id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="scroll-mt-6">
              <h2 className="font-display text-heading font-semibold">
                {i + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed [&_a]:font-semibold [&_a]:text-action-text [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
                {section.body}
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}
