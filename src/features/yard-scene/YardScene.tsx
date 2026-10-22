'use client'

import { useEffect, useId, useMemo, useRef } from 'react'
import { PALETTE } from '@/lib/brand'
import { resolveAsset, type SignAsset } from '@/features/booking/services/sign-assets'
import styles from './YardScene.module.css'

/**
 * A yard display on an illustrated lawn: the homepage hero and the booking
 * preview. Pure: give it rows of signs (back row first) and it lays them out
 * in real inches, dropping in only the signs that changed since the last
 * render.
 *
 * The scene is one SVG measured in inches, so it scales to any width.
 * Layers, back to front: yard illustration, then per row: contact shadows,
 * signs on their stakes, a grass strip over the stake feet.
 */

export interface SceneItem {
  /** Identity for the drop diff: the same id in the same spot doesn't drop again */
  id: string
  /** Image under /sign-assets; without one the sign is drawn as a labelled board */
  file?: string
  /** What the board says (and what screen readers hear) when there's no art yet */
  label?: string
  widthIn: number
  heightIn: number
  /** Ground line as a share of the image height (manifest baselineYPct) */
  baselineYPct?: number
  /** Extra space before this sign, in inches: word gaps, decoration groups */
  gapBeforeIn?: number
}

/** Real displays overlap slightly: letters tuck behind each other */
const KERNING_IN = -1.5
const WORD_GAP_IN = 8

/**
 * A line of text as yard signs in one colorway. Characters without a sign
 * (punctuation, a colorway the manifest lacks) are skipped.
 */
export function textToItems(index: Map<string, SignAsset>, text: string, style: string, colorway: string): SceneItem[] {
  const items: SceneItem[] = []
  let gap = 0
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') { gap += WORD_GAP_IN; continue }
    const asset = resolveAsset(index, ch, style, colorway)
    if (!asset) continue
    items.push({ id: `${ch}-${colorway}`, file: asset.file, label: ch, widthIn: asset.widthIn, heightIn: asset.heightIn, baselineYPct: asset.baselineYPct, gapBeforeIn: gap || undefined })
    gap = 0
  }
  return items
}

interface YardSceneProps {
  /** Back row first (the message), front row last (the name) */
  rows: SceneItem[][]
  /** What the display says, for screen readers ("HAPPY BIRTHDAY EMMA") */
  description: string
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

function placeRow(items: SceneItem[]) {
  let x = 0
  const placed = items.map((item, i) => {
    if (i > 0) x += KERNING_IN
    x += item.gapBeforeIn ?? 0
    const left = x
    x += item.widthIn
    return { item, left, baselineOffset: item.heightIn * (item.baselineYPct ?? 1) }
  })
  return { placed, width: Math.max(0, x) }
}

export function YardScene({ rows, description, className }: YardSceneProps) {
  const id = useId()

  const laidOut = useMemo(
    () =>
      rows.map((items, r) => ({
        ...ROW_GEOMETRY[Math.min(r, ROW_GEOMETRY.length - 1)],
        ...placeRow(items),
        key: r,
      })),
    [rows],
  )

  const widest = Math.max(1, ...laidOut.map(r => r.width * r.scale))
  const fit = Math.min(1, MAX_DISPLAY_W / widest)

  // Signs keep their key while they stay the same, so only new ones mount
  // and play the drop. Stagger counts only the new ones.
  const seen = useRef<Set<string>>(new Set())
  const keysThisRender: string[] = []
  useEffect(() => {
    seen.current = new Set(keysThisRender)
  })

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={`Yard display reading ${description}`}
    >
      <IllustratedYard id={id} />

      <g transform={`translate(${FIT_ORIGIN.x} ${FIT_ORIGIN.y}) scale(${fit}) translate(${-FIT_ORIGIN.x} ${-FIT_ORIGIN.y})`}>
        {laidOut.map(row => {
          let fresh = 0
          return (
            <g key={row.key}>
              <g transform={`translate(${VIEW_W / 2 - (row.width * row.scale) / 2} ${row.baseline}) scale(${row.scale})`}>
                {row.placed.map(({ item, left, baselineOffset }, i) => {
                  const key = `${row.key}:${i}:${item.id}`
                  keysThisRender.push(key)
                  const delay = seen.current.has(key) ? 0 : fresh++
                  const w = item.widthIn
                  const h = item.heightIn
                  return (
                    <g key={key} className={styles.slot} style={{ transform: `translate(${left}px, 0px)` }}>
                      <ellipse cx={w / 2} cy={3} rx={w * 0.42} ry={2.4} fill={PALETTE.ink[900]} opacity={0.18} />
                      <g className={styles.drop} style={{ animationDelay: `calc(${delay} * var(--drop-stagger))` }}>
                        <rect x={w * 0.32 - STAKE_W / 2} y={-h * 0.45 - LIFT} width={STAKE_W} height={h * 0.45 + LIFT + 12} fill={PALETTE.stake} />
                        <rect x={w * 0.68 - STAKE_W / 2} y={-h * 0.45 - LIFT} width={STAKE_W} height={h * 0.45 + LIFT + 12} fill={PALETTE.stake} />
                        {item.file ? (
                          <image href={`/sign-assets/${item.file}`} x={0} y={-baselineOffset - LIFT} width={w} height={h} />
                        ) : (
                          <PlaceholderBoard width={w} height={h} label={item.label ?? ''} />
                        )}
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

/** A sign we have no artwork for yet (themes, bookends, ordinals): a white board with its name */
function PlaceholderBoard({ width, height, label }: { width: number; height: number; label: string }) {
  const size = Math.min(height * 0.32, (width * 1.6) / Math.max(3, label.length))
  return (
    <g transform={`translate(0 ${-height - LIFT})`}>
      <rect width={width} height={height} rx={3} fill={PALETTE.ink[0]} stroke={PALETTE.ink[800]} strokeWidth={1.2} />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size}
        fontWeight={600}
        fill={PALETTE.ink[800]}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {label}
      </text>
    </g>
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
