'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Download, ExternalLink, FileText, Lock, Mail, MapPin, Pencil, Phone, X, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/components/feedback/toast';
import { formatDay } from '@/features/booking/booking-rules';
import { hasFeature, type Plan } from '@/features/billing/entitlements';
import { OrderStatus, OrderAction, getAvailableActions, getActionLabel } from '../stateMachine';
import { countOrderSigns, formatAddress, formatCurrency, formatDate, formatTimeWindow, getOrderSignLines } from '../client-utils';
import { generatePickTicket, generateOrderSummary, generatePickupChecklist } from '../actions';
import { useOrderAction } from './use-order-action';
import { EditDisplayModal } from './edit-display-modal';
import { CancelOrderModal } from './cancel-order-modal';
import { FeesCard } from './fees-card';
import { StatusBadge } from './status-badge';
import type { FeeQuote } from '../fees';

type DocType = 'pickTicket' | 'orderSummary' | 'pickupChecklist';
const DOCUMENTS: { type: DocType; label: string }[] = [
  { type: 'pickTicket', label: 'Pick ticket' },
  { type: 'orderSummary', label: 'Order summary' },
  { type: 'pickupChecklist', label: 'Pickup checklist' },
];
const ELITE_DOCUMENTS: DocType[] = ['pickTicket', 'pickupChecklist'];
const GENERATORS: Record<DocType, (id: string) => Promise<{ success: boolean; result?: any; error?: string }>> = {
  pickTicket: generatePickTicket,
  orderSummary: generateOrderSummary,
  pickupChecklist: generatePickupChecklist,
};
const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paid', succeeded: 'Paid', partially_refunded: 'Partly refunded', refunded: 'Refunded', pending: 'Not paid yet',
};

interface OrderDetailsProps {
  order: any;
  plan: Plan;
  slug: string;
  /** Completed orders: the late/damage fees that may be charged */
  feeQuote?: FeeQuote | null;
  /** The agency's time zone: cancellation notice is measured on its clock */
  timeZone?: string;
}

/**
 * One order. The next step is a big button: in the sidebar on wide screens,
 * pinned above the tab bar on phones. Changing or cancelling the order sits
 * at the bottom, out of the way.
 */
