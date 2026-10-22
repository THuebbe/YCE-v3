'use client'

import { useState } from 'react'
import styles from '@/features/yard-scene/YardScene.module.css'

const LETTERS = ['P', 'A', 'R', 'T', 'Y']

/** The drop-in timing from the motion tokens, on stand-in letters */
export function DropDemo() {
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-wrap items-end gap-6">
      <div key={run} className="flex items-end gap-2 overflow-hidden rounded-sheet bg-lawn px-6 pt-10 pb-4" aria-label="PARTY spelled in yard signs">
        {LETTERS.map((ch, i) => (
          <span
            key={i}
            className={`${styles.drop} flex h-16 w-12 items-center justify-center rounded-control bg-action font-display text-title font-bold text-on-action shadow-raised`}
            style={{ animationDelay: `calc(${i} * var(--drop-stagger))` }}
          >
            {ch}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRun(r => r + 1)}
        className="h-11 rounded-control border border-line-strong bg-surface px-4 font-semibold text-fg focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
      >
        Replay
      </button>
    </div>
  )
}
