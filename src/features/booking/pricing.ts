/**
 * Booking prices come from the agency's `agencies.pricing_config` (JSONB),
 * the same values the agency settings UI and /api/agency/financial-settings
 * write. Never hardcode a price in the wizard.
 */
export interface BookingPricing {
  basePrice: number;
  extraDayPrice: number;
  /** Per extra day when the signs can't be collected on time (booking terms) */
  lateFee: number;
}

/** PRODUCT.md default when the agency hasn't set a late fee */
export const DEFAULT_LATE_FEE = 25;

/**
 * Returns null when the agency hasn't configured pricing, so the booking page
 * can refuse to quote rather than fall back to an invented number.
 */
export function parseBookingPricing(pricingConfig: unknown): BookingPricing | null {
  if (!pricingConfig || typeof pricingConfig !== 'object') return null;
  const { basePrice, extraDayPrice, lateFee } = pricingConfig as Record<string, unknown>;
  const base = Number(basePrice);
  const extra = Number(extraDayPrice ?? 0);
  if (!Number.isFinite(base) || base <= 0) return null;
  if (!Number.isFinite(extra) || extra < 0) return null;
  const late = Number(lateFee ?? DEFAULT_LATE_FEE);
  return {
    basePrice: base,
    extraDayPrice: extra,
    lateFee: Number.isFinite(late) && late >= 0 ? late : DEFAULT_LATE_FEE,
  };
}

export function calculateBookingTotal(
  pricing: BookingPricing,
  extraDaysBefore = 0,
  extraDaysAfter = 0
): number {
  return pricing.basePrice + (extraDaysBefore + extraDaysAfter) * pricing.extraDayPrice;
}
