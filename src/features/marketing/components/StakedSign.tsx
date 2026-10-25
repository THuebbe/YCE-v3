import { PALETTE } from '@/lib/brand'
import type { SignAsset } from '@/features/booking/services/sign-assets'

const STAKE_W = 1.6
/** Stake showing below the sign, then a strip of grass over its feet, in inches */
const STAKE_BELOW = 9
const GRASS_H = 5

/**
 * One real sign from the library standing on its stakes, outside a yard
 * scene: the step numbers on the marketing page. Measured in inches like
 * YardScene, so it keeps the sign's real proportions.
 */
export function StakedSign({ asset, className }: { asset: SignAsset; className?: string }) {
  const w = asset.widthIn
  const ground = asset.heightIn * (asset.baselineYPct ?? 1)
  const height = ground + STAKE_BELOW
  const grassTop = height - GRASS_H
  const waves = Math.ceil(w / 6)
  const grass = `M0 ${grassTop + 2}` + ` q3 -3 6 0`.repeat(waves) + `V${height}H0Z`

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={className} aria-hidden>
      <rect x={w * 0.32 - STAKE_W / 2} y={ground * 0.55} width={STAKE_W} height={height - ground * 0.55} fill={PALETTE.stake} />
      <rect x={w * 0.68 - STAKE_W / 2} y={ground * 0.55} width={STAKE_W} height={height - ground * 0.55} fill={PALETTE.stake} />
      <image href={`/sign-assets/${asset.file}`} x={0} y={0} width={w} height={asset.heightIn} />
      <path d={grass} fill={PALETTE.pine[400]} />
    </svg>
  )
}
