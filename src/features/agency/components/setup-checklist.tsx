import Link from 'next/link';
import { Check, Circle } from 'lucide-react';
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
    <section className="mb-8 rounded-xl border border-primary/20 bg-white p-5 shadow-default">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-neutral-900">Get ready to take bookings</h2>
        <p className="text-sm text-neutral-600">{done} of {ITEMS.length} done · your booking page opens when all are</p>
      </div>
      <ol className="space-y-3">
        {ITEMS.map(item => {
          const todo = missing.includes(item.key);
          return (
            <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 p-3">
              <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
                {todo
                  ? <Circle className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
                  : <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />}
                <div>
                  <p className={`font-medium ${todo ? 'text-neutral-900' : 'text-neutral-500 line-through'}`}>{item.title}</p>
                  {todo && <p className="text-sm text-neutral-600">{item.detail}</p>}
                </div>
              </div>
              {todo && (
                <Link href={item.href(slug)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
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
