/** The Settings tabs, shared by the settings page and /billing (Plan & billing) */
export function settingsSections(slug: string) {
  return [
    { id: 'business', label: 'Business', href: `/${slug}/settings?section=business` },
    { id: 'booking', label: 'Booking page', href: `/${slug}/settings?section=booking` },
    { id: 'payments', label: 'Payments', href: `/${slug}/settings?section=payments` },
    { id: 'plan', label: 'Plan & billing', href: `/${slug}/billing` },
  ]
}
