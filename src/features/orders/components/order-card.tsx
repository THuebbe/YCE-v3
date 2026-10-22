'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { formatDay } from '@/features/booking/booking-rules';
import type { Plan } from '@/features/billing/entitlements';
import { OrderStatus, getAvailableActions, getActionLabel } from '../stateMachine';
import { countOrderSigns, formatAddress, formatCurrency } from '../client-utils';
import { useOrderAction } from './use-order-action';
import { StatusBadge } from './status-badge';

/**
 * One order in the list: tap it to open the order; the button under it is
 * the next step. Edit and cancel live on the order page (rare, and easy to
 * mis-tap in a list).
 */
export function OrderCard({ order, plan, slug }: { order: any; plan: Plan; slug: string }) {
  const next = getAvailableActions(order.status as OrderStatus, plan).filter(a => a !== 'cancel');
  const signs = countOrderSigns(order);
  // Cancel isn't offered from the list, so the hook never needs its modal
  const { run, isProcessing } = useOrderAction(order, () => {});

  return (
    <li className="rounded-card border border-line bg-surface">
      <Link
        href={`/${slug}/orders/${order.id}`}
        className="flex items-start gap-3 rounded-card p-4 transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="truncate text-fine text-fg-muted">#{order.order_number}</span>
          </span>
          <span className="mt-2 block truncate text-lead font-bold">{order.customer_name || 'Customer'}</span>
          <span className="block text-fine text-fg-muted">
            {order.event_date ? formatDay(String(order.event_date).slice(0, 10)) : 'No date'} · {signs} {signs === 1 ? 'sign' : 'signs'} · {formatCurrency(order.total)}
          </span>
          <span className="block truncate text-fine text-fg-muted">{formatAddress(order.event_address)}</span>
        </span>
        <ChevronRight className="mt-1 size-5 shrink-0 text-fg-muted" aria-hidden />
      </Link>
      {next.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-line p-3">
          {next.map((action, i) => (
            <Button
              key={action}
              size="sm"
              variant={i === 0 ? 'primary' : 'secondary'}
              onClick={() => run(action)}
              disabled={isProcessing}
              className="flex-1"
            >
              {getActionLabel(action)}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}
