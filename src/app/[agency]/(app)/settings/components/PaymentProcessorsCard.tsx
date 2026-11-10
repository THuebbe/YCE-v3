'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CircleDollarSign, Building2, Zap } from 'lucide-react'
import { PaymentSettingsTab } from './PaymentSettingsTab'
import { StripeSetupTab } from './StripeSetupTab'
import { PayPalSetupTab } from './PayPalSetupTab'
import type { 
  StripeConnectStatus, 
  PayPalConnectStatus
} from '../validation/financialManagement'
import type { Agency } from '@/lib/types/agency'

interface PaymentProcessorsCardProps {
  agency: Agency
  stripeStatus?: StripeConnectStatus | null
  paypalStatus?: PayPalConnectStatus | null
  stripeReturnSuccess?: boolean
  stripeReturnRefresh?: boolean
  paypalReturnSuccess?: boolean
  paypalReturnRefresh?: boolean
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function PaymentProcessorsCard({ 
  agency, 
  stripeStatus,
  paypalStatus,
  stripeReturnSuccess = false,
  stripeReturnRefresh = false,
  paypalReturnSuccess = false,
  paypalReturnRefresh = false,
  onSuccess, 
  onError 
}: PaymentProcessorsCardProps) {
  // Back from Stripe's signup: open the Stripe tab, whose return handler
  // re-checks the account and saves its new status
  const [activeTab, setActiveTab] = useState(
    stripeReturnSuccess || stripeReturnRefresh ? 'stripe' : 'settings'
  )

  // Status indicators for tabs
  const stripeEnabled = !!(stripeStatus?.isConnected && stripeStatus?.hasCompletedOnboarding)
  const paypalEnabled = !!(paypalStatus?.isConnected && paypalStatus?.hasCompletedOnboarding)

  const getTabIcon = (processor: string) => {
    switch (processor) {
      case 'settings':
        return <Zap className="w-4 h-4" />
      case 'stripe':
        return <CreditCard className="w-4 h-4" />
      case 'paypal':
        return <CircleDollarSign className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (enabled: boolean, pending?: boolean) => {
    if (enabled) {
      return <Badge variant="default" className="bg-positive text-on-strong ml-2">Active</Badge>
    }
    if (pending) {
      return <Badge variant="secondary" className="bg-caution-soft text-caution ml-2">Pending</Badge>
    }
    return <Badge variant="outline" className="ml-2">Inactive</Badge>
  }

  return (
    <Card className="w-full shadow-raised border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Processors
        </CardTitle>
        <CardDescription>
          Connect the ways your customers can pay. Payments go straight to your own account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2"
            >
              {getTabIcon('settings')}
              Payment Settings
            </TabsTrigger>
            
            <TabsTrigger 
              value="stripe" 
              className="flex items-center gap-2"
            >
              {getTabIcon('stripe')}
              Stripe
              {getStatusBadge(
                stripeEnabled, 
                stripeStatus?.isConnected && !stripeStatus?.hasCompletedOnboarding
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="paypal" 
              className="flex items-center gap-2"
            >
              {getTabIcon('paypal')}
              PayPal and Venmo
              {getStatusBadge(
                paypalEnabled, 
                paypalStatus?.isConnected && !paypalStatus?.hasCompletedOnboarding
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <PaymentSettingsTab
              agency={agency}
              stripeStatus={stripeStatus}
              paypalStatus={paypalStatus}
              onOpenTab={setActiveTab}
              onSuccess={onSuccess}
              onError={onError}
            />
          </TabsContent>

          <TabsContent value="stripe" className="mt-6">
            <StripeSetupTab
              agency={agency}
              stripeStatus={stripeStatus}
              stripeReturnSuccess={stripeReturnSuccess}
              stripeReturnRefresh={stripeReturnRefresh}
              onSuccess={onSuccess}
              onError={onError}
            />
          </TabsContent>

          <TabsContent value="paypal" className="mt-6">
            <PayPalSetupTab
              agency={agency}
              paypalStatus={paypalStatus}
              paypalReturnSuccess={paypalReturnSuccess}
              paypalReturnRefresh={paypalReturnRefresh}
              onSuccess={onSuccess}
              onError={onError}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}