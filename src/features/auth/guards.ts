import { auth } from '@clerk/nextjs/server';
import { getUserById } from '@/lib/db/supabase-client';

/**
 * Throws unless the signed-in user belongs to `agencyId`.
 *
 * RLS is off, so this is the only thing stopping a server action from
 * serving another agency's data. Use it in any 'use server' function that
 * takes an agency or order id, or that relies on getCurrentTenant() (which
 * resolves the agency from the URL and proves nothing about the caller).
 * Same check the [agency] dashboard pages do.
 */
export async function requireAgencyMember(agencyId: string | null | undefined): Promise<void> {
  const { userId } = await auth();
  if (!userId || !agencyId) {
    throw new Error('Unauthorized');
  }
  const user = await getUserById(userId);
  if (!user || user.agency_id !== agencyId) {
    throw new Error('Forbidden');
  }
}
