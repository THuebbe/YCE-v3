'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/shared/components/brand/Logo'
import { cn } from '@/lib/utils'

/**
 * The marketing header. On a page with an orange hero it starts as part of
 * the hero (orange, blue button); once the hero scrolls out from under it,
 * the orange lifts like a curtain and the usual white header with the
 * orange button is underneath. Pages without a hero get the white one.
 */
export function MarketingHeader({ startLabel, hero }: { startLabel: string; hero: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [onHero, setOnHero] = useState(hero)

  useEffect(() => {
    const header = ref.current
    const section = document.querySelector('[data-hero]')
    if (!hero || !header || !section) {
      setOnHero(false)
      return
    }
    // The hero counts as "under the header" until its bottom edge passes the header's
    const observer = new IntersectionObserver(([entry]) => setOnHero(entry.isIntersecting), {
      rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
    })
    observer.observe(section)
    return () => observer.disconnect()
  }, [hero])

  return (
    <header
      ref={ref}
      data-surface={onHero ? 'hero' : undefined}
      className={cn(
        'sticky top-0 z-30 overflow-hidden bg-surface transition-shadow duration-500 motion-reduce:transition-none',
        !onHero && 'shadow-raised',
      )}
    >
      {/* the curtain */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 bg-hero-bg transition-transform duration-500 ease-out motion-reduce:transition-none',
          onHero ? 'translate-y-0' : '-translate-y-full',
        )}
      />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="YardCard Elite home" className="grid shrink-0 rounded-control">
          {/* both tones stacked in one cell, crossfading with the curtain */}
          <Logo tone="onLight" className={cn('h-8 w-auto [grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none sm:h-9', onHero && 'opacity-0')} title="" />
          <Logo tone="onHero" className={cn('h-8 w-auto [grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none sm:h-9', !onHero && 'opacity-0')} title="" />
        </Link>
        <nav className="flex items-center gap-1 text-fine font-bold text-fg sm:gap-2" aria-label="Main">
          <Link href="/pricing" className="hidden rounded-control px-3 py-2 hover:bg-fg/10 focus-visible:shadow-(--focus-ring) focus-visible:outline-none sm:block">Pricing</Link>
          <Link href="/auth/sign-in" className="rounded-control px-3 py-2 hover:bg-fg/10 focus-visible:shadow-(--focus-ring) focus-visible:outline-none">Sign in</Link>
          <Link
            href="/auth/sign-up"
            className={cn(
              'hidden h-10 items-center rounded-control border-2 px-4 transition-colors duration-500 focus-visible:shadow-(--focus-ring) focus-visible:outline-none motion-reduce:transition-none sm:flex',
              onHero
                ? 'border-on-hero bg-hero-action text-on-hero-action hover:bg-hero-action-hover'
                : 'border-transparent bg-action text-on-action hover:bg-action-hover',
            )}
          >
            {startLabel}
          </Link>
        </nav>
      </div>
    </header>
  )
}
