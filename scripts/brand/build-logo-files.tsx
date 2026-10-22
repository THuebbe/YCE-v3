/**
 * Writes the static logo files from the Logo component, so the favicon,
 * email PNG and /public SVGs can never drift from what the app renders.
 * Run after changing Logo.tsx, logo-geometry.ts or the brand colors:
 *
 *   pnpm brand:logo
 *
 * PNGs are rendered with Playwright's Chromium. Where Chromium is installed
 * somewhere else (the Claude cloud sandbox), point CHROMIUM_PATH at it:
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm brand:logo
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'
import { Logo } from '../../src/shared/components/brand/Logo'

const root = join(__dirname, '..', '..')

function svg(element: React.ReactElement): string {
  return renderToStaticMarkup(element).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
}

function write(path: string, data: string | Buffer) {
  const full = join(root, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, data)
  console.log('wrote', path)
}

async function render(markup: string, width: number, height: number): Promise<Buffer> {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const page = await browser.newPage({ viewport: { width, height } })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${markup}`,
  )
  const shot = await page.screenshot({ omitBackground: true })
  await browser.close()
  return shot
}

async function png(markup: string, width: number, height: number, path: string) {
  write(path, await render(markup, width, height))
}

/** .ico holding PNG images (supported by every current browser) */
async function ico(markup: string, sizes: number[], path: string) {
  const images = await Promise.all(sizes.map(s => render(markup, s, s)))
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((img, i) => {
    const e = 6 + 16 * i
    header.writeUInt8(sizes[i] % 256, e)
    header.writeUInt8(sizes[i] % 256, e + 1)
    header.writeUInt16LE(1, e + 4)
    header.writeUInt16LE(32, e + 6)
    header.writeUInt32LE(img.length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += img.length
  })
  write(path, Buffer.concat([header, ...images]))
}

async function main() {
  const icon = svg(<Logo variant="icon" />)
  const full = svg(<Logo />)
  const fullOnDark = svg(<Logo tone="onDark" />)

  write('public/brand/icon.svg', icon)
  write('public/brand/logo.svg', full)
  write('public/brand/logo-on-green.svg', fullOnDark)
  // Next.js file conventions: favicon and iPhone home screen icon
  write('src/app/icon.svg', icon)
  await ico(icon, [16, 32, 48], 'src/app/favicon.ico')
  await png(icon, 180, 180, 'src/app/apple-icon.png')
  await png(icon, 512, 512, 'public/brand/icon-512.png')

  // Email lockup: 600px wide (shown at 300px), height from the SVG's aspect ratio
  const [, , w, h] = full.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number)
  await png(full, 600, Math.round((600 * h) / w), 'public/brand/logo-email.png')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
