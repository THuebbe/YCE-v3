import type { SignAsset, SignAssetManifest } from '@/features/booking/services/sign-assets'
import manifestJson from '../../../public/sign-assets/manifest.json'

const manifest = manifestJson as SignAssetManifest

/**
 * Letter and number signs for the yard scene. Call it on the server and pass
 * the result as a prop: the first render already shows the display (no
 * client fetch), and only the style and colorways a scene uses reach the
 * browser instead of the whole manifest.
 */
export function loadSceneAssets(style: string, colorways: string[]): SignAsset[] {
  return manifest.assets.filter(
    a => (a.type === 'letter' || a.type === 'number') && a.style === style && colorways.includes(a.colorway),
  )
}
