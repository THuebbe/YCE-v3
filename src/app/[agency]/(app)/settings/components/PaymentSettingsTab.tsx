'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, CircleDollarSign, Smartphone, Building2, Info } from 'lucide-react'
import type {
  StripeConnectStatus,
  PayPalConnectStatus,
  BraintreeConnectStatus,
} from '../validation/financialManagement'
import type { Agency } from '@/lib/types/agency'

type ProcessorTab = 'stripe' | 'paypal' | 'venmo'
type Status = 'active' | 'pending' | 'off'

interface PaymentSettingsTabProps {
  agency: Agency
  stripeStatus?: StripeConnectStatus | null
  paypalStatus?: PayPalConnectStatus | null
  braintreeStatus?: BraintreeConnectStatus | null
  /** Opens a processor's setup tab */
  onOpenTab?: (tab: ProcessorTab) => void
  onSuccess?: () => void
  onError?: (message: string) => void
}

/**
 * Overview of how this agency's customers can pay, from the processors'
 * real status. (Replaced placeholders on 2026-10-17: an always-on
 * "YardCard Elite Processing" option and its made-up 3.5% fee, and a
 * "primary processor" picker that saved nothing - checkout offers every
 * connected method, card first.)
 */
export function PaymentSettingsTab({
  stripeStatus,
  paypalStatus,
  braintreeStatus,
  onOpenTab,
}: PaymentSettingsTabProps) {
  const stripe: Status = stripeStatus?.chargesEnabled ? 'active' : stripeStatus?.isConnected ? 'pending' : 'off'
  const paypal: Status = paypalStatus?.isConnected && paypalStatus?.hasCompletedOnboarding
    ? 'active' : paypalStatus?.isConnected ? 'pending' : 'off'
  const venmo: Status = braintreeStatus?.isConnected && braintreeStatus?.venmoEnabled
    ? 'active' : braintreeStatus?.isConnected ? 'pending' : 'off'

  // PayPal and Venmo checkout aren't finished, so customers aren't offered
  // them yet (payment-methods route); their setup tabs still work
  const rows: { tab: ProcessorTab; icon: React.ReactNode; name: string; what: string; status: Status; comingSoon?: boolean }[] = [
    { tab: 'stripe', icon: <CreditCard className="w-5 h-5" />, name: 'Cards (Stripe)', what: 'Credit and debit cards, Apple Pay, Google Pay', status: stripe },
    { tab: 'paypal', icon: <CircleDollarSign className="w-5 h-5" />, name: 'PayPal', what: 'Coming soon at checkout. You can connect your account now.', status: paypal, comingSoon: true },
    { tab: 'venmo', icon: <Smartphone className="w-5 h-5" />, name: 'Venmo', what: 'Coming soon at checkout. You can connect your account now.', status: venmo, comingSoon: true },
  ]

  const badge = (status: Status) =>
    status === 'active' ? <Badge variant="default" className="bg-positive">Taking payments</Badge>
      : status === 'pending' ? <Badge variant="secondary" className="bg-caution-soft text-caution">Setup not finished</Badge>
        : <Badge variant="outline">Not set up</Badge>

  return (
    <div className="space-y-6">
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            How customers can pay
          </CardTitle>
          <CardDescription>
            Customers pay by card at booking. Money goes straight to your own account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map(row => (
            <div key={row.tab} className="flex flex-wrap items-center justify-between gap-3 p-4 shadow-raised rounded-card">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                {row.icon}
                <div>
                  <Label className="text-base font-medium">{row.name}</Label>
                  <p className="text-fine text-muted-foreground">{row.what}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {row.comingSoon && row.status === 'active' ? <Badge variant="outline">Connected</Badge> : badge(row.status)}
                {onOpenTab && (
                  <Button size="sm" variant="secondary" onClick={() => onOpenTab(row.tab)}>
                    {row.status === 'active' ? 'Manage' : row.status === 'pending' ? 'Finish setup' : 'Set up'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {stripe !== 'active' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Your booking page is closed until card payments are set up.</strong> Set up Stripe so customers pay when they book.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-fine">
          <p>
            <strong>Cards (Stripe):</strong> Stripe&apos;s standard 2.9% + $0.30 per payment, paid from your
            Stripe balance. With &ldquo;Set it up for me&rdquo;, YardCard Elite also keeps $3 per booking.
          </p>
          <p>
            <strong>PayPal and Venmo:</strong> their standard rates apply.
          </p>
          <p className="text-fine text-muted-foreground">
            Exact rates depend on your own account (international cards, disputes and instant payouts can cost extra).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
