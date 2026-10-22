import Link from 'next/link';
import { Circle, CircleCheck } from 'lucide-react';
import type { ReadinessItem } from '../readiness';

const ITEMS: { key: ReadinessItem; title: string; detail: string; href: (slug: string) => string; action: string }[] = [
  { key: 'plan', title: 'Choose your plan', detail: 'Start your free trial.', href: s => `/${s}/billing`, action: 'Choose a plan' },
  { key: 'payments', title: 'Set up card payments', detail: 'Connect Stripe so customers pay you online. Money goes straight to you.', href: s => `/${s}/settings`, action: 'Set up payments' },
  { key: 'inventory', title: 'Add your signs', detail: 'Tell us which signs you have and how many.', href: s => `/${s}/inventory`, action: 'Add signs' },
  { key: 'pricing', title: 'Set your prices', detail: 'Your rental price and extra-day price.', href: s => `/${s}/settings`, action: 'Set prices' },
];

/**
 * Dashboard: what's left before customers can book (PRODUCT.md "Setup
 * checklist"). Shown until everything is done.
 */
export function SetupChecklist({ missing, slug }: { missing: ReadinessItem[]; slug: string }) {
  if (missing.length === 0) return null;
  const done = ITEMS.length - missing.length;
  return (
    <section aria-labelledby="setup-title" className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="setup-title" className="font-display text-heading font-semibold">Get ready to take bookings</h2>
        <p className="text-fine font-semibold text-fg-muted">{done} of {ITEMS.length} done</p>
      </div>
      <p className="mb-4 text-fine text-fg-muted">Your booking page opens to customers when all four are done.</p>
      <div className="mb-4 h-2 rounded-full bg-surface-sunken" aria-hidden>
        <div className="h-2 rounded-full bg-lawn transition-[width] duration-500" style={{ width: `${(done / ITEMS.length) * 100}%` }} />
      </div>
      <ol className="grid gap-2">
        {ITEMS.map(item => {
          const todo = missing.includes(item.key);
          return (
            <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3">
              <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
                {todo
                  ? <Circle className="mt-0.5 size-5 shrink-0 text-fg-muted" aria-hidden />
                  : <CircleCheck className="mt-0.5 size-5 shrink-0 text-positive" aria-hidden />}
                <div>
                  <p className={todo ? 'font-semibold' : 'text-fg-muted line-through'}>
                    {!todo && <span className="sr-only">Done: </span>}
                    {item.title}
                  </p>
                  {todo && <p className="text-fine text-fg-muted">{item.detail}</p>}
                </div>
              </div>
              {todo && (
                <Link
                  href={item.href(slug)}
                  className="inline-flex h-11 items-center rounded-control bg-action px-4 text-fine font-bold text-on-action transition-colors hover:bg-action-hover focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
                >
                  {item.action}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
