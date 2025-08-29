'use client'

import React, { useState, useEffect } from 'react'

// Temporary Agency type definition - should match the actual Agency type from database
interface Agency {
  id: string
  name?: string
  slug?: string
  basePrice?: number
  extraDayPrice?: number
  lateFee?: number
  stripeAccountId?: string | null
  stripeAccountStatus?: string | null
  stripeOnboardingUrl?: string | null
  stripeChargesEnabled?: boolean
  stripePayoutsEnabled?: boolean
  stripeDetailsSubmitted?: boolean
  subscriptionStatus?: string
  subscriptionStartDate?: string
}
import { 
  FinancialManagementFormData, 
  FinancialValidationErrors, 
  PaymentMethod,
  PricingConfig,
  YCEPaymentConfig,
  StripeConnectStatus,
  SubscriptionInfo,
  financialManagementSchema,
  calculateNetPayout
} from '../validation/financialManagement'
import { createStripeConnectAccount, getStripeConnectStatus } from '@/features/payments/actions'

interface FinancialManagementSectionProps {
  agency: Agency
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function FinancialManagementSection({ 
  agency, 
  onSuccess, 
  onError 
}: FinancialManagementSectionProps) {
  const [formData, setFormData] = useState<FinancialManagementFormData>({
    paymentMethod: 'stripe_connect' as PaymentMethod,
    pricingConfig: {
      basePrice: agency.basePrice || 50,
      extraDayPrice: agency.extraDayPrice || 10,
      lateFee: agency.lateFee || 25,
    }
  })

  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [errors, setErrors] = useState<FinancialValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load financial settings on component mount
  useEffect(() => {
    loadFinancialSettings()
    loadStripeStatus()
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
        setFormData(prev => ({
          ...prev,
          paymentMethod: responseData.paymentMethod || 'stripe_connect',
          pricingConfig: {
            basePrice: responseData.basePrice || prev.pricingConfig.basePrice,
            extraDayPrice: responseData.extraDayPrice || prev.pricingConfig.extraDayPrice,
            lateFee: responseData.lateFee || prev.pricingConfig.lateFee,
          }
        }))
      }
    } catch (error) {
      console.error('Error loading financial settings:', error)
      setLoadError(error instanceof Error ? error.message : 'Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStripeStatus = async () => {
    try {
      const status = await getStripeConnectStatus()
      if (status.success) {
        setStripeStatus({
          accountId: status.accountId || null,
          isConnected: !!status.accountId,
          hasCompletedOnboarding: status.accountStatus === 'enabled',
          chargesEnabled: status.chargesEnabled || false,
          payoutsEnabled: status.payoutsEnabled || false,
          detailsSubmitted: status.detailsSubmitted || false,
          currentlyDue: [],
          eventuallyDue: [],
          pastDue: [],
          pendingVerification: []
        })
      }
    } catch (error) {
      console.error('Error loading Stripe status:', error)
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

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setFormData(prev => ({ ...prev, paymentMethod: method }))
    setErrors(prev => ({ ...prev, paymentMethod: undefined }))
  }

  const handlePricingChange = (field: keyof PricingConfig, value: string) => {
    const numericValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      pricingConfig: {
        ...prev.pricingConfig,
        [field]: numericValue
      }
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

  const handleStripeConnect = async () => {
    try {
      setIsLoading(true)
      const result = await createStripeConnectAccount()
      
      if (result.success && result.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = result.onboardingUrl
      } else {
        throw new Error(result.error || 'Failed to create Stripe account')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect with Stripe'
      setLoadError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePricing = async () => {
    try {
      setIsSaving(true)
      setErrors({})

      // Validate pricing configuration
      const validationResult = financialManagementSchema.safeParse({
        paymentMethod: formData.paymentMethod,
        pricingConfig: formData.pricingConfig
      })

      if (!validationResult.success) {
        const fieldErrors: FinancialValidationErrors = {}
        validationResult.error.errors.forEach(error => {
          const field = error.path.join('.')
          if (field.startsWith('pricingConfig.')) {
            const pricingField = field.replace('pricingConfig.', '') as keyof PricingConfig
            fieldErrors.pricingConfig = {
              ...fieldErrors.pricingConfig,
              [pricingField]: [error.message]
            }
          }
        })
        setErrors(fieldErrors)
        return
      }

      const response = await fetch(`/api/agency/financial-settings?agencyId=${agency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basePrice: formData.pricingConfig.basePrice,
          extraDayPrice: formData.pricingConfig.extraDayPrice,
          lateFee: formData.pricingConfig.lateFee,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          const fieldErrors: FinancialValidationErrors = {}
          data.details.forEach((detail: any) => {
            if (detail.field.startsWith('pricingConfig.')) {
              const pricingField = detail.field.replace('pricingConfig.', '') as keyof PricingConfig
              fieldErrors.pricingConfig = {
                ...fieldErrors.pricingConfig,
                [pricingField]: [detail.message]
              }
            }
          })
          setErrors(fieldErrors)
          return
        }
        throw new Error(data.error || 'Failed to save pricing settings')
      }

      onSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pricing settings'
      setLoadError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Render loading state
  if (isLoading && !formData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div role="region" aria-label="Financial Management" className="space-y-8">
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-800 text-sm">
              {loadError.includes('Network') ? 'Network error occurred' : 
               loadError.includes('permissions') ? 'Insufficient permissions' : 
               loadError.includes('load') ? 'Failed to load financial settings' : 
               loadError}
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Processing Method</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              id="stripe-connect"
              name="payment-method"
              type="radio"
              checked={formData.paymentMethod === 'stripe_connect'}
              onChange={() => handlePaymentMethodChange('stripe_connect')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              aria-labelledby="stripe-connect-label"
            />
            <div className="flex-1">
              <label id="stripe-connect-label" htmlFor="stripe-connect" className="block text-sm font-medium text-gray-900">
                Stripe Connect
              </label>
              <p className="text-sm text-gray-600">Direct payments to your bank account, full control over payouts and timing</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <input
              id="yce-processing"
              name="payment-method"
              type="radio"
              checked={formData.paymentMethod === 'yce_processing'}
              onChange={() => handlePaymentMethodChange('yce_processing')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              aria-labelledby="yce-processing-label"
            />
            <div className="flex-1">
              <label id="yce-processing-label" htmlFor="yce-processing" className="block text-sm font-medium text-gray-900">
                YardCard Elite Payment Processing
              </label>
              <p className="text-sm text-gray-600">We handle all payment processing complexity, service fee applies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Connect Status */}
      {formData.paymentMethod === 'stripe_connect' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Stripe Connect Status</h3>
            {stripeStatus?.isConnected && (
              <div 
                data-testid="stripe-status-indicator"
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stripeStatus.hasCompletedOnboarding 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {stripeStatus.hasCompletedOnboarding ? 'Setup Complete' : 'Setup Pending'}
              </div>
            )}
          </div>

          {!stripeStatus?.isConnected ? (
            <div className="text-center py-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Set up Stripe Connect</h4>
              <p className="text-sm text-gray-600 mb-4">Direct payments to your bank account with full control over payouts</p>
              <button
                onClick={handleStripeConnect}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect with Stripe'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">Stripe Account Connected</div>
                <div className="text-xs text-gray-600">Account ID: {stripeStatus.accountId?.substring(0, 12)}...</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {stripeStatus.chargesEnabled ? 'Charges Enabled' : 'Charges Pending'}
                </div>
                <div className={`text-xs ${stripeStatus.chargesEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stripeStatus.chargesEnabled ? 'Ready to accept payments' : 'Verification required'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {stripeStatus.payoutsEnabled ? 'Payouts Enabled' : 'Payouts Pending'}
                </div>
                <div className={`text-xs ${stripeStatus.payoutsEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stripeStatus.payoutsEnabled ? 'Bank account connected' : 'Bank setup required'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* YCE Payment Processing */}
      {formData.paymentMethod === 'yce_processing' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">YardCard Elite Payment Processing</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We handle all payment processing complexity, tax reporting, and customer support.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Service Fee Calculation</h4>
              <div className="text-sm text-blue-800">
                <div>Example: $100 rental</div>
                <div>Service Fee (5%): ${calculateNetPayout(100).serviceFee}</div>
                <div className="font-medium">Net Payout: ${calculateNetPayout(100).netPayout}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="base-price" className="block text-sm font-medium text-gray-700 mb-1">
              Base Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="base-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingConfig.basePrice}
                onChange={(e) => handlePricingChange('basePrice', e.target.value)}
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-describedby={errors.pricingConfig?.basePrice ? "base-price-error" : undefined}
              />
            </div>
            {errors.pricingConfig?.basePrice && (
              <p id="base-price-error" className="mt-1 text-sm text-red-600">
                {errors.pricingConfig.basePrice[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="extra-day-price" className="block text-sm font-medium text-gray-700 mb-1">
              Extra Day Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="extra-day-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingConfig.extraDayPrice}
                onChange={(e) => handlePricingChange('extraDayPrice', e.target.value)}
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-describedby={errors.pricingConfig?.extraDayPrice ? "extra-day-price-error" : undefined}
              />
            </div>
            {errors.pricingConfig?.extraDayPrice && (
              <p id="extra-day-price-error" className="mt-1 text-sm text-red-600">
                {errors.pricingConfig.extraDayPrice[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="late-fee" className="block text-sm font-medium text-gray-700 mb-1">
              Late Fee
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="late-fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricingConfig.lateFee}
                onChange={(e) => handlePricingChange('lateFee', e.target.value)}
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                aria-describedby={errors.pricingConfig?.lateFee ? "late-fee-error" : undefined}
              />
            </div>
            {errors.pricingConfig?.lateFee && (
              <p id="late-fee-error" className="mt-1 text-sm text-red-600">
                {errors.pricingConfig.lateFee[0]}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSavePricing}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Pricing'}
          </button>
        </div>
      </div>

      {/* Subscription Status */}
      {subscriptionInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    subscriptionInfo.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscriptionInfo.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Plan:</span>
                  <span className="text-sm text-gray-900">{subscriptionInfo.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Price:</span>
                  <span className="text-sm text-gray-900">${subscriptionInfo.planPrice}/{subscriptionInfo.billingInterval}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Billing Information</h4>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Next billing: {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">
                  Payment method: {subscriptionInfo.paymentMethodType} 
                  {subscriptionInfo.lastFourDigits && ` ending in ****${subscriptionInfo.lastFourDigits}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}