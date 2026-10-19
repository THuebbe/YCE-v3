/**
 * The agency's booking policies: cancellation, late and damage fees, and
 * booking rules. Elite agencies set their own (settings); Essentials runs
 * on the defaults (PRODUCT.md "Plans", DECIDED 2026-10-19).
 *
 * Every reader goes through effectivePolicies / effectiveBookingRules, so an
 * agency that drops to Essentials falls back to the defaults even though its
 * old values stay stored (they come back if it upgrades again).
 *
 * Changing a policy only affects new bookings: each order saves the terms
 * it was booked under (orders.terms_snapshot).
 */
import { hasFeature, planOf } from '@/features/billing/entitlements';
import { DEFAULT_BOOKING_RULES, parseBookingRules, type BookingRules } from './booking-rules';
import { DEFAULT_LATE_FEE } from './pricing';
import { TERMS_DEFAULTS, type CancellationPolicy } from './terms';

export interface AgencyPolicies {
  cancellation: CancellationPolicy;
  /** Per extra day when the signs can't be collected on time */
  lateFee: number;
  damageFeePerSign: number;
}

export const DEFAULT_POLICIES: AgencyPolicies = {
  cancellation: TERMS_DEFAULTS.cancellation,
  lateFee: DEFAULT_LATE_FEE,
  damageFeePerSign: TERMS_DEFAULTS.damageFeePerSign,
};

/** Allowed ranges (settings form, save action and parser agree) */
export const POLICY_LIMITS = {
  noticeHours: { min: 0, max: 336 }, // up to 2 weeks
  feePercent: { min: 0, max: 100 },
  feeMinimum: { min: 0, max: 500 },
  lateFee: { min: 0, max: 500 },
  damageFeePerSign: { min: 0, max: 200 },
} as const;

type PolicyField = keyof typeof POLICY_LIMITS;

function clamp(value: unknown, field: PolicyField, fallback: number): number {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return fallback;
  const { min, max } = POLICY_LIMITS[field];
  return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
}

/**
 * Stored values (agencies.policy_config, plus the late fee in
 * pricing_config where it has always lived), defaults filling gaps.
 */
export function parsePolicies(policyConfig: unknown, pricingConfig?: unknown): AgencyPolicies {
  const p = policyConfig && typeof policyConfig === 'object' ? (policyConfig as Record<string, unknown>) : {};
  const pricing = pricingConfig && typeof pricingConfig === 'object' ? (pricingConfig as Record<string, unknown>) : {};
  const d = DEFAULT_POLICIES;
  return {
    cancellation: {
      noticeHours: Math.round(clamp(p.noticeHours, 'noticeHours', d.cancellation.noticeHours)),
      feePercent: clamp(p.feePercent, 'feePercent', d.cancellation.feePercent),
      feeMinimum: clamp(p.feeMinimum, 'feeMinimum', d.cancellation.feeMinimum),
    },
    lateFee: clamp(pricing.lateFee, 'lateFee', d.lateFee),
    damageFeePerSign: clamp(p.damageFeePerSign, 'damageFeePerSign', d.damageFeePerSign),
  };
}

interface PolicyAgency {
  plan?: string | null;
  policy_config?: unknown;
  pricing_config?: unknown;
  booking_rules?: unknown;
  blackout_dates?: unknown;
}

/** The policies bookings are made under right now */
export function effectivePolicies(agency: PolicyAgency): AgencyPolicies {
  return hasFeature(planOf(agency), 'policySettings')
    ? parsePolicies(agency.policy_config, agency.pricing_config)
    : DEFAULT_POLICIES;
}

/**
 * Booking rules in force. Blackout days work on every plan (an agency must
 * be able to close a day); the date rules are Elite.
 */
export function effectiveBookingRules(agency: PolicyAgency): BookingRules {
  const stored = parseBookingRules(agency.booking_rules, agency.blackout_dates);
  return hasFeature(planOf(agency), 'policySettings')
    ? stored
    : { ...DEFAULT_BOOKING_RULES, blackoutDays: stored.blackoutDays };
}

/** Compares the terms a customer saw with the ones in force (order creation) */
export function policyKey(p: AgencyPolicies): string {
  const c = p.cancellation;
  return [c.noticeHours, c.feePercent, c.feeMinimum, p.lateFee, p.damageFeePerSign].join('|');
}
