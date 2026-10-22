import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Design lab: preview deployments and local dev only, never yardcard-elite.com */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  return <div className="min-h-screen bg-canvas font-body text-fg">{children}</div>
}
