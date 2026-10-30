'use client';

import { useEffect, useState } from 'react';
import { TEST_CARD } from '../config';
import { endDemoAction } from '../actions';

function timeLeft(endsAt: string): { label: string; over: boolean } {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return { label: 'ended', over: true };
  const mins = Math.ceil(ms / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { label: h ? `${h}h ${m}m left` : `${m} min left`, over: false };
}

/** Across the top of every dashboard page on the demo site (DEMO.md) */
export function DemoBanner({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() => timeLeft(endsAt));
  useEffect(() => {
    const tick = () => {
      const next = timeLeft(endsAt);
      setLeft(next);
      if (next.over) window.location.assign('/demo/ended');
    };
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [endsAt]);

  return (
    <div className="bg-highlight/15 px-4 py-2 text-center text-fine sm:px-6">
      <strong>Demo</strong>: nothing here is real. Book with test card <span className="whitespace-nowrap font-semibold">{TEST_CARD}</span>, any future date and CVC. <span className="whitespace-nowrap font-semibold">{left.label}</span>
    </div>
  );
}

/** Takes the account menu's place: no profile, email or password changes on a borrowed account */
export function EndDemoButton() {
  return (
    <form action={endDemoAction}>
      <button type="submit" className="h-11 whitespace-nowrap rounded-control border border-line-strong px-3 text-fine font-bold hover:bg-surface-sunken focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
        End demo
      </button>
    </form>
  );
}
