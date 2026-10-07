import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * Daily Vercel Cron (vercel.json) that keeps the free-tier Supabase project
 * from auto-pausing after ~7 idle days, which has taken production down twice.
 * Remove once the project is on a paid tier.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when that env var is set.
 * Without it the endpoint stays open: it reads one id and returns nothing
 * sensitive, and failing closed would silently stop the keep-alive.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('agencies').select('id').limit(1);
  if (error) {
    console.error('Supabase keep-alive failed:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
