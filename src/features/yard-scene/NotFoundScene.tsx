'use client'

import { useMemo } from 'react'
import { indexManifest, type SignAsset, type SignAssetManifest } from '@/features/booking/services/sign-assets'
import { YardScene, textToItems } from './YardScene'

/** The 404 page's yard: the error spelled out in signs, dropping in like the hero */
export function NotFoundScene({ assets }: { assets: SignAsset[] }) {
  const index = useMemo(() => indexManifest({ assets } as SignAssetManifest), [assets])
  return (
    <YardScene
      rows={[textToItems(index, '404', 'classic', 'gold'), textToItems(index, 'NOT FOUND', 'classic', 'red')]}
      description="404 NOT FOUND"
      className="block w-full overflow-hidden rounded-sheet"
    />
  )
}
