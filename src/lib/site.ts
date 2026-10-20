/**
 * The app's public address and support contact. Everything is meant to
 * live on yardcard-elite.com (decided 2026-10-19), so nothing shown to
 * people should point at vercel.app. NEXT_PUBLIC_APP_URL overrides it
 * (e.g. local dev). Stripe return URLs use the request's own origin
 * instead (requestOrigin in lib/stripe), so previews come back to
 * themselves.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://yardcard-elite.com').replace(/\/$/, '');

/** For display: "yardcard-elite.com" */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

/** Trad Tech's helpdesk (yardcard-elite.com has no mailbox yet; decided 2026-10-20) */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'helpdesk@tradtechie.com';

/**
 * The company that runs YardCard Elite and is the party to the Terms and
 * Privacy Policy. Trad Tech LLC for now; YardCard Elite may later move to
 * its own LLC owned by Trad Tech (the Terms allow assigning to it).
 */
export const LEGAL_ENTITY = 'Trad Tech LLC';

export const agencyBookingUrl = (agencySlug: string) => `${SITE_URL}/${agencySlug}/booking`;
