import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';
import { syncSubscription } from '@/features/billing/stripe-billing';
import { isDemoMode } from '@/features/demo/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Daily Vercel Cron (vercel.json): re-reads every agency subscription from
 * Stripe. The webhook does this as things happen; this catches a missed or
 * failed delivery, so a lapsed agency's booking page closes (and a paid
 * one's reopens) within a day at worst.
 */
export async function GET(request: NextRequest) {
  // Unlike keep-alive this calls Stripe for every agency: never run it open
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Demo loaners hold stand-in subscription ids ('demo_sub_N'), not Stripe's
  if (isDemoMode()) return NextResponse.json({ ok: true, skipped: 'demo' });

  const { data: agencies, error } = await supabase
    .from('agencies')
    .select('id, stripe_subscription_id')
    .not('stripe_subscription_id', 'is', null);
  if (error) {
    console.error('sync-subscriptions: agency lookup failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let failed = 0;
  for (const agency of agencies ?? []) {
    try {
      await syncSubscription(agency.stripe_subscription_id as string, 'daily cron');
    } catch (err) {
      failed++;
      console.error('sync-subscriptions failed for', agency.id, err);
    }
  }
  return NextResponse.json({ ok: failed === 0, synced: (agencies?.length ?? 0) - failed, failed });
}
