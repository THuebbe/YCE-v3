/**
 * The demo site (DEMO.md): the same code as production, switched on by
 * DEMO_MODE=1 in the demo deployment only. Shared by client and server:
 * keep it free of server-only imports.
 */

export const isDemoMode = () => process.env.DEMO_MODE === '1' || process.env.NEXT_PUBLIC_DEMO_MODE === '1';

/** How long a borrowed loaner lasts, from the first sign-in with the code (owner, 2026-10-29) */
export const DEMO_HOURS = 4;
/** Wrong codes allowed per invite before it locks */
export const CODE_ATTEMPTS = 5;
/** Codes emailed per invite (re-sends), so a link can't be used to spam an inbox */
export const CODE_SENDS = 5;

/** Shown next to the email field and stored with the lead (DEMO.md "Leads") */
export const CONSENT_TEXT = "We'll email your demo code and occasional YardCard Elite news.";

/** The template every loaner is reset from, and the loaners themselves (migrations/demo) */
export const TEMPLATE_AGENCY_ID = 'demo_template_lucky_lawn';
export const LOANER_AGENCY_PREFIX = 'demo_loaner_';

/** The only agencies demo code may ever reset or delete from */
export const isLoanerAgency = (agencyId: string | null | undefined) =>
  !!agencyId && agencyId.startsWith(LOANER_AGENCY_PREFIX) && /^demo_loaner_\d+$/.test(agencyId);

/** What a money action that needs a real Stripe login says on the demo site */
export const DEMO_UNAVAILABLE = 'Not available in the demo: this would open Stripe with your own account.';

/** Stripe's test card, shown on demo booking pages */
export const TEST_CARD = '4242 4242 4242 4242';

/** "jordan@gmail.com" -> "j••••n@gmail.com": enough to recognize, not to harvest */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '•••';
  const shown = local.length <= 2 ? local[0] : `${local[0]}${'•'.repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}`;
  return `${shown}${local.length <= 2 ? '•' : ''}@${domain}`;
}
