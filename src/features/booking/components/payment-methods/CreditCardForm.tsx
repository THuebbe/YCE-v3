'use client'

import React, { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, AlertTriangle } from 'lucide-react'
import { AvailablePaymentMethod } from '../../types'

interface CreditCardFormProps {
  paymentMethod: AvailablePaymentMethod
  onFieldChange: (field: string, value: string) => void
  formData: any
  errors: Record<string, string>
  disabled?: boolean
}

export function CreditCardForm({ 
  paymentMethod, 
  onFieldChange, 
  formData, 
  errors, 
  disabled = false 
}: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19)
  }

  const formatExpiryDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2, 4)
    }
    
    return digits
  }

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value)
    setCardNumber(formatted)
    onFieldChange('cardNumber', formatted.replace(/\s/g, '')) // Store without spaces
  }

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiryDate(value)
    setExpiryDate(formatted)
    onFieldChange('expiryDate', formatted)
  }

  const handleCvvChange = (value: string) => {
    // Only allow digits, max 4 characters
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setCvv(digits)
    onFieldChange('cvv', digits)
  }

  const isStripeProcessor = paymentMethod.processor === 'stripe'
  const processorName = isStripeProcessor ? 'Stripe' : 'Platform Processing'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-neutral-600" />
        <h3 className="text-h5 text-neutral-900">Card Information</h3>
        {isStripeProcessor && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Secure Stripe Processing
          </span>
        )}
      </div>
      
      {/* Card Number */}
      <div>
        <Label htmlFor="cardNumber" className="text-label text-neutral-700 mb-2 block">
          Card Number
        </Label>
        <Input
          id="cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => handleCardNumberChange(e.target.value)}
          className={`font-mono ${errors.cardNumber ? 'border-error' : ''}`}
          disabled={disabled}
        />
        {errors.cardNumber && (
          <p className="text-body-small text-error-red mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiry" className="text-label text-neutral-700 mb-2 block">
            Expiry Date
          </Label>
          <Input
            id="expiry"
            type="text"
            placeholder="MM/YY"
            value={expiryDate}
            onChange={(e) => handleExpiryChange(e.target.value)}
            className={`font-mono ${errors.expiryDate ? 'border-error' : ''}`}
            disabled={disabled}
          />
          {errors.expiryDate && (
            <p className="text-body-small text-error-red mt-1">{errors.expiryDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="cvv" className="text-label text-neutral-700 mb-2 block">
            CVV
          </Label>
          <Input
            id="cvv"
            type="text"
            placeholder="123"
            value={cvv}
            onChange={(e) => handleCvvChange(e.target.value)}
            className={`font-mono ${errors.cvv ? 'border-error' : ''}`}
            disabled={disabled}
          />
          {errors.cvv && (
            <p className="text-body-small text-error-red mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Billing ZIP */}
      <div>
        <Label htmlFor="billingZip" className="text-label text-neutral-700 mb-2 block">
          Billing ZIP Code
        </Label>
        <Input
          id="billingZip"
          type="text"
          value={formData.billingAddress?.zipCode || ''}
          onChange={(e) => onFieldChange('billingAddress.zipCode', e.target.value)}
          placeholder="12345"
          className={errors['billingAddress.zipCode'] ? 'border-error' : ''}
          disabled={disabled}
        />
        {errors['billingAddress.zipCode'] && (
          <p className="text-body-small text-error-red mt-1">{errors['billingAddress.zipCode']}</p>
        )}
      </div>

      {/* Processing Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-body-small font-medium text-blue-800 mb-1">
              {processorName}
            </h4>
            <p className="text-body-small text-blue-700">
              {isStripeProcessor 
                ? 'Your payment will be processed securely through Stripe.' 
                : 'Your payment will be processed securely through our platform.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Development Notice - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> This is a UI preview. Full payment processing integration will be completed in the next phase.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}