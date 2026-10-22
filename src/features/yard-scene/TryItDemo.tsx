'use client'

import { useEffect, useRef, useState } from 'react'
import type { SignAsset } from '@/features/booking/services/sign-assets'
import { YardScene, type SceneRow } from './YardScene'

/**
 * The homepage hero: our name on the lawn, and a field to try your own.
 * Typing shows a real display (HAPPY BIRTHDAY over the name). It goes back
 * to YARDCARD / ELITE when the field is cleared, when the scene scrolls off
 * screen, or after IDLE_MS without typing while the field isn't focused.
 */

const BRAND_ROWS: SceneRow[] = [
  { text: 'YARDCARD', colorway: 'gold' },
  { text: 'ELITE', colorway: 'red' },
]
const MESSAGE = 'HAPPY BIRTHDAY'
const MAX_NAME = 12
const IDLE_MS = 20_000

/** Letters, numbers and single spaces: what a yard display can spell */
function cleanName(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '').slice(0, MAX_NAME)
}

export function TryItDemo({ assets }: { assets: SignAsset[] }) {
  const [name, setName] = useState('')
  const [focused, setFocused] = useState(false)
  const [announced, setAnnounced] = useState('')
  const frame = useRef<HTMLDivElement>(null)

  const shown = name.trim()
  const rows: SceneRow[] = shown ? [{ text: MESSAGE, colorway: 'gold' }, { text: shown, colorway: 'red' }] : BRAND_ROWS

  // Reset when the yard leaves the screen, so coming back shows our name
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setName('')
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Reset after a quiet spell, but never while someone is in the field
  useEffect(() => {
    if (!shown || focused) return
    const t = setTimeout(() => setName(''), IDLE_MS)
    return () => clearTimeout(t)
  }, [shown, focused])

  // Screen readers hear the display once typing pauses, not every keystroke
  const label = rows.map(r => r.text).join(' ')
  useEffect(() => {
    const t = setTimeout(() => setAnnounced(label), 700)
    return () => clearTimeout(t)
  }, [label])

  return (
    <div ref={frame} className="grid gap-4">
      <YardScene rows={rows} assets={assets} className="block w-full overflow-hidden rounded-sheet" />
      <label className="grid gap-1">
        <span className="font-display text-heading font-semibold">Try it: type a name</span>
        <span className="relative max-w-sm">
          <input
            id="yard-scene-name"
            value={name}
            onChange={e => setName(cleanName(e.target.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={MAX_NAME}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="EMMA"
            className="h-12 w-full rounded-control border border-line-strong bg-surface pl-3 pr-12 font-display text-lead font-semibold tracking-wide text-fg placeholder:text-fg-muted/60 focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
          />
          {name && (
            <button
              type="button"
              onClick={() => setName('')}
              aria-label="Clear name"
              className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-control text-fg-muted hover:bg-surface-sunken hover:text-fg focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
            >
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          )}
        </span>
        <span className="text-fine text-fg-muted">Letters and numbers, up to {MAX_NAME}.</span>
      </label>
      <p aria-live="polite" className="sr-only">{announced && `The yard now reads ${announced}`}</p>
    </div>
  )
}
