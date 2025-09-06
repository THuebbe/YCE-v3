'use client'

import React, { useState, useEffect } from 'react'
import { PaymentProcessorsCard } from './PaymentProcessorsCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, DollarSign, Save } from 'lucide-react'
import type { 
  Agency,
  FinancialManagementFormData, 
  FinancialValidationErrors, 
  PaymentMethod,
  PricingConfig,
  StripeConnectStatus,
  PayPalConnectStatus,
  BraintreeConnectStatus,
  SubscriptionInfo,
  calculateNetPayout
} from '../validation/financialManagement'

interface FinancialManagementSectionProps {
  agency: Agency
  stripeReturnSuccess?: boolean
  stripeReturnRefresh?: boolean
  paypalReturnSuccess?: boolean
  paypalReturnRefresh?: boolean
  braintreeReturnSuccess?: boolean
  braintreeReturnRefresh?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function FinancialManagementSection({ 
  agency, 
  stripeReturnSuccess = false,
  stripeReturnRefresh = false,
  paypalReturnSuccess = false,
  paypalReturnRefresh = false,
  braintreeReturnSuccess = false,
  braintreeReturnRefresh = false,
  onSuccess, 
  onError 
}: FinancialManagementSectionProps) {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    basePrice: agency.basePrice || 50,
    extraDayPrice: agency.extraDayPrice || 10,
    lateFee: agency.lateFee || 25,
  })

  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null)
  const [paypalStatus, setPaypalStatus] = useState<PayPalConnectStatus | null>(null)
  const [braintreeStatus, setBraintreeStatus] = useState<BraintreeConnectStatus | null>(null)
  const [errors, setErrors] = useState<FinancialValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load pricing configuration and subscription info on component mount
  useEffect(() => {
    loadFinancialSettings()
    loadSubscriptionInfo()
  }, [agency.id])

  const loadFinancialSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/agency/financial-settings?agencyId=${agency.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load financial settings')
      }

      if (data && data.success && data.data) {
        const responseData = data.data
        setPricingConfig({
          basePrice: responseData.basePrice || pricingConfig.basePrice,
          extraDayPrice: responseData.extraDayPrice || pricingConfig.extraDayPrice,
          lateFee: responseData.lateFee || pricingConfig.lateFee,
        })
        
        // Set payment processor status
        setStripeStatus(responseData.stripeStatus || null)
        setPaypalStatus(responseData.paypalStatus || null)
        setBraintreeStatus(responseData.braintreeStatus || null)
      }
    } catch (error) {
      console.error('Error loading financial settings:', error)
      onError?.(error instanceof Error ? error.message : 'Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubscriptionInfo = async () => {
    try {
      // Mock subscription data for now - will integrate with actual subscription system
      setSubscriptionInfo({
        status: agency.subscriptionStatus as any || 'active',
        currentPeriodStart: agency.subscriptionStartDate || new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        planName: 'Professional',
        planPrice: 99,
        billingInterval: 'month',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethodType: 'card',
        lastFourDigits: '4242'
      })
    } catch (error) {
      console.error('Error loading subscription info:', error)
    }
  }

  const handlePricingChange = (field: keyof PricingConfig, value: string) => {
    const numericValue = parseFloat(value) || 0
    setPricingConfig(prev => ({
      ...prev,
      [field]: numericValue
    }))
    
    // Clear field-specific errors
    setErrors(prev => ({
      ...prev,
      pricingConfig: {
        ...prev.pricingConfig,
        [field]: undefined
      }
    }))
  }

  const handleSavePricing = async () => {
    try {
      setIsSaving(true)
      setErrors({})

      // Validate pricing configuration
      if (pricingConfig.basePrice <= 0) {
        setErrors({ pricingConfig: { basePrice: ['Base price must be greater than 0'] } })
        return
      }

      if (pricingConfig.extraDayPrice < 0) {
        setErrors({ pricingConfig: { extraDayPrice: ['Extra day price cannot be negative'] } })
        return
      }

      if (pricingConfig.lateFee < 0) {
        setErrors({ pricingConfig: { lateFee: ['Late fee cannot be negative'] } })
        return
      }

      const response = await fetch(`/api/agency/financial-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agencyId: agency.id,
          pricingConfig
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save pricing configuration')
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error saving pricing configuration:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to save pricing configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Processors Card - New Tabbed Interface */}
      <PaymentProcessorsCard 
        agency={agency}
        stripeStatus={stripeStatus}
        paypalStatus={paypalStatus}
        braintreeStatus={braintreeStatus}
        stripeReturnSuccess={stripeReturnSuccess}
        stripeReturnRefresh={stripeReturnRefresh}
        paypalReturnSuccess={paypalReturnSuccess}
        paypalReturnRefresh={paypalReturnRefresh}
        braintreeReturnSuccess={braintreeReturnSuccess}
        braintreeReturnRefresh={braintreeReturnRefresh}
        onSuccess={onSuccess}
        onError={onError}
      />

      {/* Pricing Configuration */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Configuration
          </CardTitle>
          <CardDescription>
            Set your base pricing and additional fees for yard card rentals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="base-price">Base Price</Label>
              <Input
                id="base-price"
                type="number"
                step="0.01"
                min="0.01"
                value={pricingConfig.basePrice}
                onChange={(e) => handlePricingChange('basePrice', e.target.value)}
                placeholder="50.00"
              />
              {errors.pricingConfig?.basePrice && (
                <p className="text-sm text-red-600">{errors.pricingConfig.basePrice[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-day-price">Extra Day Price</Label>
              <Input
                id="extra-day-price"
                type="number"
                step="0.01"
                min="0"
                value={pricingConfig.extraDayPrice}
                onChange={(e) => handlePricingChange('extraDayPrice', e.target.value)}
                placeholder="10.00"
              />
              {errors.pricingConfig?.extraDayPrice && (
                <p className="text-sm text-red-600">{errors.pricingConfig.extraDayPrice[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="late-fee">Late Fee</Label>
              <Input
                id="late-fee"
                type="number"
                step="0.01"
                min="0"
                value={pricingConfig.lateFee}
                onChange={(e) => handlePricingChange('lateFee', e.target.value)}
                placeholder="25.00"
              />
              {errors.pricingConfig?.lateFee && (
                <p className="text-sm text-red-600">{errors.pricingConfig.lateFee[0]}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 shadow-sm rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Standard rental:</span>
                <span className="font-medium ml-2">${pricingConfig.basePrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Each extra day:</span>
                <span className="font-medium ml-2">+${pricingConfig.extraDayPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Late return:</span>
                <span className="font-medium ml-2">+${pricingConfig.lateFee.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSavePricing} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Pricing'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      {subscriptionInfo && (
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle>Subscription & Billing</CardTitle>
            <CardDescription>
              Your current subscription and payment information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptionInfo.planName}
                </p>
                <p className="text-sm text-gray-600">
                  ${subscriptionInfo.planPrice}/
                  {subscriptionInfo.billingInterval === 'month' ? 'month' : 'year'}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Next Billing Date</h4>
                <p className="text-gray-900">
                  {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Payment method: {subscriptionInfo.paymentMethodType} 
                  {subscriptionInfo.lastFourDigits && ` ending in ${subscriptionInfo.lastFourDigits}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}