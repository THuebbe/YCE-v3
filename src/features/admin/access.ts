// Server only: never import this from a 'use client' file.
import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { isAdmin } from './admins';

/**
 * The platform owner's pages read every agency: the one deliberately
 * cross-tenant place in the app. Anyone who isn't on ADMIN_USER_IDS,
 * signed in or not, gets the ordinary 404, so the pages don't advertise
 * themselves.
 *
 * Call it in every admin page and server action, not just the layout: a
 * layout doesn't re-run on every navigation (same rule as requireAgencyPage).
 */
export const requireAdmin = cache(async (): Promise<{ userId: string }> => {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) notFound();
  return { userId };
});
