
/**
 * The booking terms the customer agrees to on the Review step (PRODUCT.md
 * "Collecting late/damage fees"): the consent for later late/damage charges
 * and our evidence in a chargeback. Built from the agency's settings, so the
 * page and the server produce the same text; the server saves its copy on
 * the order.
 *
 * Deliberately commits the agency to nothing beyond PRODUCT.md decisions
 * (user, 2026-10-17): fees "may" be charged, no promised notice step.
 */

/** Cancellation rules a booking was made under (saved on the order) */
export interface CancellationPolicy {
  /** Notice before delivery for a refund (inside it: no refund) */
  noticeHours: number;
  /** Fee kept from the refund: the greater of feePercent of the total and feeMinimum */
  feePercent: number;
  feeMinimum: number;
}

/**
 * Defaults (Essentials, and gaps in an Elite agency's settings - see
 * policies.ts). Cancellation:
 * $20 or 15%, 48h - decided 2026-10-17 from yard card vendors' terms
 * (flat ~$25 fees, non-refundable deposits, half back late); covers Stripe's
 * fee and the platform's $3 even on small orders.
 */
export const TERMS_DEFAULTS = {
  cancellation: { noticeHours: 48, feePercent: 15, feeMinimum: 20 } as CancellationPolicy,
  damageFeePerSign: 5,
} as const;

/** Orders booked before the policy was saved on the order (terms 2026-10-17) */
const LEGACY_CANCELLATION: CancellationPolicy = { noticeHours: 24, feePercent: 5, feeMinimum: 0 };

/** Bump when the wording changes, so saved orders say which text was agreed */
export const TERMS_VERSION = '2026-10-19';

export interface BookingTerms {
  version: string;
  agencyName: string;
  sections: { title: string; text: string }[];
  agreement: string;
  cancellation: CancellationPolicy;
  /** The late and damage fee amounts agreed to (saved on the order for check-in) */
  fees: { lateFee: number; damageFeePerSign: number };
}

/** The cancellation rules an order was booked under (its saved terms). */
export function cancellationPolicyOf(termsSnapshot: unknown): CancellationPolicy {
  const saved = (termsSnapshot as { cancellation?: Partial<CancellationPolicy> } | null)?.cancellation;
  if (saved && [saved.noticeHours, saved.feePercent, saved.feeMinimum].every(n => typeof n === 'number')) {
    return saved as CancellationPolicy;
  }
  return LEGACY_CANCELLATION;
}

/** The late/damage fee amounts an order was booked under, or null for orders from before they were saved */
export function feesPolicyOf(termsSnapshot: unknown): { lateFee: number; damageFeePerSign: number } | null {
  const fees = (termsSnapshot as { fees?: { lateFee?: unknown; damageFeePerSign?: unknown } } | null)?.fees;
  if (fees && typeof fees.lateFee === 'number' && typeof fees.damageFeePerSign === 'number') {
    return { lateFee: fees.lateFee, damageFeePerSign: fees.damageFeePerSign };
  }
  return null;
}

/** Cancellation fee in dollars for an order total (never more than the total). */
export function cancellationFee(total: number, policy: CancellationPolicy): number {
  const fee = Math.max((total * policy.feePercent) / 100, policy.feeMinimum);
  return Math.round(Math.min(fee, total) * 100) / 100;
}

/**
 * What a customer gets back when they cancel: inside the notice window
 * nothing, otherwise the total minus the cancellation fee.
 */
export function customerRefund(total: number, policy: CancellationPolicy, hoursUntilDelivery: number) {
  const insideNotice = hoursUntilDelivery < policy.noticeHours;
  const fee = insideNotice ? total : cancellationFee(total, policy);
  return { insideNotice, fee, refund: Math.max(0, Math.round((total - fee) * 100) / 100) };
}

/** The refund an agency's cancel sends: what they entered, kept between $0 and the order total */
export function agencyRefund(refundType: 'full' | 'partial' | 'none', amount: unknown, total: number): number {
  if (refundType === 'none') return 0;
  return Math.round(Math.min(Math.max(Number(amount) || 0, 0), total) * 100) / 100;
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
/** "Texas Sign Solutions'" / "Elite Denver's" */
const possessive = (name: string) => (/s$/i.test(name.trim()) ? `${name}'` : `${name}'s`);

/** Reads right for any policy an Elite agency sets (no fee, no notice window...) */
function cancellationText({ noticeHours, feePercent, feeMinimum }: CancellationPolicy): string {
  const fee = feePercent > 0 && feeMinimum > 0
    ? `a refund minus a cancellation fee of ${feePercent}% or ${money(feeMinimum)}, whichever is more`
    : feePercent > 0 ? `a refund minus a ${feePercent}% cancellation fee`
    : feeMinimum > 0 ? `a refund minus a ${money(feeMinimum)} cancellation fee`
    : 'a full refund';
  if (noticeHours <= 0) return `Cancel any time before delivery for ${fee}.`;
  return `Cancel at least ${noticeHours} hours before delivery for ${fee}. Within ${noticeHours} hours of delivery, no refund.`;
}

export function buildBookingTerms(input: {
  agencyName: string;
  /** The agency's policies in force (policies.ts effectivePolicies) */
  policies: { cancellation: CancellationPolicy; lateFee: number; damageFeePerSign: number };
  /** Card payments are saved for later fees; other methods get a payment link */
  paysByCard: boolean;
}): BookingTerms {
  const { agencyName, policies, paysByCard } = input;
  const { cancellation, damageFeePerSign, lateFee } = policies;
  const howCharged = paysByCard
    ? 'Your card is saved securely by Stripe so these fees can be charged to it.'
    : 'These fees are paid through a payment link.';
  return {
    version: TERMS_VERSION,
    agencyName,
    sections: [
      { title: 'Payment', text: 'You pay the full amount now.' },
      {
        title: 'Cancellations',
        text: `${cancellationText(cancellation)} ` +
          `If ${agencyName} can't deliver or install your display, including because of weather, you get a full refund.`,
      },
      {
        title: 'Late pickup',
        text: `If the signs can't be collected at the scheduled pickup, ${agencyName} may charge ${money(lateFee)} per extra day until they can.`,
      },
      {
        title: 'Damage',
        text: `Damaged or missing signs may be charged at ${money(damageFeePerSign)} per sign. ${howCharged}`,
      },
    ],
    cancellation,
    fees: { lateFee, damageFeePerSign },
    agreement: paysByCard
      ? `I agree to ${possessive(agencyName)} booking terms and authorize ${agencyName} to charge my saved card for late or damage fees as described.`
      : `I agree to ${possessive(agencyName)} booking terms, including the late and damage fees described.`,
  };
}
