'use client'

import { useMemo } from 'react'
import { indexManifest, type SignAsset, type SignAssetManifest } from '@/features/booking/services/sign-assets'
import { YardScene, textToItems } from '@/features/yard-scene/YardScene'

export interface ExampleDisplay {
  occasion: string
  rows: { text: string; colorway: string }[]
}

/** A row of finished displays for different occasions, drawn by the same scene as the booking page */
export function ExampleDisplays({ assets, examples }: { assets: SignAsset[]; examples: ExampleDisplay[] }) {
  const index = useMemo(() => indexManifest({ assets } as SignAssetManifest), [assets])

  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
      {examples.map(example => {
        const label = example.rows.map(r => r.text).join(' ')
        return (
          <li key={example.occasion} className="grid w-[80%] shrink-0 snap-center gap-2 sm:w-[60%] md:w-auto">
            <YardScene
              rows={example.rows.map(r => textToItems(index, r.text, 'classic', r.colorway))}
              description={label}
              className="block w-full overflow-hidden rounded-card shadow-raised"
            />
            <p className="font-display text-heading font-semibold">{example.occasion}</p>
          </li>
        )
      })}
    </ul>
  )
}
