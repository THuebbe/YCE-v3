'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PopularDisplays } from '../../types';

/**
 * Elite: the occasions and themes customers book most (last 12 months).
 * One series, so one color and a number on every bar; no legend.
 */
export function PopularCard({ popular, slug }: { popular: PopularDisplays | null; slug: string }) {
  const [view, setView] = useState<'occasions' | 'themes'>('occasions');

  if (!popular) {
    return (
      <Link
        href={`/${slug}/billing`}
        className="flex items-center gap-3 rounded-card border border-dashed border-line-strong p-4 text-fine transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
      >
        <Lock className="size-5 shrink-0 text-fg-muted" aria-hidden />
        <span>
          <span className="block font-bold">Popular displays are on Elite</span>
          <span className="text-fg-muted">See which occasions and themes your customers book most.</span>
        </span>
      </Link>
    );
  }

  const items = popular[view];
  const max = items[0]?.count ?? 1;
  return (
    <section aria-labelledby="popular-title" className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="popular-title" className="font-display text-heading font-semibold">Most booked</h2>
        <div role="group" aria-label="Group by" className="flex rounded-control bg-surface-sunken p-1">
          {(['occasions', 'themes'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                'h-9 rounded-control px-3 text-fine font-bold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
                view === v ? 'bg-surface text-fg shadow-raised' : 'text-fg-muted hover:text-fg',
              )}
            >
              {v === 'occasions' ? 'Occasions' : 'Themes'}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-fine text-fg-muted">Your most-booked {view} from the last 12 months show here.</p>
      ) : (
        <ol className="grid gap-3">
          {items.map(item => (
            <li key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <span className="truncate font-semibold">{item.name}</span>
              <span className="text-fine font-semibold text-fg-muted">{item.count}</span>
              <span className="col-span-2 h-2 rounded-full bg-surface-sunken" aria-hidden>
                <span className="block h-2 rounded-full bg-lawn" style={{ width: `${(item.count / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
