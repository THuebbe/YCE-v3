'use client'

import { useEffect, useId, useMemo, useRef } from 'react'
import { PALETTE } from '@/lib/brand'
import { indexManifest, layoutRow, type SignAsset, type SignAssetManifest } from '@/features/booking/services/sign-assets'
import styles from './YardScene.module.css'

/**
 * A yard display on an illustrated lawn. Used by the homepage hero and,
 * later, the booking preview. Pure: give it the rows to show and the sign
 * assets; it places the signs (layoutRow, real inches from the manifest)
 * and drops in only the letters that changed since the last render.
 *
 * The scene is one SVG measured in inches, so it scales to any width.
 * Layers, back to front: yard illustration, then per row: contact shadows,
 * signs on their stakes, a grass strip over the stake feet.
 */

export interface SceneRow {
  text: string
  colorway: string
}

interface YardSceneProps {
  /** Back row first (the message), front row last (the name) */
  rows: SceneRow[]
  assets: SignAsset[]
  style?: string
  className?: string
}

const VIEW_W = 380
const VIEW_H = 200
/** Where the lawn meets the hedge */
const HORIZON = 96
/** Usable width for the display; it shrinks to fit a long name, never grows */
const MAX_DISPLAY_W = 356
/** Each row: ground line (inches from the top) and depth scale */
const ROW_GEOMETRY = [
  { baseline: 134, scale: 0.84 },
  { baseline: 182, scale: 1 },
]
/** Where the fit-to-width scale anchors: centered, at the front ground line */
const FIT_ORIGIN = { x: VIEW_W / 2, y: 186 }
const STAKE_W = 1.4
/** Signs stand this far above the grass on their stakes */
const LIFT = 7

// One wave of grass every 6 inches, as a strip over the stake feet. Three
// scenes wide, so it still reaches both edges when a long name shrinks the display.
function grassStrip(top: number): string {
  let d = `M${-VIEW_W} ${top + 4}`
  for (let x = -VIEW_W; x < VIEW_W * 2; x += 6) d += ` q3 -6 6 0`
  return `${d} V${VIEW_H * 2} H${-VIEW_W}Z`
}

export function YardScene({ rows, assets, style = 'classic', className }: YardSceneProps) {
  const id = useId()
  const index = useMemo(() => indexManifest({ assets } as SignAssetManifest), [assets])

  const laidOut = useMemo(
    () =>
      rows.map((row, r) => {
        const geo = ROW_GEOMETRY[Math.min(r, ROW_GEOMETRY.length - 1)]
        // scale 12 px/ft = 1 unit per inch
        const { placed, totalWidthFt } = layoutRow(index, row.text.split(''), style, [row.colorway], 12)
        const width = Math.max(0, totalWidthFt * 12 + 1.5) // drop the trailing kerning
        return { ...geo, placed, width, key: r }
      }),
    [rows, index, style],
  )

  const widest = Math.max(1, ...laidOut.map(r => r.width * r.scale))
  const fit = Math.min(1, MAX_DISPLAY_W / widest)

  // Signs keep their key while their letter stays the same, so only new
  // letters mount and play the drop. Stagger counts only the new ones.
  const seen = useRef<Set<string>>(new Set())
  const keysThisRender: string[] = []
  useEffect(() => {
    seen.current = new Set(keysThisRender)
  })

  const label = rows.map(r => r.text).join(' ')

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={`Yard display reading ${label}`}
    >
      <IllustratedYard id={id} />

      <g transform={`translate(${FIT_ORIGIN.x} ${FIT_ORIGIN.y}) scale(${fit}) translate(${-FIT_ORIGIN.x} ${-FIT_ORIGIN.y})`}>
        {laidOut.map(row => {
          let fresh = 0
          return (
            <g key={row.key}>
              <g transform={`translate(${VIEW_W / 2 - (row.width * row.scale) / 2} ${row.baseline}) scale(${row.scale})`}>
                {row.placed.map((p, i) => {
                  const key = `${row.key}:${i}:${p.asset.character}`
                  keysThisRender.push(key)
                  const delay = seen.current.has(key) ? 0 : fresh++
                  return (
                    <g key={key} className={styles.slot} style={{ transform: `translate(${p.leftPx}px, 0px)` }}>
                      <ellipse cx={p.widthPx / 2} cy={3} rx={p.widthPx * 0.42} ry={2.4} fill={PALETTE.ink[900]} opacity={0.18} />
                      <g className={styles.drop} style={{ animationDelay: `calc(${delay} * var(--drop-stagger))` }}>
                        <rect x={p.widthPx * 0.32 - STAKE_W / 2} y={-p.heightPx * 0.45 - LIFT} width={STAKE_W} height={p.heightPx * 0.45 + LIFT + 12} fill={PALETTE.stake} />
                        <rect x={p.widthPx * 0.68 - STAKE_W / 2} y={-p.heightPx * 0.45 - LIFT} width={STAKE_W} height={p.heightPx * 0.45 + LIFT + 12} fill={PALETTE.stake} />
                        <image href={`/sign-assets/${p.asset.file}`} x={0} y={-p.baselineOffsetPx - LIFT} width={p.widthPx} height={p.heightPx} />
                      </g>
                    </g>
                  )
                })}
              </g>
              {/* same green as the lawn: it only shows where it covers the stake feet */}
              <path d={grassStrip(row.baseline)} fill={PALETTE.pine[400]} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/**
 * The yard behind the display: golden-hour sky, low sun, hedge, tree, lawn.
 * Illustrated for now; a real empty-yard photo replaces this one component.
 */
function IllustratedYard({ id }: { id: string }) {
  const sky = `${id}-sky`
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PALETTE.bluebird[100]} />
          <stop offset="1" stopColor={PALETTE.tangerine[100]} />
        </linearGradient>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill={`url(#${sky})`} />
      <circle cx={288} cy={HORIZON - 12} r={22} fill={PALETTE.tangerine[200]} />
      {/* hedge along the back of the lawn */}
      <path
        d={`M0 ${HORIZON - 8} ${Array.from({ length: 14 }, (_, i) => `q14 -${10 + (i % 3) * 3} 28 0`).join(' ')} V${HORIZON + 4} H0Z`}
        fill={PALETTE.pine[600]}
      />
      {/* a tree at the right edge */}
      <rect x={348} y={HORIZON - 52} width={6} height={56} fill={PALETTE.pine[800]} />
      <circle cx={351} cy={HORIZON - 56} r={21} fill={PALETTE.pine[700]} />
      <circle cx={336} cy={HORIZON - 42} r={14} fill={PALETTE.pine[700]} />
      <circle cx={366} cy={HORIZON - 40} r={15} fill={PALETTE.pine[700]} />
      <rect y={HORIZON} width={VIEW_W} height={VIEW_H - HORIZON} fill={PALETTE.pine[400]} />
    </g>
  )
}
