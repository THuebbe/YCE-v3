// Server only: never import this from a 'use client' file.
//
// The loaner pool (DEMO.md "Loaners, not copies"). Everything here deletes
// and rewrites a loaner's data, so every entry point checks twice that it
// is running on the demo site and touching a demo_loaner_N agency.
import { randomBytes } from 'node:crypto';
import { clerkClient } from '@clerk/nextjs/server';
import { supabase } from '@/lib/db/supabase-client';
import { DEMO_HOURS, TEMPLATE_AGENCY_ID, isDemoMode, isLoanerAgency } from './config';
import { sampleOrders } from './sample-orders';

export interface Loaner {
  id: number;
  agency_id: string;
  clerk_user_id: string | null;
  status: 'free' | 'lent';
  invite_id: string | null;
  lent_email: string | null;
  lent_at: string | null;
  expires_at: string | null;
}

function assertDemo(agencyId?: string) {
  if (!isDemoMode()) throw new Error('demo: not the demo site');
  if (agencyId !== undefined && !isLoanerAgency(agencyId)) throw new Error(`demo: ${agencyId} is not a loaner`);
}

function check<T>(label: string, result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(`demo ${label}: ${result.error.message}`);
  return result.data as T;
}

/** "Today" on the template's clock (Central), for dating the sample orders */
function todayCentral(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
}

/** The loaner an agency is, if it is one, with whether its demo is running */
export async function loanerForAgency(agencyId: string): Promise<(Loaner & { active: boolean }) | null> {
  if (!isDemoMode() || !isLoanerAgency(agencyId)) return null;
  const loaner = check('loaner', await supabase.from('demo_loaners').select('*').eq('agency_id', agencyId).maybeSingle()) as Loaner | null;
  if (!loaner) return null;
  const active = loaner.status === 'lent' && !!loaner.expires_at && new Date(loaner.expires_at) > new Date();
  return { ...loaner, active };
}

/**
 * Hands out a loaner for an invite: claims one (free first, else expired),
 * resets it for this prospect and returns it. Null when all are in use.
 */
export async function lendLoaner(inviteId: string, email: string): Promise<Loaner | null> {
  assertDemo();
  const claimed = check('claim', await supabase.rpc('demo_claim_loaner', {
    p_invite_id: inviteId, p_email: email, p_hours: DEMO_HOURS,
  })) as { id: number; agency_id: string }[] | null;
  const pick = claimed?.[0];
  if (!pick) return null;
  try {
    return await resetLoaner(pick.id, email);
  } catch (error) {
    // Half-reset: give it back as free so the next claim resets it again
    await supabase.from('demo_loaners').update({ status: 'free', invite_id: null, lent_email: null, lent_at: null, expires_at: null }).eq('id', pick.id);
    throw error;
  }
}

/**
 * Puts a loaner back to the template: its bookings, holds and checkouts
 * deleted, settings and stock copied from the template, fresh sample orders,
 * and a brand-new Clerk user (so nothing a prospect did to the old one,
 * like adding a password, carries over). `email` becomes the agency's email.
 */
