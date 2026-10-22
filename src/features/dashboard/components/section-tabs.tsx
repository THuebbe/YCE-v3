import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChipNav } from '@/shared/components/ui/chip-nav';

/** A page's sections as pill links (in the URL, so Back and deep links work) */
export function SectionTabs({ label, items, active }: {
  label: string;
  items: { id: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <ChipNav label={label} className="mb-5">
      <ul className="flex gap-2">
        {items.map(item => {
          const on = item.id === active;
          return (
            <li key={item.id} className="shrink-0">
              <Link
                href={item.href}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'inline-flex h-11 items-center rounded-full border px-4 text-fine font-bold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
                  on ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface text-fg hover:bg-surface-sunken',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </ChipNav>
  );
}
