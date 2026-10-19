'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
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
      <Card>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Late &amp; damage fees</h3>
          {done.status === 'charged' && <p className="text-sm text-green-700">{money(done.total)} charged{quote.card ? ` to ${brand(quote.card.brand)} ••${quote.card.last4}` : ''}. The customer was emailed.</p>}
          {done.status === 'link_sent' && (
            <p className="text-sm text-amber-800">
              The card couldn&apos;t be charged, so the customer was emailed a payment link for {money(done.total)}.
              {done.checkoutUrl && <> <a href={done.checkoutUrl} target="_blank" rel="noopener noreferrer" className="underline">Copy the link</a></>}
            </p>
          )}
          {done.status === 'waived' && <p className="text-sm text-gray-700">Fees waived.</p>}
        </div>
      </Card>
    );
  }

  if (quote.lateMax <= 0 && quote.damageMax <= 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Late &amp; damage fees</h3>
          <p className="text-sm text-gray-600">None: the signs came back on time{quote.pickupDay ? ` (${day(quote.pickupDay)})` : ''} and none were damaged or missing.</p>
        </div>
      </Card>
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
    <Card>
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Late &amp; damage fees</h3>
          <p className="text-sm text-gray-600">From the booking terms. Lower or waive them if it wasn&apos;t the customer&apos;s fault.</p>
        </div>
        {quote.lateMax > 0 && (
          <label className="block text-sm">
            <span className="text-gray-800">
              Late pickup: back {day(quote.checkInDay)}, due {day(quote.pickupDay)} · {quote.lateDays} day{quote.lateDays === 1 ? '' : 's'} × {money(quote.lateFee)}
            </span>
            <span className="mt-1 flex items-center gap-2">$
              <input type="number" min={0} max={quote.lateMax} step="0.01" value={late} onChange={e => setLate(e.target.value)}
                className="w-28 rounded-md border border-gray-300 px-2 py-1" disabled={busy} />
              <span className="text-xs text-gray-500">max {money(quote.lateMax)}</span>
            </span>
          </label>
        )}
        {quote.damageMax > 0 && (
          <label className="block text-sm">
            <span className="text-gray-800">Damaged or missing: {quote.damagedSigns} sign{quote.damagedSigns === 1 ? '' : 's'} × {money(quote.damageFeePerSign)}</span>
            <span className="mt-1 flex items-center gap-2">$
              <input type="number" min={0} max={quote.damageMax} step="0.01" value={damage} onChange={e => setDamage(e.target.value)}
                className="w-28 rounded-md border border-gray-300 px-2 py-1" disabled={busy} />
              <span className="text-xs text-gray-500">max {money(quote.damageMax)}</span>
            </span>
          </label>
        )}
        {!quote.fromBookingTerms && (
          <p className="text-xs text-gray-500">This order is from before fee amounts were saved with bookings, so today&apos;s policy amounts are used.</p>
        )}
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <div className="flex flex-col gap-2">
          <Button onClick={() => submit(false)} disabled={busy || total <= 0}>
            {busy ? 'Working…' : quote.card ? `Charge ${money(total)} to ${brand(quote.card.brand)} ••${quote.card.last4}` : `Email a payment link for ${money(total)}`}
          </Button>
          <Button variant="secondary" onClick={() => submit(true)} disabled={busy}>Waive fees</Button>
        </div>
      </div>
    </Card>
  );
}
