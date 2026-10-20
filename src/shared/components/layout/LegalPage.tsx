import Link from 'next/link'
import type { ReactNode } from 'react'

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-lg font-bold text-neutral-900">YardCard Elite</Link>
          <nav className="flex gap-4 text-sm text-neutral-600">
            <Link href="/terms" className="hover:text-neutral-900">Terms</Link>
            <Link href="/privacy" className="hover:text-neutral-900">Privacy</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">Effective {effectiveDate}</p>
        <div className="mt-6 space-y-4 text-neutral-700 leading-relaxed">{intro}</div>
        <ol className="mt-10 space-y-8">
          {sections.map((section, i) => (
            <li key={section.title} id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
              <h2 className="text-xl font-semibold text-neutral-900">
                {i + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-neutral-700 leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-primary [&_a]:underline">
                {section.body}
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}
