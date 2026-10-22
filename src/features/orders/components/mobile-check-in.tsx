'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Stepper, TextArea } from '@/features/booking/components/step-kit';
import { useToast } from '@/shared/components/feedback/toast';
import { checkInOrder } from '../actions';
import { countOrderSigns, formatAddress, getOrderSignLines } from '../client-utils';

interface LineCount {
  signId: string;
  damaged: number;
  missing: number;
  notes: string;
}

/**
 * Pickup check-in, done standing in the yard: every sign line starts as all
 * back in good shape; mark how many came back damaged or are missing.
 * Damaged and missing signs leave stock for good (decided 2026-10-10);
 * finishing releases the order's sign hold. The app shell hides its tab bar
 * here, so the finish button owns the bottom of the screen.
 */
export function MobileCheckIn({ order, slug }: { order: any; slug: string }) {
  const lines = getOrderSignLines(order);
  const [counts, setCounts] = useState<LineCount[]>(lines.map(line => ({ signId: line.signId, damaged: 0, missing: 0, notes: '' })));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const orderHref = `/${slug}/orders/${order.id}`;

  const update = (signId: string, change: Partial<LineCount>) =>
    setCounts(prev => prev.map(c => (c.signId === signId ? { ...c, ...change } : c)));

  const total = countOrderSigns(order);
  const damaged = counts.reduce((sum, c) => sum + c.damaged, 0);
  const missing = counts.reduce((sum, c) => sum + c.missing, 0);
  const good = total - damaged - missing;

  const finish = async () => {
    setBusy(true);
    try {
      const result = await checkInOrder({
        orderId: order.id,
        lines: lines.map(line => {
          const c = counts.find(x => x.signId === line.signId)!;
          return { signId: line.signId, good: line.quantity - c.damaged - c.missing, damaged: c.damaged, missing: c.missing, notes: c.notes };
        }),
        notes,
      });
      if (!result.success) {
        toast({ title: 'Check-in didn’t go through', description: result.error, variant: 'error' });
        return;
      }
      toast({
        title: 'Signs checked in',
        description: result.removedFromStock
          ? `Order done. ${result.removedFromStock} damaged or missing sign${result.removedFromStock === 1 ? '' : 's'} came off your inventory.`
          : 'Order done. All signs are back in stock.',
        variant: 'success',
      });
      router.push(orderHref);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const back = (
    <Link href={orderHref} className="mb-4 inline-flex h-11 items-center gap-2 text-fine font-bold text-action-text hover:underline">
      <ArrowLeft className="size-4" aria-hidden /> Order #{order.order_number}
    </Link>
  );

  if (order.status !== 'deployed') {
    return (
      <div className="mx-auto max-w-lg">
        {back}
        <p className="rounded-card border border-line bg-surface p-5">
          This order is {order.status === 'completed' ? 'already checked in' : 'not out yet'}. Only displays that are out can be checked in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {back}
      <h1 className="font-display text-title font-semibold">Check in signs</h1>
      <p className="mt-1 text-fg-muted">{order.customer_name}</p>
      <p className="flex items-start gap-1 text-fine text-fg-muted">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {formatAddress(order.event_address)}
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center" aria-live="polite">
        <Tally label="Good" value={good} tone="text-positive" />
        <Tally label="Damaged" value={damaged} tone="text-caution" />
        <Tally label="Missing" value={missing} tone="text-danger" />
      </dl>
      <p className="mt-2 text-center text-fine text-fg-muted">Damaged and missing signs come off your inventory.</p>

      <h2 className="mt-6 mb-3 font-display text-heading font-semibold">Signs</h2>
      {lines.length === 0 && (
        <p className="text-fine text-fg-muted">No signs are recorded for this order. Finishing just closes it.</p>
      )}
      <ul className="grid gap-3">
        {lines.map(line => {
          const c = counts.find(x => x.signId === line.signId)!;
          const name = line.sign?.name ?? line.signId;
          return (
            <li key={line.signId} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                {line.sign?.image_url
                  ? <img src={line.sign.image_url} alt="" className="size-12 rounded-control bg-surface-sunken object-contain" />
                  : <span className="size-12 rounded-control bg-surface-sunken" aria-hidden />}
                <div className="min-w-0">
                  <p className="truncate font-bold">{name}</p>
                  <p className="text-fine text-fg-muted">{line.quantity} out · {line.quantity - c.damaged - c.missing} back in good shape</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">Damaged</span>
                  <Stepper label={`damaged ${name}`} value={c.damaged} max={line.quantity - c.missing} onChange={n => update(line.signId, { damaged: n })} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">Missing</span>
                  <Stepper label={`missing ${name}`} value={c.missing} max={line.quantity - c.damaged} onChange={n => update(line.signId, { missing: n })} />
                </div>
              </div>
              {(c.damaged > 0 || c.missing > 0) && (
                <TextArea
                  aria-label={`What happened to ${name}`}
                  placeholder="What happened? (kept with the order)"
                  value={c.notes}
                  onChange={e => update(line.signId, { notes: e.target.value })}
                  rows={2}
                  className="mt-3"
                />
              )}
            </li>
          );
        })}
      </ul>

      <label className="mt-6 block">
        <span className="mb-1 block font-semibold">Notes about the pickup (optional)</span>
        <TextArea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </label>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-canvas/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-card sm:border">
        <Button size="lg" onClick={finish} loading={busy} disabled={busy} className="w-full">
          {busy ? 'Checking in…' : `Finish check-in · ${good} of ${total} back`}
        </Button>
      </div>
    </div>
  );
}

function Tally({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    // Number above its label on screen; dt before dd in the markup
    <div className="flex flex-col-reverse rounded-card border border-line bg-surface p-3">
      <dt className="text-fine text-fg-muted">{label}</dt>
      <dd className={`font-display text-title font-semibold ${tone}`}>{value}</dd>
    </div>
  );
}
