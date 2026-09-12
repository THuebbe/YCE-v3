'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react'
import { AvailablePaymentMethod } from '../../types'

interface PayPalFormProps {
  paymentMethod: AvailablePaymentMethod
  amount: number
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
  disabled?: boolean
}

export function PayPalForm({ 
  paymentMethod, 
  amount, 
  onSuccess, 
  onError, 
  disabled = false 
}: PayPalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const processorConfig = paymentMethod.processorConfig as any
  const isProduction = processorConfig?.environment === 'production'

  const handlePayPalPayment = async () => {
    if (isProcessing || disabled) return

    try {
      setIsProcessing(true)
      console.log('💳 Starting PayPal payment flow...')

      // In a real implementation, you would:
      // 1. Create a PayPal order on the server
      // 2. Redirect to PayPal for approval
      // 3. Handle the return flow and capture the payment

      // For now, simulate a redirect flow
      setTimeout(() => {
        console.log('✅ PayPal payment simulation complete')
        onSuccess({
          paymentId: 'paypal_' + Date.now(),
          paymentMethod: 'paypal',
          amount: amount,
          status: 'completed'
        })
        setIsProcessing(false)
      }, 2000)

    } catch (error) {
      console.error('❌ PayPal payment failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'PayPal payment failed'
      onError(errorMessage)
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-[#0070BA]" />
        <h3 className="text-h5 text-neutral-900">PayPal Payment</h3>
        <Badge variant={isProduction ? 'default' : 'secondary'}>
          {isProduction ? 'Live' : 'Sandbox'} Mode
        </Badge>
      </div>
      
      {/* Payment Amount */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-lg font-semibold">${amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-600">Payment Method:</span>
          <span className="text-sm text-gray-900">PayPal</span>
        </div>
      </div>

      {/* PayPal Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <DollarSign className="w-5 h-5 text-[#0070BA] mt-0.5" />
          <div className="flex-1">
            <h4 className="text-body-small font-medium text-blue-800 mb-1">
              Secure PayPal Payment
            </h4>
            <p className="text-body-small text-blue-700 mb-2">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Pay with your PayPal balance, bank account, or card</li>
              <li>• PayPal Buyer Protection included</li>
              <li>• No need to share your financial information</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PayPal Payment Button */}
      <Button
        onClick={handlePayPalPayment}
        disabled={isProcessing || disabled}
        className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white py-3"
        size="lg"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Processing with PayPal...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Pay ${amount.toFixed(2)} with PayPal
          </>
        )}
      </Button>

      {/* Account Info */}
      {processorConfig?.accountId && (
        <div className="text-xs text-gray-500 text-center">
          Connected PayPal Account: ••••{processorConfig.accountId.slice(-4)}
        </div>
      )}

      {/* Development Notice - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> This is a PayPal payment simulation. 
            Full PayPal SDK integration will be completed in the next phase.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Flow Info */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>• You will be redirected to PayPal to complete payment</p>
        <p>• Return to this page after successful payment</p>
        <p>• PayPal supports multiple payment sources</p>
      </div>
    </div>
  )
}