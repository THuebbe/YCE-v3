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
  FinancialManagementFormData, 
  FinancialValidationErrors, 
  PaymentMethod,
  PricingConfig,
  StripeConnectStatus,
  PayPalConnectStatus,
  BraintreeConnectStatus,
  calculateNetPayout
} from '../validation/financialManagement'
import type { Agency } from '@/lib/types/agency'

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
  /** Settings shows prices under Booking page and the processors under Payments */
  show: 'pricing' | 'payments'
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
  onError,
  show,
}: FinancialManagementSectionProps) {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    basePrice: agency.basePrice ?? 50,
    extraDayPrice: agency.extraDayPrice ?? 10,
    lateFee: agency.lateFee ?? 25,
  })

  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null)
  const [paypalStatus, setPaypalStatus] = useState<PayPalConnectStatus | null>(null)
  const [braintreeStatus, setBraintreeStatus] = useState<BraintreeConnectStatus | null>(null)
  const [errors, setErrors] = useState<FinancialValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  // Load pricing configuration and subscription info on component mount
  useEffect(() => {
    loadFinancialSettings()
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
          basePrice: responseData.basePrice ?? pricingConfig.basePrice,
          extraDayPrice: responseData.extraDayPrice ?? pricingConfig.extraDayPrice,
          lateFee: responseData.lateFee ?? pricingConfig.lateFee,
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


      // PUT with the agency in the query (the route has no POST: saving
      // prices here used to fail with a 405)
      const response = await fetch(`/api/agency/financial-settings?agencyId=${agency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePrice: pricingConfig.basePrice, extraDayPrice: pricingConfig.extraDayPrice }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save pricing configuration')
      }

      setSavedMessage('Prices saved. New bookings use them right away.')
      onSuccess?.()
    } catch (error) {
      console.error('Error saving pricing configuration:', error)
      setSavedMessage(null)
      setErrors({ pricingConfig: { basePrice: [error instanceof Error ? error.message : 'Failed to save pricing configuration'] } })
      onError?.(error instanceof Error ? error.message : 'Failed to save pricing configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-surface-sunken rounded-card h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {show === 'payments' && <PaymentProcessorsCard 
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
      />}

      {show === 'pricing' && <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Prices
          </CardTitle>
          <CardDescription>
            Your rental prices. Cancellation, late and damage fees are under Booking policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="base-price">Rental price</Label>
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
                <p className="text-fine text-danger">{errors.pricingConfig.basePrice[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-day-price">Each extra day</Label>
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
                <p className="text-fine text-danger">{errors.pricingConfig.extraDayPrice[0]}</p>
              )}
            </div>

          </div>

          {/* Preview */}
          <div className="bg-surface-sunken shadow-raised rounded-card p-4">
            <h4 className="text-fine font-medium text-fg mb-2">What customers see</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-fine">
              <div>
                <span className="text-fg-muted">Standard rental:</span>
                <span className="font-medium ml-2">${pricingConfig.basePrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-fg-muted">Each extra day:</span>
                <span className="font-medium ml-2">+${pricingConfig.extraDayPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {savedMessage && <p className="text-fine text-positive">{savedMessage}</p>}
            <Button onClick={handleSavePricing} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving…' : 'Save prices'}
            </Button>
          </div>
        </CardContent>
      </Card>}
    </div>
  )
}