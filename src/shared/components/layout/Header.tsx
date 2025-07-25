'use client'

import { useState } from 'react'
import { useAuth, UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import { Menu, X, Building2, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAgencySlug } from '@/lib/navigation'

export function Header() {
  const { isSignedIn } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const agencySlug = useAgencySlug()
  // Since we're using query parameters instead of subdomains, always redirect to /sign-in
  const signOutUrl = '/sign-in'

  // Create agency-aware navigation (only show if agencySlug exists)
  const navigation = agencySlug ? [
    { name: 'Dashboard', href: `/${agencySlug}/dashboard` },
    { name: 'Orders', href: `/${agencySlug}/orders` },
    { name: 'Inventory', href: `/${agencySlug}/inventory` },
    { name: 'Customers', href: `/${agencySlug}/customers` },
    { name: 'Reports', href: `/${agencySlug}/reports` },
  ] : []

  const publicNavigation = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={isSignedIn && agencySlug ? `/${agencySlug}/dashboard` : '/'} className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">YE</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">YardCard Elite</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {isSignedIn ? (
              <>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-neutral-700 hover:text-primary transition-colors duration-200 font-medium"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {publicNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-neutral-700 hover:text-primary transition-colors duration-200 font-medium"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                {/* Organization Switcher */}
                <div className="hidden md:block">
                  <OrganizationSwitcher
                    appearance={{
                      elements: {
                        organizationSwitcherTrigger: 
                          'border border-neutral-300 hover:border-neutral-400 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors duration-200',
                        organizationSwitcherPopoverCard: 
                          'shadow-xl border border-neutral-200 rounded-xl',
                        organizationSwitcherPopoverActionButton: 
                          'text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors duration-200',
                      }
                    }}
                    createOrganizationMode="navigation"
                    createOrganizationUrl="/organization/create"
                    organizationProfileMode="navigation"
                    organizationProfileUrl="/organization"
                  />
                </div>

                {/* Settings Button */}
                {agencySlug && (
                  <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                    <Link href={`/${agencySlug}/settings`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {/* User Button */}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                      userButtonPopoverCard: 'shadow-xl border border-neutral-200 rounded-xl',
                      userButtonPopoverActionButton: 
                        'text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors duration-200',
                    }
                  }}
                  userProfileMode="navigation"
                  userProfileUrl="/profile"
                  afterSignOutUrl={signOutUrl}
                />
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-neutral-700 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 py-4">
            <div className="space-y-2">
              {isSignedIn ? (
                <>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="border-t border-neutral-200 pt-4 mt-4">
                    <div className="px-3 py-2">
                      <OrganizationSwitcher
                        appearance={{
                          elements: {
                            organizationSwitcherTrigger: 
                              'w-full justify-start border border-neutral-300 hover:border-neutral-400 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors duration-200',
                          }
                        }}
                        createOrganizationMode="navigation"
                        createOrganizationUrl="/organization/create"
                        organizationProfileMode="navigation"
                        organizationProfileUrl="/organization"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {publicNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="border-t border-neutral-200 pt-4 mt-4 space-y-2">
                    <Link
                      href="/sign-in"
                      className="block px-3 py-2 text-base font-medium text-neutral-700 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="block px-3 py-2 text-base font-medium bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}