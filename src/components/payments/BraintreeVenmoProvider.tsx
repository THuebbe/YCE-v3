'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getBraintreeClientToken } from '@/features/payments/braintree-actions'

// Braintree client types
declare global {
  interface Window {
    braintree?: any
  }
}

interface BraintreeContextValue {
  client: any | null
  clientToken: string | null
  environment: 'sandbox' | 'production' | null
  isLoaded: boolean
  isError: boolean
  error: string | null
  deviceData: string | null
}

const BraintreeContext = createContext<BraintreeContextValue>({
  client: null,
  clientToken: null,
  environment: null,
  isLoaded: false,
  isError: false,
  error: null,
  deviceData: null
})

export const useBraintree = () => {
  const context = useContext(BraintreeContext)
  if (!context) {
    throw new Error('useBraintree must be used within a BraintreeVenmoProvider')
  }
  return context
}

interface BraintreeVenmoProviderProps {
  children: ReactNode
}

export function BraintreeVenmoProvider({ children }: BraintreeVenmoProviderProps) {
  const [client, setClient] = useState<any>(null)
  const [clientToken, setClientToken] = useState<string | null>(null)
  const [environment, setEnvironment] = useState<'sandbox' | 'production' | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceData, setDeviceData] = useState<string | null>(null)

  useEffect(() => {
    const initializeBraintree = async () => {
      try {
        setIsLoaded(false)
        setIsError(false)
        setError(null)

        // Load Braintree SDK scripts if not already loaded
        if (!window.braintree) {
          console.log('📦 Loading Braintree SDK...')
          
          // Load main client SDK
          await loadScript('https://js.braintreegateway.com/web/3.129.0/js/client.min.js')
          
          // Load Venmo component
          await loadScript('https://js.braintreegateway.com/web/3.129.0/js/venmo.min.js')
          
          // Load data collector
          await loadScript('https://js.braintreegateway.com/web/3.129.0/js/data-collector.min.js')
          
          console.log('✅ Braintree SDK loaded successfully')
        }

        // Get client token from server
        console.log('🔑 Fetching Braintree client token...')
        const tokenResult = await getBraintreeClientToken()
        
        if (!tokenResult.success) {
          throw new Error(tokenResult.error)
        }

        setClientToken(tokenResult.clientToken)
        setEnvironment(tokenResult.environment || 'sandbox')

        // Create Braintree client
        console.log('🏦 Creating Braintree client...')
        const braintreeClient = await window.braintree.client.create({
          authorization: tokenResult.clientToken
        })

        setClient(braintreeClient)

        // Initialize data collector for device fingerprinting
        try {
          const dataCollector = await window.braintree.dataCollector.create({
            client: braintreeClient,
            paypal: true
          })
          
          setDeviceData(dataCollector.deviceData)
          console.log('🔍 Device data collector initialized')
        } catch (dataError) {
          console.warn('⚠️ Data collector initialization failed (non-critical):', dataError)
          // Device data is optional, continue without it
        }

        console.log('✅ Braintree client initialized successfully')
        setIsLoaded(true)

      } catch (error) {
        console.error('❌ Error initializing Braintree:', error)
        setIsError(true)
        setError(error instanceof Error ? error.message : 'Failed to initialize Braintree')
      }
    }

    initializeBraintree()
  }, [])

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`)
      if (existingScript) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  const contextValue: BraintreeContextValue = {
    client,
    clientToken,
    environment,
    isLoaded,
    isError,
    error,
    deviceData
  }

  return (
    <BraintreeContext.Provider value={contextValue}>
      {children}
    </BraintreeContext.Provider>
  )
}