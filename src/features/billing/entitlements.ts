/**
 * What each plan includes (PRODUCT.md "Plans", DECIDED 2026-10-19).
 * Essentials is the core needed to run an agency; everything else is Elite.
 *
 * Shared by server and client. The client uses it only to show or lock
 * buttons - every Elite feature is also checked on the server
 * (requireFeature), since RLS is off and actions are browser-callable.
 */
export type Plan = 'essentials' | 'elite';

export type Feature =
  | 'deploymentDocs' // pick ticket + pickup checklist (order summary is Essentials)
  | 'revenueMetrics' // dashboard revenue cards
  | 'policySettings' // own cancellation / late / damage fees and booking rules
  | 'popularDisplays' // dashboard card: most-booked occasions and themes
  | 'whiteLabel'; // own colors and logo on the booking page (decided 2026-10-22: Elite, not an add-on)

const ELITE_ONLY: ReadonlySet<Feature> = new Set(['deploymentDocs', 'revenueMetrics', 'policySettings', 'popularDisplays', 'whiteLabel']);

export const PLAN_LABELS: Record<Plan, string> = { essentials: 'Essentials', elite: 'Elite' };

/** Anything that isn't a known plan is treated as Essentials */
export function planOf(agency: { plan?: string | null } | null | undefined): Plan {
  return agency?.plan === 'elite' ? 'elite' : 'essentials';
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return plan === 'elite' || !ELITE_ONLY.has(feature);
}
