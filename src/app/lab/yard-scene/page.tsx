import type { Metadata } from 'next'
import { loadSceneAssets } from '@/features/yard-scene/assets'
import { TryItDemo } from '@/features/yard-scene/TryItDemo'

export const metadata: Metadata = { title: 'Yard scene - lab' }

/** Prototype of the homepage hero. Preview deployments and local dev only (lab layout). */
export default function YardScenePage() {
  const assets = loadSceneAssets('classic', ['gold', 'red'])

  return (
    <main className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:px-6">
      <header className="grid gap-2">
        <h1 className="font-display text-title font-semibold">Yard scene</h1>
        <p className="max-w-prose text-copy text-fg-muted">
          Prototype of the homepage hero. Type a name and the signs drop in; clear it, scroll away, or leave it
          alone for 20 seconds and it goes back to YARDCARD / ELITE. Placeholder letters and an illustrated yard
          for now: both get swapped for real photos later.
        </p>
      </header>
      <TryItDemo assets={assets} />
    </main>
  )
}
