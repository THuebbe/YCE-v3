'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabase, getUserById } from '@/lib/db/supabase-client';
import { requireFeature } from '@/features/billing/server';
import { POLICY_LIMITS, parsePolicies, type AgencyPolicies } from './policies';

const ADMIN_ROLES = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN'];

const n = (field: keyof typeof POLICY_LIMITS, label: string) =>
  z.number({ invalid_type_error: `${label} must be a number` })
    .min(POLICY_LIMITS[field].min, `${label} can't be below ${POLICY_LIMITS[field].min}`)
    .max(POLICY_LIMITS[field].max, `${label} can't be above ${POLICY_LIMITS[field].max}`);

const policiesSchema = z.object({
  noticeHours: n('noticeHours', 'Notice').int('Notice must be whole hours'),
  feePercent: n('feePercent', 'Cancellation fee %'),
  feeMinimum: n('feeMinimum', 'Minimum cancellation fee'),
  lateFee: n('lateFee', 'Late fee'),
  damageFeePerSign: n('damageFeePerSign', 'Damage fee'),
});

export type PoliciesInput = z.infer<typeof policiesSchema>;

type Result = { success: true; policies: AgencyPolicies } | { success: false; error: string };

/**
 * Elite: the agency's own cancellation, late and damage fees. Only new
 * bookings use them; each order keeps the terms it was booked under.
 * For the signed-in admin's OWN agency (never an id from the browser).
 */
export async function savePolicies(input: PoliciesInput): Promise<Result> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Please sign in again' };
    const user = await getUserById(userId);
    if (!user?.agency_id) return { success: false, error: 'No agency for this account' };
    if (!ADMIN_ROLES.includes(user.role)) return { success: false, error: 'Only agency admins can change policies' };
    await requireFeature(user.agency_id, 'policySettings');

    const parsed = policiesSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Check the values' };
    const { lateFee, ...policyConfig } = parsed.data;

    const { data: agency, error: readError } = await supabase
      .from('agencies')
      .select('pricing_config')
      .eq('id', user.agency_id)
      .single();
    if (readError || !agency) return { success: false, error: 'Agency not found' };
    const pricingConfig = { ...(agency.pricing_config as Record<string, unknown> | null ?? {}), lateFee };

    const { error } = await supabase
      .from('agencies')
      .update({ policy_config: policyConfig, pricing_config: pricingConfig, updated_at: new Date().toISOString() })
      .eq('id', user.agency_id);
    if (error) {
      console.error('savePolicies failed:', error.message);
      return { success: false, error: 'Could not save your policies' };
    }
    revalidatePath('/[agency]/settings', 'page');
    return { success: true, policies: parsePolicies(policyConfig, pricingConfig) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not save your policies' };
  }
}
