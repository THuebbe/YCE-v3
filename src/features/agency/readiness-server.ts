// Server only: never import this from a 'use client' file.
import { supabase } from '@/lib/db/supabase-client';
import { bookingBlockers, type ReadinessAgency, type ReadinessItem } from './readiness';

/** Has at least one sign in stock (agency_inventory) */
export async function agencyHasInventory(agencyId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('agency_inventory')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .gt('quantity', 0);
  if (error) {
    console.error('agencyHasInventory failed:', agencyId, error.message);
    return true; // don't close a booking page over a failed count
  }
  return (count ?? 0) > 0;
}

export async function getBookingBlockers(agency: ReadinessAgency & { id: string }): Promise<ReadinessItem[]> {
  return bookingBlockers(agency, await agencyHasInventory(agency.id));
}