export function OrderDetails({ order, plan, slug, feeQuote, timeZone }: OrderDetailsProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<DocType | null>(null);
  const [made, setMade] = useState<{ type: string; url: string }[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { run, isProcessing } = useOrderAction(order, () => setShowCancel(true));

  const next = getAvailableActions(order.status as OrderStatus, plan).filter(a => a !== 'cancel');
  const changeable = ['pending', 'processing'].includes(order.status);
  const signLines = getOrderSignLines(order);
  const signs = countOrderSigns(order);
  const address = formatAddress(order.event_address);
  const timeWindow = formatTimeWindow(order);
  const notes = order.special_instructions || order.delivery_notes;

  // Saved documents (orders.documents) plus any made on this visit; newest of each type wins
  const documentOf = (type: string) =>
    [...(Array.isArray(order.documents) ? order.documents : []), ...made].filter((d: any) => d.type === type).at(-1);

  const generate = async (type: DocType) => {
    if (generating) return;
    setGenerating(type);
    try {
      const result: { success: boolean; result?: any; error?: string } = await GENERATORS[type](order.id)
        .catch((e: unknown) => ({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }));
      if (result.success && result.result) {
        setMade(prev => [...prev, { type: result.result.type, url: result.result.url }]);
        toast({ title: 'Document ready', description: result.result.filename, variant: 'success' });
      } else {
        const config = String(result.error ?? '').includes('BLOB_READ_WRITE_TOKEN');
        toast({ title: 'Couldn’t make the document', description: config ? 'Document storage isn’t set up. Please contact support.' : result.error, variant: 'error' });
      }
    } finally {
      setGenerating(null);
    }
  };

  const actionButton = (action: OrderAction, i: number) => (
    <Button key={action} size={i === 0 ? 'lg' : 'default'} variant={i === 0 ? 'primary' : 'secondary'} onClick={() => run(action)} loading={isProcessing && i === 0} disabled={isProcessing} className="w-full">
      {getActionLabel(action)}
    </Button>
  );

  return (
    <div>
      <Link href={`/${slug}/orders`} className="mb-4 inline-flex h-11 items-center gap-2 text-fine font-bold text-action-text hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Orders
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-fine text-fg-muted">#{order.order_number} · booked {formatDate(new Date(order.created_at))}</span>
        </div>
        <h1 className="mt-2 font-display text-title font-semibold break-words">{order.customer_name || 'Customer'}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <Section title="Event">
            <dl className="grid gap-3">
              <Row label="Date">{order.event_date ? formatDay(String(order.event_date).slice(0, 10), true) : 'Not set'}{timeWindow && ` · ${timeWindow}`}</Row>
              <Row label="Address">
                <span className="block">{address}</span>
                {address !== 'Not provided' && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-fine font-bold text-action-text hover:underline">
                    <MapPin className="size-4" aria-hidden /> Open in Maps
                  </a>
                )}
              </Row>
              {order.event_type && <Row label="Occasion">{order.event_type}</Row>}
              {notes && <Row label="Notes">{notes}</Row>}
            </dl>
          </Section>

          <Section title="Customer">
            <div className="grid gap-2">
              {order.customer_phone && (
                <ContactLink href={`tel:${String(order.customer_phone).replace(/[^\d+]/g, '')}`} icon={Phone}>{order.customer_phone}</ContactLink>
              )}
              {order.customer_email && <ContactLink href={`mailto:${order.customer_email}`} icon={Mail}>{order.customer_email}</ContactLink>}
            </div>
          </Section>

          <Section title="Display" aside={`${signs} ${signs === 1 ? 'sign' : 'signs'}`}>
            {order.display_image_url && (
              <img src={order.display_image_url} alt="The customer's display as booked" className="mb-4 w-full rounded-control border border-line bg-surface-sunken" />
            )}
            {signLines.length === 0 ? (
              <p className="text-fine text-fg-muted">No signs recorded for this order.</p>
            ) : (
              <ul className="grid gap-2">
                {signLines.map(line => (
                  <li key={line.signId} className="flex items-center gap-3 rounded-control bg-surface-sunken p-2">
                    {line.sign?.image_url
                      ? <img src={line.sign.image_url} alt="" className="size-10 rounded-control bg-surface object-contain" />
                      : <span className="size-10 rounded-control bg-surface" aria-hidden />}
                    <span className="min-w-0 flex-1 truncate">{line.sign?.name ?? line.signId}</span>
                    <span className="font-bold">×{line.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Activity">
            {!order.activities?.length ? (
              <p className="text-fine text-fg-muted">Nothing yet.</p>
            ) : (
              <ol className="grid gap-3">
                {[...order.activities]
                  .sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)))
                  .map((activity: any) => {
                    const Icon = activity.status === 'cancelled' ? XCircle : activity.status === 'completed' ? CheckCircle2 : Circle;
                    const who = activity.user ? [activity.user.first_name, activity.user.last_name].filter(Boolean).join(' ') : '';
                    return (
                      <li key={activity.id} className="flex gap-3">
                        <Icon className={`mt-0.5 size-5 shrink-0 ${activity.status === 'cancelled' ? 'text-danger' : activity.status === 'completed' ? 'text-positive' : 'text-fg-muted'}`} aria-hidden />
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {activity.action === 'editSigns' ? 'Display edited' : getActionLabel(activity.action as OrderAction) ?? activity.action}
                            {who && <span className="font-normal text-fg-muted"> · {who}</span>}
                          </p>
                          <p className="text-fine text-fg-muted">{formatDate(new Date(activity.created_at))}</p>
                          {activity.notes && <p className="mt-1 text-fine">{activity.notes}</p>}
                        </div>
                      </li>
                    );
                  })}
              </ol>
            )}
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6">
          {next.length > 0 && (
            // On phones the main action is pinned at the bottom, so this card only matters when there's more than one
            <Section title="Next step" className={next.length > 1 ? '' : 'hidden md:block'}>
              <div className="grid gap-2">{next.map(actionButton)}</div>
            </Section>
          )}

          <Section title="Money">
            <dl className="grid gap-2 text-fine">
              {/* orders.subtotal equals the total (extra days included), so the display line is what's left after extra days */}
              <div className="flex justify-between"><dt className="text-fg-muted">Display</dt><dd>{formatCurrency(Number(order.total) - (Number(order.extra_day_fee) || 0))}</dd></div>
              {Number(order.extra_day_fee) > 0 && (
                <div className="flex justify-between"><dt className="text-fg-muted">Extra days{Number(order.extra_days) > 0 ? ` (${order.extra_days})` : ''}</dt><dd>{formatCurrency(order.extra_day_fee)}</dd></div>
              )}
              <div className="flex justify-between border-t border-line pt-2 text-copy font-bold"><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
              {order.payment_status && (
                <div className="flex justify-between"><dt className="text-fg-muted">Payment</dt><dd>{PAYMENT_LABELS[order.payment_status] ?? order.payment_status}</dd></div>
              )}
              {Number(order.refund_amount) > 0 && (
                <div className="flex justify-between"><dt className="text-fg-muted">Refunded</dt><dd>{formatCurrency(order.refund_amount)}</dd></div>
              )}
            </dl>
          </Section>

          {feeQuote && <FeesCard orderId={order.id} quote={feeQuote} />}

          <Section title="Documents">
            <ul className="grid gap-1">
              {DOCUMENTS.map(({ type, label }) => {
                const existing = documentOf(type);
                const locked = ELITE_DOCUMENTS.includes(type) && !hasFeature(plan, 'deploymentDocs');
                const row = 'flex h-11 w-full items-center gap-2 rounded-control px-2 text-left font-semibold transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none';
                return (
                  <li key={type}>
                    {existing ? (
                      <a href={existing.url} target="_blank" rel="noopener noreferrer" className={row}>
                        <FileText className="size-4 text-fg-muted" aria-hidden /> <span className="flex-1">{label}</span>
                        <ExternalLink className="size-4 text-fg-muted" aria-hidden />
                      </a>
                    ) : locked ? (
                      <span className="flex h-11 items-center gap-2 px-2 text-fg-muted">
                        <Lock className="size-4" aria-hidden /> <span className="flex-1">{label}</span>
                        <span className="rounded-control bg-surface-sunken px-2 py-0.5 text-fine font-bold">Elite</span>
                      </span>
                    ) : (
                      <button type="button" onClick={() => generate(type)} disabled={!!generating} className={`${row} text-action-text disabled:opacity-60`}>
                        <Download className="size-4" aria-hidden />
                        <span className="flex-1">{generating === type ? 'Making…' : `Make ${label.toLowerCase()}`}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>

          {changeable && (
            <Section title="Change or cancel">
              <div className="grid gap-2">
                <Button variant="secondary" onClick={() => setShowEdit(true)}>
                  <Pencil className="size-4" aria-hidden /> Edit display
                </Button>
                <Button variant="secondary" onClick={() => setShowCancel(true)} className="text-danger">
                  <X className="size-4" aria-hidden /> Cancel order
                </Button>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Phones: the main next step stays under the thumb, just above the tab bar */}
      {next.length > 0 && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:hidden">
          {actionButton(next[0], 0)}
        </div>
      )}

      <EditDisplayModal isOpen={showEdit} onClose={() => setShowEdit(false)} order={order} />
      <CancelOrderModal isOpen={showCancel} onClose={() => setShowCancel(false)} order={order} timeZone={timeZone} />
    </div>
  );
}

function Section({ title, aside, className, children }: { title: string; aside?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-card border border-line bg-surface p-4 sm:p-5 ${className ?? ''}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-heading font-semibold">{title}</h2>
        {aside && <span className="text-fine text-fg-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-fine text-fg-muted">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function ContactLink({ href, icon: Icon, children }: { href: string; icon: typeof Phone; children: React.ReactNode }) {
  return (
    <a href={href} className="flex h-11 items-center gap-3 rounded-control border border-line px-3 font-semibold transition-colors hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
      <Icon className="size-4 text-fg-muted" aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </a>
  );
}
