import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/db/supabase-client';

/**
 * The signed-in member and their agency for an /[agency]/... app page, or a
 * redirect: to sign-in when signed out, to /routing when the slug isn't
 * their agency. RLS is off, so this check is the tenant boundary.
 *
 * Call it in every page, not just the (app) layout: a layout doesn't re-run
 * on every navigation, so it can't guard a page. cache() makes the layout
 * and the page share one lookup per request.
 */
export const requireAgencyPage = cache(async (slug: string) => {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  const user = await getUserById(userId);
  const agency = user?.agency;
  if (!agency || agency.slug !== slug || !agency.is_active) redirect('/routing');

  // Untyped rows, as elsewhere (getUserById returns any)
  return { user, agency } as { user: any; agency: any };
});
