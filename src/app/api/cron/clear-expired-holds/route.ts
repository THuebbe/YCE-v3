import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * Daily Vercel Cron (vercel.json): marks lapsed temporary sign holds
 * inactive. Housekeeping only - availability already ignores expired holds,
 * so a missed run never over- or under-sells.
 *
 * Fails closed without CRON_SECRET: unlike keep-alive, nothing breaks if it
 * doesn't run.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('yce_expire_temporary_holds');
  if (error) {
    console.error('Expired-hold cleanup failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expired: data, at: new Date().toISOString() });
}
