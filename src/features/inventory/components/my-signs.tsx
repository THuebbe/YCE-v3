'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Stepper } from '@/features/booking/components/step-kit';
import { useToast } from '@/shared/components/feedback/toast';
import { removeFromInventory, updateInventoryQuantity } from '../actions';
import type { InventoryItem } from '../types';
import { SignFilterBar, SignThumb, useSignFilter } from './sign-filter';

const signOf = (item: InventoryItem) => item.sign;

/**
 * The signs the agency owns and how many of each. Booking checks these
 * counts against the signs already held for other bookings on the same
 * dates, so this is the whole stock, not what's free today.
 */
export function MySigns({ items, slug }: { items: InventoryItem[]; slug: string }) {
  const filter = useSignFilter(items, signOf);
  const total = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-6 text-center">
        <p className="font-semibold">You haven&apos;t added any signs yet.</p>
        <p className="mt-1 text-fine text-fg-muted">Customers can only book displays built from signs you own.</p>
        <Link
          href={`/${slug}/inventory?tab=library`}
          className="mt-4 inline-flex h-11 items-center rounded-control bg-action px-4 font-bold text-on-action transition-colors hover:bg-action-hover focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
        >
          Add signs from the library
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-3 text-fine text-fg-muted">{items.length} kinds of sign · {total} signs in all</p>
      <SignFilterBar {...filter} label="Search your signs" />
      {filter.shown.length === 0 ? (
        <p className="text-fg-muted">No signs match.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {filter.shown.map(item => <SignRow key={item.id} item={item} />)}
        </ul>
      )}
    </>
  );
}

function SignRow({ item }: { item: InventoryItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [count, setCount] = useState(item.quantity);
  const [busy, setBusy] = useState(false);
  const changed = count !== item.quantity;
  const name = item.sign?.name ?? 'Sign';

  const save = async () => {
    setBusy(true);
    const result = await updateInventoryQuantity({ id: item.id, quantity: count });
    setBusy(false);
    if (!result.success) {
      toast({ variant: 'error', title: 'Couldn’t save', description: result.error });
      setCount(item.quantity);
      return;
    }
    toast({ variant: 'success', title: `${name}: ${count}` });
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm(`Remove ${name} from your signs?`)) return;
    setBusy(true);
    const result = await removeFromInventory(item.id);
    setBusy(false);
    if (!result.success) toast({ variant: 'error', title: 'Couldn’t remove it', description: result.error });
    else router.refresh();
  };

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-3">
      <SignThumb sign={item.sign} className="size-14" />
      <div className="min-w-0 flex-1 basis-32">
        <p className="truncate font-bold">{name}</p>
        <p className="text-fine text-fg-muted">{item.sign?.is_platform === false ? 'Custom · ' : ''}{item.sign?.category}</p>
      </div>
      <div className="flex items-center gap-2">
        <Stepper label={name} value={count} max={999} onChange={setCount} />
        {changed ? (
          <Button size="sm" onClick={save} loading={busy} disabled={busy}>Save</Button>
        ) : (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={`Remove ${name}`}
            className="flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-surface-sunken hover:text-danger focus-visible:shadow-(--focus-ring) focus-visible:outline-none disabled:opacity-50"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}
