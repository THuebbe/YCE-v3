'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, RefreshCw, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { 
  createStripeConnectAccount, 
  getStripeConnectStatus, 
  refreshStripeAccount 
} from '@/features/payments/actions'
import type { 
  StripeConnectStatus 
} from '../validation/financialManagement'
import type { Agency } from '@/lib/types/agency'

interface StripeSetupTabProps {
  agency: Agency
  stripeStatus?: StripeConnectStatus | null
  stripeReturnSuccess?: boolean
  stripeReturnRefresh?: boolean
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function StripeSetupTab({ 
  agency,
  stripeStatus: initialStripeStatus,
  stripeReturnSuccess = false,
  stripeReturnRefresh = false,
  onSuccess, 
  onError 
}: StripeSetupTabProps) {
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(initialStripeStatus || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReturningFromStripe, setIsReturningFromStripe] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load Stripe status on component mount
  useEffect(() => {
    if (!stripeStatus) {
      loadStripeStatus()
    }
  }, [agency.id])

  // Handle return from Stripe onboarding flow
  useEffect(() => {
    if (stripeReturnSuccess || stripeReturnRefresh) {
      setIsReturningFromStripe(true)
      
      // Wait a moment for Stripe webhooks to process, then refresh status
      setTimeout(async () => {
        console.log('🔄 Processing Stripe return - refreshing account status...')
        await handleRefreshStripeStatus()
        setIsReturningFromStripe(false)
      }, 2000)
    }
  }, [stripeReturnSuccess, stripeReturnRefresh])

  const loadStripeStatus = async () => {
    try {
      console.log('🔄 Loading Stripe status in component...')
      const status = await getStripeConnectStatus()
      console.log('📊 Stripe status received in component:', status)
      
      // Transform API response to component state format
      const newStripeStatus: StripeConnectStatus = {
        accountId: status.accountId || null,
        isConnected: !!status.accountId,
        hasCompletedOnboarding: status.detailsSubmitted || false,
        chargesEnabled: status.chargesEnabled || false,
        payoutsEnabled: status.payoutsEnabled || false,
        detailsSubmitted: status.detailsSubmitted || false,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        pendingVerification: []
      }
      
      console.log('✅ Setting Stripe status in component state:', newStripeStatus)
      setStripeStatus(newStripeStatus)
    } catch (error) {
      console.error('❌ Error loading Stripe status in component:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load Stripe status')
    }
  }

  const handleStripeConnect = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
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

  const handleRefreshStripeStatus = async () => {
    try {
      console.log('🔄 Manual refresh triggered in component...')
      setIsRefreshing(true)
      setLoadError(null)
      const result = await refreshStripeAccount()
      
      if (result.success) {
        console.log('✅ Refresh successful, reloading Stripe status...')
        // Reload the Stripe status after refresh
        await loadStripeStatus()
        onSuccess?.()
      } else {
        console.error('❌ Refresh failed:', result.error)
        throw new Error(result.error || 'Failed to refresh account status')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh account status'
      console.error('❌ Error during manual refresh:', errorMessage)
      setLoadError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = () => {
    if (stripeStatus?.hasCompletedOnboarding) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    if (stripeStatus?.isConnected) {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />
    }
    return <CreditCard className="w-5 h-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (stripeStatus?.hasCompletedOnboarding) {
      return 'Setup Complete'
    }
    if (stripeStatus?.isConnected) {
      return 'Setup Pending'
    }
    return 'Not Connected'
  }

  const getStatusColor = () => {
    if (stripeStatus?.hasCompletedOnboarding) {
      return 'bg-green-100 text-green-800'
    }
    if (stripeStatus?.isConnected) {
      return 'bg-orange-100 text-orange-800'
    }
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Processing Return State */}
      {isReturningFromStripe && (
        <Alert className="border-blue-200 bg-blue-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <AlertDescription className="text-blue-800">
            Processing your Stripe account setup... This may take a moment.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error State */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Error Loading Stripe Status</p>
              <p className="text-sm">
                {loadError.includes('Network') ? 'Network connection error. Please check your internet connection.' : 
                 loadError.includes('Unauthorized') ? 'Authentication error. Please try signing in again.' :
                 loadError.includes('Stripe account') ? 'Unable to fetch Stripe account status. This may be temporary.' :
                 loadError.includes('User not found') ? 'Account verification error. Please contact support.' :
                 loadError}
              </p>
              <Button
                onClick={handleRefreshStripeStatus}
                disabled={isRefreshing}
                variant="secondary"
                size="sm"
                className="mt-2"
              >
                {isRefreshing ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stripe Connect Setup Card */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              Stripe Connect Integration
            </div>
            <div className="flex items-center gap-3">
              {stripeStatus?.isConnected && (
                <Button
                  onClick={handleRefreshStripeStatus}
                  disabled={isRefreshing || isLoading}
                  variant="secondary"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
                </Button>
              )}
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to accept credit cards, digital wallets, and bank transfers directly.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!stripeStatus?.isConnected ? (
            /* Initial Setup State */
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Set up Stripe Connect</h4>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Accept payments directly to your bank account with full control over payouts and timing. 
                Stripe handles PCI compliance and fraud protection.
              </p>
              <Button
                onClick={handleStripeConnect}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Connecting...' : 'Connect with Stripe'}
              </Button>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-6">
              {/* Account Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 shadow-sm border-0">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">Stripe Account</div>
                    <div className="text-xs text-gray-600">
                      ID: {stripeStatus.accountId?.substring(0, 12)}...
                    </div>
                    <Badge variant="secondary" className="mt-2">Connected</Badge>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-sm border-0">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">Charge Payments</div>
                    <div className={`text-xs mb-2 ${stripeStatus.chargesEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                      {stripeStatus.chargesEnabled ? 'Ready to accept payments' : 
                       stripeStatus.hasCompletedOnboarding ? 'Additional verification needed' : 'Verification required'}
                    </div>
                    <Badge 
                      variant={stripeStatus.chargesEnabled ? 'default' : 'secondary'}
                      className={stripeStatus.chargesEnabled ? 'bg-green-500' : 'bg-orange-500'}
                    >
                      {stripeStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-sm border-0">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">Receive Payouts</div>
                    <div className={`text-xs mb-2 ${stripeStatus.payoutsEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                      {stripeStatus.payoutsEnabled ? 'Bank account connected' : 
                       stripeStatus.hasCompletedOnboarding ? 'Additional verification needed' : 'Bank setup required'}
                    </div>
                    <Badge 
                      variant={stripeStatus.payoutsEnabled ? 'default' : 'secondary'}
                      className={stripeStatus.payoutsEnabled ? 'bg-green-500' : 'bg-orange-500'}
                    >
                      {stripeStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </Card>
              </div>
              
              {/* Status-specific alerts */}
              {stripeStatus.hasCompletedOnboarding && (!stripeStatus.chargesEnabled || !stripeStatus.payoutsEnabled) && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Setup Complete - Additional Verification Needed</strong>
                    <p className="mt-1">
                      Your Stripe account onboarding is complete, but some features require additional verification. 
                      This is normal and typically resolved by Stripe within 1-7 business days.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-center gap-3 pt-4">
                {!stripeStatus.hasCompletedOnboarding && (
                  <Button
                    onClick={handleStripeConnect}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? 'Connecting...' : 'Continue Setup'}
                  </Button>
                )}
                
                {stripeStatus.hasCompletedOnboarding && (
                  <Button
                    onClick={() => window.open(`https://dashboard.stripe.com/connect/accounts/${stripeStatus.accountId}`, '_blank')}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Manage Stripe Account
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features & Benefits */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle>Stripe Connect Features</CardTitle>
          <CardDescription>
            What you get with Stripe Connect integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Direct Bank Deposits</div>
                <div className="text-xs text-muted-foreground">
                  Payments go directly to your bank account, typically within 2 business days
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Multiple Payment Methods</div>
                <div className="text-xs text-muted-foreground">
                  Accept credit cards, debit cards, Apple Pay, Google Pay, and more
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Advanced Security</div>
                <div className="text-xs text-muted-foreground">
                  PCI DSS compliant with advanced fraud detection and dispute management
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">Detailed Reporting</div>
                <div className="text-xs text-muted-foreground">
                  Comprehensive transaction reports and analytics through Stripe Dashboard
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle>Stripe Processing Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Credit & Debit Cards:</span>
              <span className="font-medium">2.9% + $0.30</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Digital Wallets (Apple Pay, Google Pay):</span>
              <span className="font-medium">2.9% + $0.30</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>ACH Direct Debit:</span>
              <span className="font-medium">0.8% (capped at $5)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Additional fees may apply for international cards, disputes, or premium features. 
            Visit{' '}
            <a 
              href="https://stripe.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              stripe.com/pricing
            </a>
            {' '}for full details.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}