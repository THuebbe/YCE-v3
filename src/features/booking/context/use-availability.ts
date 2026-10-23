'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { indexStock, type StockIndex, type StockSnapshot } from '../availability';
import { addDays } from '../booking-rules';
import type { BookingActions } from './wizard-context';

/** How far ahead the calendar can look; one snapshot covers it */
export const AVAILABILITY_DAYS = 180;

export interface AvailabilityState {
  snapshot: StockSnapshot | null;
  index: StockIndex | null;
  /** First and last day the snapshot covers (YYYY-MM-DD) */
  range: { from: string; to: string };
  loading: boolean;
  error: string | null;
  /** Loads the snapshot if it isn't yet (step 1 calls this on arrival) */
  ensure: () => void;
  /** Fresh snapshot, e.g. after a reservation failed because stock moved */
  refresh: () => Promise<void>;
}

/**
 * The agency's stock and holds for the next six months, shared by every
 * step: step 1 grays out days, the design step filters its pickers. Loaded
 * once and reused; refreshed when a reservation finds it out of date.
 */
export function useAvailability(actions: BookingActions, agencySlug: string, sessionId: string, today: string): AvailabilityState {
  const range = useMemo(() => ({ from: addDays(today, -1), to: addDays(today, AVAILABILITY_DAYS) }), [today]);
  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await actions.getAvailabilitySnapshot({ agencySlug, sessionId, ...range });
      if (result.ok) {
        setSnapshot(result.snapshot);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch {
      setError('Could not check which signs are free. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [actions, agencySlug, sessionId, range]);

  const ensure = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    void load();
  }, [load]);

  // A failed first load can be retried by calling ensure again
  useEffect(() => {
    if (error) requested.current = false;
  }, [error]);

  const index = useMemo(() => (snapshot ? indexStock(snapshot.signs) : null), [snapshot]);
  return { snapshot, index, range, loading, error, ensure, refresh: load };
}
