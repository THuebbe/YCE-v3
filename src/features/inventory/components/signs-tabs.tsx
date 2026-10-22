import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { InventoryTab } from '../types';

export const SIGN_TABS: { id: InventoryTab; label: string }[] = [
  { id: 'mine', label: 'My signs' },
  { id: 'library', label: 'Add from library' },
  { id: 'custom', label: 'Custom' },
];

export function parseSignsTab(raw: string | undefined): InventoryTab {
  return SIGN_TABS.some(t => t.id === raw) ? (raw as InventoryTab) : 'mine';
}

/** The Signs page's sections, in the URL like the orders filter */
export function SignsTabs({ tab, slug }: { tab: InventoryTab; slug: string }) {
  return (
    <nav aria-label="Signs sections" className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {SIGN_TABS.map(t => {
          const active = t.id === tab;
          return (
            <li key={t.id} className="shrink-0">
              <Link
                href={t.id === 'mine' ? `/${slug}/inventory` : `/${slug}/inventory?tab=${t.id}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 items-center rounded-full border px-4 text-fine font-bold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
                  active ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface text-fg hover:bg-surface-sunken',
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
