import { supabase } from '@/lib/db/supabase-client';
import { hasFeature, planOf, type Feature, type Plan } from './entitlements';

export async function getAgencyPlan(agencyId: string): Promise<Plan> {
  const { data } = await supabase.from('agencies').select('plan').eq('id', agencyId).single();
  return planOf(data);
}

/** Throws unless the agency's plan includes `feature`. Call after requireAgencyMember. */
export async function requireFeature(agencyId: string, feature: Feature): Promise<void> {
  if (!hasFeature(await getAgencyPlan(agencyId), feature)) {
    throw new Error('This feature is part of the Elite plan');
  }
}
