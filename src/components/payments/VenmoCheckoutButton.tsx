'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  RefreshCw, 
  AlertTriangle,
  QrCode,
  Monitor
} from 'lucide-react'
import { useBraintree } from './BraintreeVenmoProvider'
import { processVenmoPayment } from '@/features/payments/braintree-actions'

interface VenmoCheckoutButtonProps {
  amount: number
  description?: string
  onSuccess: (transactionId: string, paymentDetails: any) => void
  onError: (error: string) => void
  onCancel?: () => void
  disabled?: boolean
  className?: string
}

export function VenmoCheckoutButton({
  amount,
  description = 'YardCard Elite payment',
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  className = ''
}: VenmoCheckoutButtonProps) {
  const { client, environment, isLoaded, isError, error: providerError, deviceData } = useBraintree()
  const [venmoInstance, setVenmoInstance] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      setIsMobile(/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()))
    }
    
    checkMobile()
  }, [])

  // Initialize Venmo instance when client is ready
  useEffect(() => {
    if (!client || !isLoaded || isError) return

    const initializeVenmo = async () => {
      try {
        setIsInitializing(true)
        setError(null)
        
        console.log('💳 Initializing Venmo component...')
        
        const venmo = await window.braintree.venmo.create({
          client: client,
          allowNewBrowserTab: !isMobile,
          allowWebLogin: true,
          allowDesktop: true,
          paymentMethodUsage: 'multi_use',
          profileId: undefined
        })

        // Check if Venmo is available
        if (!venmo.isBrowserSupported()) {
          throw new Error('Venmo is not supported in this browser')
        }

        setVenmoInstance(venmo)
        console.log('✅ Venmo component initialized successfully')
        
      } catch (error) {
        console.error('❌ Error initializing Venmo:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize Venmo')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeVenmo()
  }, [client, isLoaded, isError, isMobile])

  const handleVenmoPayment = async () => {
    if (!venmoInstance || isProcessing || disabled) return

    try {
      setIsProcessing(true)
      setError(null)
      console.log('💳 Starting Venmo payment...', { amount, description })

      // Tokenize payment with Venmo
      const tokenizePayload = await venmoInstance.tokenize({
        amount: amount.toFixed(2),
        currency: 'USD',
        intent: 'sale',
        displayName: 'YardCard Elite'
      })

      console.log('🔐 Venmo tokenization successful')

      // Process payment on server
      const result = await processVenmoPayment(
        tokenizePayload.nonce,
        amount,
        deviceData ?? undefined
      )

      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed')
      }

      console.log('✅ Venmo payment completed successfully')
      onSuccess(result.transactionId || '', {
        paymentMethodType: 'venmo',
        amount: amount,
        description: description,
        transactionDetails: result.transaction
      })

    } catch (error) {
      console.error('❌ Venmo payment failed:', error)
      
      // Handle user cancellation
      if (error instanceof Error && error.message.includes('VENMO_CANCELED')) {
        onCancel?.()
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      setError(errorMessage)
      onError(errorMessage)
      
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle provider errors
  if (isError || providerError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {providerError || 'Venmo payment system unavailable'}
        </AlertDescription>
      </Alert>
    )
  }

  // Show loading state
  if (!isLoaded || isInitializing) {
    return (
      <Button 
        disabled 
        className={`w-full bg-gray-400 ${className}`}
        size="lg"
      >
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        {isInitializing ? 'Initializing Venmo...' : 'Loading Payment System...'}
      </Button>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-2">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => setError(null)}
          variant="secondary"
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Environment Badge */}
      {environment && (
        <div className="flex justify-center">
          <Badge variant={environment === 'production' ? 'default' : 'secondary'}>
            {environment === 'production' ? 'Live' : 'Sandbox'} Mode
          </Badge>
        </div>
      )}

      {/* Device Info */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        {isMobile ? (
          <>
            <Smartphone className="w-4 h-4" />
            Mobile - Direct Venmo app
          </>
        ) : (
          <>
            <Monitor className="w-4 h-4" />
            Desktop - QR code or web login
          </>
        )}
      </div>

      {/* Payment Button */}
      <Button
        onClick={handleVenmoPayment}
        disabled={!venmoInstance || isProcessing || disabled}
        className={`w-full bg-[#3D95CE] hover:bg-[#2E7BA6] text-white ${className}`}
        size="lg"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Processing ${amount.toFixed(2)}...
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 mr-2" />
            Pay ${amount.toFixed(2)} with Venmo
          </>
        )}
      </Button>

      {/* Payment Info */}
      <div className="text-xs text-gray-500 text-center">
        Secure payment powered by PayPal Braintree
      </div>
    </div>
  )
}