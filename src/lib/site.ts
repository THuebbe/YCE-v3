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

/** Must be a mailbox that receives mail (the domain had no MX record on 2026-10-19) */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@yardcard-elite.com';

export const agencyBookingUrl = (agencySlug: string) => `${SITE_URL}/${agencySlug}/booking`;
