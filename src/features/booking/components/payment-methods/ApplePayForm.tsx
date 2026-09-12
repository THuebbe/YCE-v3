'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Smartphone, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { AvailablePaymentMethod } from '../../types'

interface ApplePayFormProps {
  paymentMethod: AvailablePaymentMethod
  amount: number
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
  disabled?: boolean
}

export function ApplePayForm({ 
  paymentMethod, 
  amount, 
  onSuccess, 
  onError, 
  disabled = false 
}: ApplePayFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false)
  
  const processorConfig = paymentMethod.processorConfig as any

  // Check Apple Pay availability
  useEffect(() => {
    const checkApplePayAvailability = async () => {
      try {
        // Check if we're on a supported device/browser
        const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        
        // In a real implementation, you would check:
        // if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        //   setIsApplePayAvailable(true)
        // }
        
        // For now, simulate availability check
        const isAvailable = isAppleDevice && isSafari
        setIsApplePayAvailable(isAvailable)
        
        console.log('🍎 Apple Pay availability check:', {
          isAppleDevice,
          isSafari,
          isAvailable
        })
        
      } catch (error) {
        console.error('❌ Apple Pay availability check failed:', error)
        setIsApplePayAvailable(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkApplePayAvailability()
  }, [])

  const handleApplePayPayment = async () => {
    if (isProcessing || disabled || !isApplePayAvailable) return

    try {
      setIsProcessing(true)
      console.log('🍎 Starting Apple Pay payment flow...')

      // In a real implementation, you would:
      // 1. Create an Apple Pay payment request
      // 2. Present the Apple Pay sheet
      // 3. Handle the payment authorization
      // 4. Complete the payment with Stripe

      // For now, simulate the Apple Pay flow
      setTimeout(() => {
        console.log('✅ Apple Pay payment simulation complete')
        onSuccess({
          paymentId: 'apple_pay_' + Date.now(),
          paymentMethod: 'apple_pay',
          amount: amount,
          status: 'completed'
        })
        setIsProcessing(false)
      }, 1500)

    } catch (error) {
      console.error('❌ Apple Pay payment failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Apple Pay payment failed'
      onError(errorMessage)
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Checking Apple Pay availability...</span>
        </div>
      </div>
    )
  }

  if (!isApplePayAvailable) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Apple Pay is not available on this device or browser. 
            Apple Pay requires Safari on an Apple device with Touch ID, Face ID, or Apple Watch.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-gray-900" />
        <h3 className="text-h5 text-neutral-900">Apple Pay</h3>
        <Badge variant="secondary">Touch ID / Face ID</Badge>
      </div>
      
      {/* Payment Amount */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-lg font-semibold">${amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-600">Payment Method:</span>
          <span className="text-sm text-gray-900">Apple Pay</span>
        </div>
      </div>

      {/* Apple Pay Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-body-small font-medium text-gray-800 mb-1">
              Quick & Secure Payment
            </h4>
            <p className="text-body-small text-gray-700 mb-2">
              Pay quickly using Touch ID, Face ID, or your Apple Watch.
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• No need to enter card details</li>
              <li>• Biometric authentication</li>
              <li>• Your payment info stays on your device</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Apple Pay Button */}
      <Button
        onClick={handleApplePayPayment}
        disabled={isProcessing || disabled}
        className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <div className="flex items-center justify-center">
            <Smartphone className="w-5 h-5 mr-2" />
            <span className="text-lg">Pay with</span>
            <span className="ml-2 font-semibold"> Pay</span>
          </div>
        )}
      </Button>

      {/* Stripe Integration Info */}
      {processorConfig?.accountId && (
        <div className="text-xs text-gray-500 text-center">
          Processed securely through Stripe
        </div>
      )}

      {/* Development Notice - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> This is an Apple Pay simulation. 
            Full Apple Pay integration with Stripe will be completed in the next phase.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Info */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>• Requires Touch ID, Face ID, or Apple Watch</p>
        <p>• Works with cards in your Apple Wallet</p>
        <p>• Instant authorization and payment</p>
      </div>
    </div>
  )
}