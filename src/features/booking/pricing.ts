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
  /** Percent, e.g. 8.25. 0 or missing: no sales tax */
  salesTaxRate?: number;
  /** true: the prices above already include the tax; false: tax is added on top */
  taxIncluded?: boolean;
}

/** Highest sales tax rate the settings accept, in percent */
export const MAX_SALES_TAX_RATE = 20;

/**
 * The agency's sales tax answer from `pricing_config`, or null when it hasn't
 * answered yet (the setup checklist asks: booking pages stay closed until it
 * does). A rate of 0 is the answer "I don't charge sales tax".
 */
export function parseSalesTax(pricingConfig: unknown): { rate: number; included: boolean } | null {
  if (!pricingConfig || typeof pricingConfig !== 'object') return null;
  const { salesTaxRate, salesTaxIncluded } = pricingConfig as Record<string, unknown>;
  if (typeof salesTaxRate !== 'number' || !Number.isFinite(salesTaxRate)) return null;
  if (salesTaxRate < 0 || salesTaxRate > MAX_SALES_TAX_RATE) return null;
  return { rate: salesTaxRate, included: salesTaxRate > 0 && salesTaxIncluded === true };
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
  const tax = parseSalesTax(pricingConfig);
  return {
    basePrice: base,
    extraDayPrice: extra,
    lateFee: Number.isFinite(late) && late >= 0 ? late : DEFAULT_LATE_FEE,
    salesTaxRate: tax?.rate ?? 0,
    taxIncluded: tax?.included ?? false,
  };
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface BookingAmounts {
  /** Base price plus extra days, at the agency's prices */
  rental: number;
  /** Before tax */
  subtotal: number;
  tax: number;
  /** What the customer pays */
  total: number;
}

/**
 * A booking's money, with sales tax either added on top of the agency's
 * prices or taken out of them (prices that include tax). One place for the
 * math: the wizard shows these numbers and the server charges them.
 */
export function calculateBookingAmounts(
  pricing: BookingPricing,
  extraDaysBefore = 0,
  extraDaysAfter = 0
): BookingAmounts {
  const rental = round2(pricing.basePrice + (extraDaysBefore + extraDaysAfter) * pricing.extraDayPrice);
  const rate = (pricing.salesTaxRate ?? 0) / 100;
  if (!(rate > 0)) return { rental, subtotal: rental, tax: 0, total: rental };
  if (pricing.taxIncluded) {
    const tax = round2(rental - rental / (1 + rate));
    return { rental, subtotal: round2(rental - tax), tax, total: rental };
  }
  const tax = round2(rental * rate);
  return { rental, subtotal: rental, tax, total: round2(rental + tax) };
}

/** What the customer pays, tax included */
export function calculateBookingTotal(
  pricing: BookingPricing,
  extraDaysBefore = 0,
  extraDaysAfter = 0
): number {
  return calculateBookingAmounts(pricing, extraDaysBefore, extraDaysAfter).total;
}

/** "8.25%": no trailing zeros */
export function formatTaxRate(rate: number): string {
  return `${Number(rate.toFixed(3))}%`;
}
