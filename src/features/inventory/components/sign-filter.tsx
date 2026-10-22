'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sign } from '../types';

/** Search text and one category, applied to any list of signs */
export function useSignFilter<T>(items: T[], signOf: (item: T) => Sign | undefined) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(items.map(i => signOf(i)?.category).filter(Boolean) as string[])].sort(),
    [items, signOf],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      const sign = signOf(item);
      if (!sign) return false;
      if (category && sign.category !== category) return false;
      if (!q) return true;
      return [sign.name, sign.category, ...(sign.themes ?? []), ...(sign.keywords ?? [])].some(t => t?.toLowerCase().includes(q));
    });
  }, [items, signOf, query, category]);

  return { query, setQuery, category, setCategory, categories, shown };
}

export function SignFilterBar({
  query, setQuery, category, setCategory, categories, label,
}: {
  query: string; setQuery: (q: string) => void; category: string | null; setCategory: (c: string | null) => void; categories: string[]; label: string;
}) {
  const chip = (active: boolean) => cn(
    'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-fine font-bold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
    active ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface text-fg hover:bg-surface-sunken',
  );
  return (
    <div className="mb-4 grid gap-3">
      <label className="relative block">
        <span className="sr-only">{label}</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-fg-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={label}
          className="h-12 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-copy text-fg placeholder:text-fg-muted focus-visible:border-focus focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
        />
      </label>
      {categories.length > 1 && (
        <div role="group" aria-label="Category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip(category === null)}>All</button>
          {categories.map(c => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)} className={chip(category === c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A sign's picture on a neutral tile, or an empty tile when there's no art */
export function SignThumb({ sign, className }: { sign?: Sign; className?: string }) {
  const src = sign?.thumbnail_url || sign?.image_url;
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-sunken', className)}>
      {src ? <img src={src} alt="" loading="lazy" className="size-full object-contain p-1" /> : null}
    </span>
  );
}
