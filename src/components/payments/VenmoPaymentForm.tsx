'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Monitor,
  QrCode
} from 'lucide-react'
import { getBraintreeClientToken, processVenmoPayment } from '@/features/payments/braintree-actions'

// Braintree client types
declare global {
  interface Window {
    braintree?: any
  }
}

interface VenmoPaymentFormProps {
  amount: number
  description?: string
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

interface BraintreeClientConfig {
  clientToken: string
  environment: 'sandbox' | 'production'
}

export function VenmoPaymentForm({ 
  amount, 
  description = 'YardCard Elite payment',
  onSuccess, 
  onError,
  disabled = false 
}: VenmoPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [braintreeConfig, setBraintreeConfig] = useState<BraintreeClientConfig | null>(null)
  const [venmoInstance, setVenmoInstance] = useState<any>(null)
  const [deviceData, setDeviceData] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const venmoButtonRef = useRef<HTMLDivElement>(null)

  // Check if running on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      setIsMobile(/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()))
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load Braintree SDK and initialize
  useEffect(() => {
    const loadBraintreeSDK = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load Braintree SDK script if not already loaded
        if (!window.braintree) {
          const script = document.createElement('script')
          script.src = 'https://js.braintreegateway.com/web/3.129.0/js/client.min.js'
          script.async = true
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load Braintree client SDK'))
            document.head.appendChild(script)
          })

          // Load Venmo component
          const venmoScript = document.createElement('script')
          venmoScript.src = 'https://js.braintreegateway.com/web/3.129.0/js/venmo.min.js'
          venmoScript.async = true
          
          await new Promise<void>((resolve, reject) => {
            venmoScript.onload = () => resolve()
            venmoScript.onerror = () => reject(new Error('Failed to load Braintree Venmo SDK'))
            document.head.appendChild(venmoScript)
          })

          // Load data collector for device fingerprinting
          const dataScript = document.createElement('script')
          dataScript.src = 'https://js.braintreegateway.com/web/3.129.0/js/data-collector.min.js'
          dataScript.async = true
          
          await new Promise<void>((resolve, reject) => {
            dataScript.onload = () => resolve()
            dataScript.onerror = () => reject(new Error('Failed to load Braintree data collector'))
            document.head.appendChild(dataScript)
          })
        }

        // Get client token from server
        console.log('🏦 Getting Braintree client token...')
        const tokenResult = await getBraintreeClientToken()
        
        if (!tokenResult.success) {
          throw new Error(tokenResult.error)
        }

        setBraintreeConfig({
          clientToken: tokenResult.clientToken,
          environment: tokenResult.environment
        })

        console.log('✅ Braintree SDK loaded successfully')
      } catch (error) {
        console.error('❌ Error loading Braintree SDK:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize payment system')
      } finally {
        setIsLoading(false)
      }
    }

    loadBraintreeSDK()
  }, [])

  // Initialize Braintree client and Venmo when config is ready
  useEffect(() => {
    if (!braintreeConfig || !window.braintree) return

    const initializeBraintreeClient = async () => {
      try {
        console.log('🏦 Initializing Braintree client...')
        
        // Create Braintree client
        const client = await window.braintree.client.create({
          authorization: braintreeConfig.clientToken
        })

        // Initialize data collector
        const dataCollector = await window.braintree.dataCollector.create({
          client: client,
          paypal: true
        })
        
        setDeviceData(dataCollector.deviceData || '')

        // Initialize Venmo
        const venmo = await window.braintree.venmo.create({
          client: client,
          allowNewBrowserTab: !isMobile, // Allow new tab for desktop
          allowWebLogin: true, // Allow web login fallback
          allowDesktop: true, // Enable desktop QR codes
          paymentMethodUsage: 'multi_use', // Allow saving payment methods
          profileId: undefined // Use merchant's default business profile
        })

        setVenmoInstance(venmo)
        console.log('✅ Braintree Venmo initialized successfully')

      } catch (error) {
        console.error('❌ Error initializing Braintree client:', error)
        setError('Failed to initialize Venmo payment system')
      }
    }

    initializeBraintreeClient()
  }, [braintreeConfig, isMobile])

  const handleVenmoPayment = async () => {
    if (!venmoInstance || isProcessing || disabled) return

    try {
      setIsProcessing(true)
      setError(null)
      console.log('💳 Starting Venmo payment flow...')

      // Check if Venmo is available
      if (!venmoInstance.isBrowserSupported()) {
        throw new Error('Venmo is not supported in this browser')
      }

      // Tokenize Venmo payment method
      console.log('🔐 Tokenizing Venmo payment...')
      const payload = await venmoInstance.tokenize({
        amount: amount,
        currency: 'USD',
        intent: 'sale',
        displayName: 'YardCard Elite'
      })

      console.log('✅ Venmo tokenization successful')

      // Process payment on server
      console.log('💳 Processing payment on server...')
      const result = await processVenmoPayment(
        payload.nonce,
        amount,
        deviceData || undefined
      )

      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed')
      }

      console.log('✅ Venmo payment successful:', result.transactionId)
      onSuccess(result.transactionId)

    } catch (error) {
      console.error('❌ Venmo payment failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-sm border-0">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Initializing Venmo payment system...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#3D95CE]" />
          Pay with Venmo
        </CardTitle>
        <CardDescription>
          Quick and secure payment using your Venmo account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Amount */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-lg font-semibold">${amount.toFixed(2)}</span>
          </div>
          {description && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Description:</span>
              <span className="text-sm text-gray-900">{description}</span>
            </div>
          )}
        </div>

        {/* Device Detection */}
        <div className="flex items-center gap-2">
          {isMobile ? (
            <Monitor className="w-4 h-4 text-gray-400" />
          ) : (
            <QrCode className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">
            {isMobile 
              ? 'Mobile device detected - direct Venmo app integration' 
              : 'Desktop detected - QR code or web login available'
            }
          </span>
        </div>

        {/* Environment Badge */}
        <div className="flex justify-center">
          <Badge variant={braintreeConfig?.environment === 'production' ? 'default' : 'secondary'}>
            {braintreeConfig?.environment === 'production' ? 'Live' : 'Sandbox'} Mode
          </Badge>
        </div>

        {/* Venmo Payment Button */}
        <Button
          onClick={handleVenmoPayment}
          disabled={!venmoInstance || isProcessing || disabled}
          className="w-full bg-[#3D95CE] hover:bg-[#2E7BA6] text-white py-3"
          size="lg"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 mr-2" />
              Pay ${amount.toFixed(2)} with Venmo
            </>
          )}
        </Button>

        {/* Venmo Button Container (for Braintree's native button if needed) */}
        <div ref={venmoButtonRef} className="hidden" />

        {/* Payment Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Venmo payments are available for US customers only</p>
          <p>• Requires Venmo mobile app or web login access</p>
          <p>• Desktop payments work through QR codes or web interface</p>
        </div>
      </CardContent>
    </Card>
  )
}