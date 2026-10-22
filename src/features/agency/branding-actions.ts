'use server';

import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { supabase } from '@/lib/db/supabase-client';
import { requireAgencyMember } from '@/features/auth/guards';
import { requireFeature } from '@/features/billing/server';
import { parseBranding, type AgencyBranding } from './branding';

type Result = { success: true; branding: AgencyBranding } | { success: false; error: string };

const ADMIN_ROLES = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
// No SVG: it can carry script, and the logo is served from a public URL
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Signed-in admin of this agency, on a plan with white label. RLS is off: this is the check. */
async function requireBrandingEditor(agencyId: string) {
  const user = (await requireAgencyMember(agencyId)) as { role?: string };
  if (!ADMIN_ROLES.includes(String(user.role))) throw new Error('Only the agency’s admins can change its branding');
  await requireFeature(agencyId, 'whiteLabel');
}

async function save(agencyId: string, branding: AgencyBranding): Promise<Result> {
  const clean = parseBranding(branding);
  const { error } = await supabase.from('agencies').update({ branding: clean }).eq('id', agencyId);
  if (error) {
    console.error('Saving branding failed:', agencyId, error.message);
    return { success: false, error: 'Couldn’t save your branding' };
  }
  revalidatePath('/[agency]', 'layout');
  return { success: true, branding: clean };
}

async function current(agencyId: string): Promise<AgencyBranding> {
  const { data } = await supabase.from('agencies').select('branding').eq('id', agencyId).single();
  return parseBranding(data?.branding);
}

/** Colors from Settings > Booking page. Empty strings clear a color (back to the YardCard defaults). */
export async function saveBrandColors(agencyId: string, colors: { brandColor: string; accentColor: string }): Promise<Result> {
  try {
    await requireBrandingEditor(agencyId);
    const before = await current(agencyId);
    return save(agencyId, { ...before, brandColor: colors.brandColor || undefined, accentColor: colors.accentColor || undefined });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Couldn’t save your branding' };
  }
}

/** A new logo, stored on Vercel Blob (public, like order PDFs) and saved to the branding. */
export async function uploadBrandLogo(agencyId: string, form: FormData): Promise<Result> {
  try {
    await requireBrandingEditor(agencyId);
    const file = form.get('logo');
    if (!(file instanceof File)) return { success: false, error: 'Choose an image' };
    if (!LOGO_TYPES.includes(file.type)) return { success: false, error: 'Use a PNG, JPEG or WebP image' };
    if (file.size > LOGO_MAX_BYTES) return { success: false, error: 'Logos can be up to 2 MB' };
    const ext = file.type.split('/')[1];
    const blob = await put(`logos/${agencyId}/${Date.now()}.${ext}`, file, { access: 'public', contentType: file.type });
    return save(agencyId, { ...(await current(agencyId)), logoUrl: blob.url });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Couldn’t upload your logo' };
  }
}

export async function removeBrandLogo(agencyId: string): Promise<Result> {
  try {
    await requireBrandingEditor(agencyId);
    return save(agencyId, { ...(await current(agencyId)), logoUrl: undefined });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Couldn’t remove your logo' };
  }
}