export async function resetLoaner(loanerId: number, email: string | null): Promise<Loaner> {
  assertDemo();
  const loaner = check('loaner', await supabase.from('demo_loaners').select('*').eq('id', loanerId).single()) as Loaner;
  const agencyId = loaner.agency_id;
  assertDemo(agencyId);

  // 1. The prospect's activity. Orders cascade to their items, sign lines,
  //    activities and check-ins; holds to their items.
  check('checkouts', await supabase.from('booking_checkouts').delete().eq('agency_id', agencyId));
  check('orders', await supabase.from('orders').delete().eq('agency_id', agencyId));
  check('holds', await supabase.from('inventory_holds').delete().eq('agency_id', agencyId));

  // 2. Settings back to the template's. Stripe and subscription fields are
  //    the loaner's own and stay.
  const template = check('template', await supabase.from('agencies')
    .select('name, description, phone, city, address, plan, email, pricing_config, booking_rules, operating_hours, policy_config, settings, branding, blackout_dates')
    .eq('id', TEMPLATE_AGENCY_ID).single()) as Record<string, unknown>;
  check('agency', await supabase.from('agencies')
    .update({ ...template, email: email ?? template.email, is_active: true, updated_at: new Date().toISOString() })
    .eq('id', agencyId));

  // 3. Stock back to the template's
  check('inventory', await supabase.from('agency_inventory').delete().eq('agency_id', agencyId));
  const stock = check('template stock', await supabase.from('agency_inventory').select('sign_id, quantity').eq('agency_id', TEMPLATE_AGENCY_ID)) as { sign_id: string; quantity: number }[];
  const now = new Date().toISOString();
  for (let i = 0; i < stock.length; i += 500) {
    check('restock', await supabase.from('agency_inventory').insert(stock.slice(i, i + 500).map(s => ({
      id: `inv_${agencyId}_${s.sign_id}`, agency_id: agencyId, sign_id: s.sign_id,
      quantity: s.quantity, available_quantity: s.quantity, allocated_quantity: 0, deployed_quantity: 0, updated_at: now,
    }))));
  }

  // 4. A fresh sign-in: the old Clerk user and its users row go, a new one comes
  const clerk = await clerkClient();
  check('users', await supabase.from('users').delete().eq('agency_id', agencyId));
  if (loaner.clerk_user_id) {
    try { await clerk.users.deleteUser(loaner.clerk_user_id); } catch { /* already gone */ }
  }
  const loginEmail = `loaner-${loanerId}-${randomBytes(4).toString('hex')}@demo.yardcard-elite.com`;
  const user = await clerk.users.createUser({
    emailAddress: [loginEmail], firstName: 'Demo', lastName: 'Owner', skipPasswordRequirement: true,
  });
  check('user row', await supabase.from('users').insert({
    id: user.id, clerk_user_id: user.id, email: loginEmail, first_name: 'Demo', last_name: 'Owner',
    role: 'ADMIN', agency_id: agencyId, updated_at: now,
  }));

  // 5. A believable week of bookings around today
  const { orders, signs } = sampleOrders(agencyId, todayCentral(), loanerId);
  check('sample orders', await supabase.from('orders').insert(orders));
  check('sample signs', await supabase.from('order_signs').insert(signs));

  const updated = check('loaner', await supabase.from('demo_loaners')
    .update({ clerk_user_id: user.id, reset_at: now, updated_at: now })
    .eq('id', loanerId).select('*').single()) as Loaner;
  return updated;
}

/** A one-time sign-in link for the loaner's Clerk user (Clerk sign-in tokens) */
export async function signInUrlFor(loaner: Loaner): Promise<string> {
  assertDemo(loaner.agency_id);
  if (!loaner.clerk_user_id) throw new Error('demo: loaner has no user yet');
  const token = await (await clerkClient()).signInTokens.createSignInToken({ userId: loaner.clerk_user_id, expiresInSeconds: 300 });
  return `/auth/sign-in?__clerk_ticket=${encodeURIComponent(token.token)}`;
}

/**
 * Ends a demo now (the prospect's "End demo", or the owner from admin): the
 * loaner is free, and its user's sessions are revoked. The data stays until
 * the next lend resets it.
 */
export async function endLoan(loanerId: number): Promise<void> {
  assertDemo();
  const loaner = check('loaner', await supabase.from('demo_loaners').select('*').eq('id', loanerId).single()) as Loaner;
  assertDemo(loaner.agency_id);
  check('end', await supabase.from('demo_loaners')
    .update({ status: 'free', expires_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', loanerId));
  if (loaner.clerk_user_id) {
    const clerk = await clerkClient();
    try {
      const { data: sessions } = await clerk.sessions.getSessionList({ userId: loaner.clerk_user_id, status: 'active' });
      await Promise.all(sessions.map(s => clerk.sessions.revokeSession(s.id)));
    } catch (error) {
      console.error('demo: revoking sessions failed', loanerId, error);
    }
  }
}

export async function listLoaners(): Promise<Loaner[]> {
  assertDemo();
  return check('loaners', await supabase.from('demo_loaners').select('*').order('id')) as Loaner[];
}
