'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Stepper } from '@/features/booking/components/step-kit';
import { useToast } from '@/shared/components/feedback/toast';
import { addSignToInventory } from '../actions';
import type { Sign } from '../types';
import { SignFilterBar, SignThumb, useSignFilter } from './sign-filter';

const identity = (s: Sign) => s;

/**
 * Signs to add to stock: the platform library, or the agency's own custom
 * signs. Each tile shows how many the agency already has; Add opens a
 * count and adds that many.
 */
export function SignLibrary({ signs, owned, searchLabel, empty, extra }: {
  signs: Sign[];
  /** sign id -> quantity the agency already has */
  owned: Record<string, number>;
  searchLabel: string;
  empty: React.ReactNode;
  /** Optional per-tile control (custom signs: delete) */
  extra?: (sign: Sign) => React.ReactNode;
}) {
  const filter = useSignFilter(signs, identity);
  if (signs.length === 0) return <>{empty}</>;

  return (
    <>
      <SignFilterBar {...filter} label={searchLabel} />
      {filter.shown.length === 0 ? (
        <p className="text-fg-muted">No signs match.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filter.shown.map(sign => <SignTile key={sign.id} sign={sign} have={owned[sign.id] ?? 0} extra={extra?.(sign)} />)}
        </ul>
      )}
    </>
  );
}

function SignTile({ sign, have, extra }: { sign: Sign; have: number; extra?: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    const result = await addSignToInventory({ signId: sign.id, quantity: count });
    setBusy(false);
    if (!result.success) {
      toast({ variant: 'error', title: 'Couldn’t add it', description: result.error });
      return;
    }
    toast({ variant: 'success', title: `Added ${count} × ${sign.name}` });
    setAdding(false);
    setCount(1);
    router.refresh();
  };

  return (
    <li className="flex flex-col rounded-card border border-line bg-surface p-2">
      <SignThumb sign={sign} className="aspect-square w-full" />
      <p className="mt-2 truncate px-1 text-fine font-bold" title={sign.name}>{sign.name}</p>
      <p className="px-1 text-fine text-fg-muted">{have > 0 ? `You have ${have}` : sign.category}</p>
      <div className="mt-2 grid gap-2">
        {adding ? (
          <>
            <div className="flex justify-center"><Stepper label={sign.name} value={count} min={1} max={99} onChange={setCount} /></div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
              <Button size="sm" onClick={add} loading={busy} disabled={busy}>Add {count}</Button>
            </div>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden /> {have > 0 ? 'Add more' : 'Add'}
          </Button>
        )}
        {extra}
      </div>
    </li>
  );
}
