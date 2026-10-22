import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChipNav } from '@/shared/components/ui/chip-nav';
import type { Plan } from '@/features/billing/entitlements';
import { VIEWS, ordersInView, viewCounts, viewOf, type OrdersView } from '../views';
import { OrderCard } from './order-card';

/**
 * Filter chips (in the URL, so Back and links from Home land on the right
 * view) over one list of order cards. Data comes in as props so /lab can
 * render it.
 */
export function OrdersViewList({ orders, view, slug, plan }: { orders: any[]; view: OrdersView; slug: string; plan: Plan }) {
  const counts = viewCounts(orders);
  const shown = ordersInView(orders, view);

  return (
    <>
      <ChipNav label="Filter orders" className="mb-4">
        <ul className="flex gap-2">
          {VIEWS.map(v => {
            const active = v.id === view;
            return (
              <li key={v.id} className="shrink-0">
                <Link
                  href={v.id === 'upcoming' ? `/${slug}/orders` : `/${slug}/orders?view=${v.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-fine font-bold transition-colors focus-visible:shadow-(--focus-ring) focus-visible:outline-none',
                    active ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface text-fg hover:bg-surface-sunken',
                  )}
                >
                  {v.label}
                  <span className={cn('rounded-full px-1.5 text-fine', active ? 'bg-on-brand/20' : 'bg-surface-sunken text-fg-muted')}>{counts[v.id]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </ChipNav>

      {shown.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong p-6 text-center text-fg-muted">{viewOf(view).empty}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shown.map(order => <OrderCard key={order.id} order={order} plan={plan} slug={slug} />)}
        </ul>
      )}
    </>
  );
}
