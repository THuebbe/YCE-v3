import type { BookingPricing } from './pricing';

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

/** PRODUCT.md defaults until agencies can set these (Elite tier, later) */
export const TERMS_DEFAULTS = {
  cancelNoticeHours: 24,
  cancelFeePercent: 5,
  damageFeePerSign: 5,
} as const;

/** Bump when the wording changes, so saved orders say which text was agreed */
export const TERMS_VERSION = '2026-10-17';

export interface BookingTerms {
  version: string;
  agencyName: string;
  sections: { title: string; text: string }[];
  agreement: string;
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function buildBookingTerms(input: {
  agencyName: string;
  pricing: Pick<BookingPricing, 'lateFee'>;
  /** Card payments are saved for later fees; other methods get a payment link */
  paysByCard: boolean;
}): BookingTerms {
  const { agencyName, pricing, paysByCard } = input;
  const { cancelNoticeHours, cancelFeePercent, damageFeePerSign } = TERMS_DEFAULTS;
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
        text:
          `Cancel at least ${cancelNoticeHours} hours before delivery for a refund minus a ${cancelFeePercent}% fee ` +
          `(it covers card processing costs that aren't returned). Within ${cancelNoticeHours} hours of delivery, ` +
          `no refund. If ${agencyName} can't deliver, you get a full refund.`,
      },
      {
        title: 'Late pickup',
        text: `If the signs can't be collected at the scheduled pickup, ${agencyName} may charge ${money(pricing.lateFee)} per extra day until they can.`,
      },
      {
        title: 'Damage',
        text: `Damaged or missing signs may be charged at ${money(damageFeePerSign)} per sign. ${howCharged}`,
      },
    ],
    agreement: paysByCard
      ? `I agree to ${agencyName}'s booking terms and authorize ${agencyName} to charge my saved card for late or damage fees as described.`
      : `I agree to ${agencyName}'s booking terms, including the late and damage fees described.`,
  };
}
