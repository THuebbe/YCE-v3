/**
 * The booking steps in order. Always refer to a step by name (STEP.contact),
 * never by number: the order changes (2026-10-22 moved contact after the
 * display so customers design before they're asked for their details).
 *
 * Event comes first because sign availability depends on the date; the
 * display step holds signs for that date.
 */
export const STEP = {
  event: 1,
  display: 2,
  contact: 3,
  payment: 4,
  review: 5,
  confirm: 6,
} as const

export type StepName = keyof typeof STEP

export const TOTAL_STEPS = Object.keys(STEP).length
