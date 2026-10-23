// Pure money math for late and damage fees (fees.ts does the database and
// Stripe side). Kept apart so it can be tested without either.

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Whole days from one YYYY-MM-DD to another (negative when `to` is earlier) */
export const dayDiff = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

/**
 * The most an agency may charge after check-in: the late fee for each day
 * past the scheduled pickup, the damage fee for each damaged or missing sign.
 */
export function feeCaps(input: {
  pickupDay: string | null;
  checkInDay: string | null;
  lateFee: number;
  damagedSigns: number;
  damageFeePerSign: number;
}) {
  const lateDays = input.pickupDay && input.checkInDay ? Math.max(0, dayDiff(input.pickupDay, input.checkInDay)) : 0;
  return {
    lateDays,
    lateMax: round2(lateDays * input.lateFee),
    damageMax: round2(input.damagedSigns * input.damageFeePerSign),
  };
}

/**
 * The amounts the agency entered, rounded to cents, or an error when they're
 * negative or above what the booking terms allow.
 */
export function checkFeeAmounts(
  lateAmount: unknown,
  damageAmount: unknown,
  caps: { lateMax: number; damageMax: number },
): { lateAmount: number; damageAmount: number; total: number } | { error: string } {
  const late = round2(Number(lateAmount) || 0);
  const damage = round2(Number(damageAmount) || 0);
  if (late < 0 || damage < 0 || late > caps.lateMax + 0.001 || damage > caps.damageMax + 0.001) {
    return { error: 'Fees can\'t be more than the booking terms allow' };
  }
  return { lateAmount: late, damageAmount: damage, total: round2(late + damage) };
}
