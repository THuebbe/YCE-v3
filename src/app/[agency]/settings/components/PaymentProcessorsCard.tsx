'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CircleDollarSign, Building2, Zap } from 'lucide-react'
import { PaymentSettingsTab } from './PaymentSettingsTab'
import { StripeSetupTab } from './StripeSetupTab'
import { PayPalSetupTab } from './PayPalSetupTab'
import { VenmoSetupTab } from './VenmoSetupTab'
import type { 
  Agency, 
  StripeConnectStatus, 
  PayPalConnectStatus,
  BraintreeConnectStatus
} from '../validation/financialManagement'

interface PaymentProcessorsCardProps {
  agency: Agency
  stripeStatus?: StripeConnectStatus | null
  paypalStatus?: PayPalConnectStatus | null
  braintreeStatus?: BraintreeConnectStatus | null
  stripeReturnSuccess?: boolean
  stripeReturnRefresh?: boolean
  paypalReturnSuccess?: boolean
  paypalReturnRefresh?: boolean
  braintreeReturnSuccess?: boolean
  braintreeReturnRefresh?: boolean
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function PaymentProcessorsCard({ 
  agency, 
  stripeStatus,
  paypalStatus,
  braintreeStatus,
  stripeReturnSuccess = false,
  stripeReturnRefresh = false,
  paypalReturnSuccess = false,
  paypalReturnRefresh = false,
  braintreeReturnSuccess = false,
  braintreeReturnRefresh = false,
  onSuccess, 
  onError 
}: PaymentProcessorsCardProps) {
  const [activeTab, setActiveTab] = useState('settings')

  // Status indicators for tabs
  const stripeEnabled = stripeStatus?.isConnected && stripeStatus?.hasCompletedOnboarding
  const paypalEnabled = paypalStatus?.isConnected && paypalStatus?.hasCompletedOnboarding
  const venmoEnabled = braintreeStatus?.isConnected && braintreeStatus?.venmoEnabled

  const getTabIcon = (processor: string) => {
    switch (processor) {
      case 'settings':
        return <Zap className="w-4 h-4" />
      case 'stripe':
        return <CreditCard className="w-4 h-4" />
      case 'paypal':
        return <CircleDollarSign className="w-4 h-4" />
      case 'venmo':
        return <Building2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (enabled: boolean, pending?: boolean) => {
    if (enabled) {
      return <Badge variant="default" className="bg-green-500 text-white ml-2">Active</Badge>
    }
    if (pending) {
      return <Badge variant="secondary" className="bg-orange-500 text-white ml-2">Pending</Badge>
    }
    return <Badge variant="outline" className="ml-2">Inactive</Badge>
  }

  return (
    <Card className="w-full shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Processors
        </CardTitle>
        <CardDescription>
          Configure how your agency accepts payments from customers. You can use multiple processors 
          or let YardCard Elite handle payments for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
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
              PayPal
              {getStatusBadge(
                paypalEnabled, 
                paypalStatus?.isConnected && !paypalStatus?.hasCompletedOnboarding
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="venmo" 
              className="flex items-center gap-2"
            >
              {getTabIcon('venmo')}
              Venmo
              {getStatusBadge(
                venmoEnabled, 
                braintreeStatus?.isConnected && !braintreeStatus?.venmoEnabled
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <PaymentSettingsTab
              agency={agency}
              stripeStatus={stripeStatus}
              paypalStatus={paypalStatus}
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

          <TabsContent value="venmo" className="mt-6">
            <VenmoSetupTab
              agency={agency}
              braintreeReturnSuccess={braintreeReturnSuccess}
              braintreeReturnRefresh={braintreeReturnRefresh}
              onSuccess={onSuccess}
              onError={onError}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}