'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  CircleDollarSign, 
  Building2, 
  ShieldCheck, 
  AlertTriangle,
  Info 
} from 'lucide-react'
import type { 
  StripeConnectStatus, 
  PayPalConnectStatus,
  PaymentMethod 
} from '../validation/financialManagement'
import type { Agency } from '@/lib/types/agency'

interface PaymentSettingsTabProps {
  agency: Agency
  stripeStatus?: StripeConnectStatus | null
  paypalStatus?: PayPalConnectStatus | null
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function PaymentSettingsTab({ 
  agency, 
  stripeStatus,
  paypalStatus,
  onSuccess, 
  onError 
}: PaymentSettingsTabProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Current processor states
  const stripeEnabled = !!(stripeStatus?.isConnected && stripeStatus?.hasCompletedOnboarding)
  const paypalEnabled = !!(paypalStatus?.isConnected && paypalStatus?.hasCompletedOnboarding)
  const yceProcessingEnabled = true // Always available as fallback

  // Determine current primary processor
  const getCurrentPaymentMethod = (): PaymentMethod => {
    if (stripeEnabled) return 'stripe_connect'
    if (paypalEnabled) return 'paypal_connect'
    return 'yce_processing'
  }

  const [primaryProcessor, setPrimaryProcessor] = useState<PaymentMethod>(getCurrentPaymentMethod())

  const handlePrimaryProcessorChange = async (value: string) => {
    try {
      setIsUpdating(true)
      setPrimaryProcessor(value as PaymentMethod)
      
      // In a real implementation, you would save this to the API
      // For now, just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess?.()
    } catch (error) {
      onError?.('Failed to update primary payment processor')
      setPrimaryProcessor(getCurrentPaymentMethod()) // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  const getProcessorIcon = (processor: string) => {
    switch (processor) {
      case 'stripe':
        return <CreditCard className="w-5 h-5" />
      case 'paypal':
        return <CircleDollarSign className="w-5 h-5" />
      case 'yce':
        return <ShieldCheck className="w-5 h-5" />
      default:
        return <Building2 className="w-5 h-5" />
    }
  }

  const getStatusBadge = (enabled: boolean, pending?: boolean) => {
    if (enabled) {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>
    }
    if (pending) {
      return <Badge variant="secondary" className="bg-orange-500">Pending Setup</Badge>
    }
    return <Badge variant="outline">Not Connected</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Processor Overview */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Available Payment Processors
          </CardTitle>
          <CardDescription>
            Configure which payment processors your agency uses to accept customer payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stripe Connect */}
          <div className="flex items-center justify-between p-4 shadow-sm rounded-lg">
            <div className="flex items-center gap-3">
              {getProcessorIcon('stripe')}
              <div>
                <Label className="text-base font-medium">Stripe Connect</Label>
                <p className="text-sm text-muted-foreground">
                  Accept credit cards, digital wallets, and bank transfers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(
                stripeEnabled,
                stripeStatus?.isConnected && !stripeStatus?.hasCompletedOnboarding
              )}
              <Switch
                checked={stripeEnabled}
                disabled={true} // Controlled by setup process
                onCheckedChange={() => {}}
              />
            </div>
          </div>

          {/* PayPal Connect */}
          <div className="flex items-center justify-between p-4 shadow-sm rounded-lg">
            <div className="flex items-center gap-3">
              {getProcessorIcon('paypal')}
              <div>
                <Label className="text-base font-medium">PayPal Connect</Label>
                <p className="text-sm text-muted-foreground">
                  Accept PayPal payments and Pay Later options
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(
                paypalEnabled,
                paypalStatus?.isConnected && !paypalStatus?.hasCompletedOnboarding
              )}
              <Switch
                checked={paypalEnabled}
                disabled={true} // Controlled by setup process
                onCheckedChange={() => {}}
              />
            </div>
          </div>

          {/* YCE Processing */}
          <div className="flex items-center justify-between p-4 shadow-sm rounded-lg">
            <div className="flex items-center gap-3">
              {getProcessorIcon('yce')}
              <div>
                <Label className="text-base font-medium">YardCard Elite Processing</Label>
                <p className="text-sm text-muted-foreground">
                  Let us handle payments for you with competitive rates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(true)}
              <Switch
                checked={yceProcessingEnabled}
                disabled={true} // Always enabled as fallback
                onCheckedChange={() => {}}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Processor Selection */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Primary Payment Processor
          </CardTitle>
          <CardDescription>
            Choose which processor to use by default for new customer payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-processor">Primary Processor</Label>
            <Select
              value={primaryProcessor}
              onValueChange={handlePrimaryProcessorChange}
            >
              <SelectTrigger id="primary-processor" disabled={isUpdating}>
                <SelectValue placeholder="Select primary processor" />
              </SelectTrigger>
              <SelectContent>
                {stripeEnabled && (
                  <SelectItem value="stripe_connect">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Stripe Connect
                    </div>
                  </SelectItem>
                )}
                {paypalEnabled && (
                  <SelectItem value="paypal_connect">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4" />
                      PayPal Connect
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="yce_processing">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    YardCard Elite Processing
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isUpdating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Updating primary processor...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {(!stripeEnabled && !paypalEnabled) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Get Started:</strong> Set up Stripe or PayPal to start accepting payments directly. 
            Use the tabs above to connect your preferred payment processor, or continue with YardCard Elite Processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Processing Fees Information */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Processing Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 shadow-sm rounded-lg">
              <div className="flex items-center gap-2 font-medium mb-1">
                <CreditCard className="w-4 h-4" />
                Stripe Connect
              </div>
              <p className="text-muted-foreground">2.9% + $0.30 per transaction</p>
            </div>
            
            <div className="p-3 shadow-sm rounded-lg">
              <div className="flex items-center gap-2 font-medium mb-1">
                <CircleDollarSign className="w-4 h-4" />
                PayPal Connect
              </div>
              <p className="text-muted-foreground">2.9% + $0.30 per transaction</p>
            </div>
            
            <div className="p-3 shadow-sm rounded-lg">
              <div className="flex items-center gap-2 font-medium mb-1">
                <ShieldCheck className="w-4 h-4" />
                YCE Processing
              </div>
              <p className="text-muted-foreground">3.5% per transaction (all-inclusive)</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            * Rates shown are standard processing fees. Additional fees may apply for international transactions, 
            chargebacks, or premium features.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}