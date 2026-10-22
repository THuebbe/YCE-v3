'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { NumberField } from '@/shared/components/ui/number-field';
import { assessOrderFees } from '../actions';
import type { FeeQuote } from '../fees';

const money = (n: number) => `$${n.toFixed(2)}`;
const BRANDS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };
const brand = (b: string) => BRANDS[b] ?? b.charAt(0).toUpperCase() + b.slice(1);
const day = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '?');

/**
 * After check-in: the late and damage fees the order's terms allow. The
 * agency charges them to the card saved at booking, lowers them, or waives
 * them (PRODUCT.md: never automatic).
 */
export function FeesCard({ orderId, quote }: { orderId: string; quote: FeeQuote }) {
  const router = useRouter();
  const [late, setLate] = useState(String(quote.lateMax));
  const [damage, setDamage] = useState(String(quote.damageMax));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = quote.existing && quote.existing.status !== 'failed' ? quote.existing : null;

  if (done) {
    return (
      <FeesShell>
          {done.status === 'charged' && <p className="text-fine text-positive">{money(done.total)} charged{quote.card ? ` to ${brand(quote.card.brand)} ••${quote.card.last4}` : ''}. The customer was emailed.</p>}
          {done.status === 'link_sent' && (
            <p className="text-fine text-caution">
              The card couldn&apos;t be charged, so the customer was emailed a payment link for {money(done.total)}.
              {done.checkoutUrl && <> <a href={done.checkoutUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">Open the link</a></>}
            </p>
          )}
          {done.status === 'waived' && <p className="text-fine text-fg-muted">Fees waived.</p>}
      </FeesShell>
    );
  }

  if (quote.lateMax <= 0 && quote.damageMax <= 0) {
    return (
      <FeesShell>
          <p className="text-fine text-fg-muted">None: the signs came back on time{quote.pickupDay ? ` (${day(quote.pickupDay)})` : ''} and none were damaged or missing.</p>
      </FeesShell>
    );
  }

  const lateNum = Math.min(Math.max(Number(late) || 0, 0), quote.lateMax);
  const damageNum = Math.min(Math.max(Number(damage) || 0, 0), quote.damageMax);
  const total = Math.round((lateNum + damageNum) * 100) / 100;

  const submit = async (waive: boolean) => {
    setBusy(true);
    setError(null);
    const result = await assessOrderFees({ orderId, lateAmount: waive ? 0 : lateNum, damageAmount: waive ? 0 : damageNum });
    setBusy(false);
    if (!result.success) setError(result.error);
    else router.refresh();
  };

  return (
    <FeesShell>
      <div className="grid gap-4">
        <p className="text-fine text-fg-muted">From the booking terms. Lower or waive them if it wasn&apos;t the customer&apos;s fault.</p>
        {quote.lateMax > 0 && (
          <label className="block text-fine">
            <span>
              Late pickup: back {day(quote.checkInDay)}, due {day(quote.pickupDay)} · {quote.lateDays} day{quote.lateDays === 1 ? '' : 's'} × {money(quote.lateFee)}
            </span>
            <span className="mt-1 flex items-center gap-2">
              <NumberField decimals prefix="$" value={late} onValueChange={setLate} disabled={busy} className="w-36" />
              <span className="text-fine text-fg-muted">max {money(quote.lateMax)}</span>
            </span>
          </label>
        )}
        {quote.damageMax > 0 && (
          <label className="block text-fine">
            <span>Damaged or missing: {quote.damagedSigns} sign{quote.damagedSigns === 1 ? '' : 's'} × {money(quote.damageFeePerSign)}</span>
            <span className="mt-1 flex items-center gap-2">
              <NumberField decimals prefix="$" value={damage} onValueChange={setDamage} disabled={busy} className="w-36" />
              <span className="text-fine text-fg-muted">max {money(quote.damageMax)}</span>
            </span>
          </label>
        )}
        {!quote.fromBookingTerms && (
          <p className="text-fine text-fg-muted">This order is from before fee amounts were saved with bookings, so today&apos;s policy amounts are used.</p>
        )}
        {error && <p className="text-fine text-danger" role="alert">{error}</p>}
        <div className="flex flex-col gap-2">
          <Button onClick={() => submit(false)} disabled={busy || total <= 0}>
            {busy ? 'Working…' : quote.card ? `Charge ${money(total)} to ${brand(quote.card.brand)} ••${quote.card.last4}` : `Email a payment link for ${money(total)}`}
          </Button>
          <Button variant="secondary" onClick={() => submit(true)} disabled={busy}>Waive fees</Button>
        </div>
      </div>
    </FeesShell>
  );
}

function FeesShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <h2 className="mb-3 font-display text-heading font-semibold">Late &amp; damage fees</h2>
      {children}
    </section>
  );
}
