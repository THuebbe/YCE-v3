/**
 * Who may open /admin: the Clerk user ids listed in ADMIN_USER_IDS
 * (comma-separated). Production and previews use different Clerk instances,
 * so each environment lists its own ids. Unset or empty means nobody.
 */
export function parseAdminIds(raw: string | undefined): Set<string> {
  return new Set((raw ?? '').split(',').map(s => s.trim()).filter(Boolean));
}

export function isAdmin(userId: string | null | undefined, raw: string | undefined = process.env.ADMIN_USER_IDS): boolean {
  return !!userId && parseAdminIds(raw).has(userId);
}
