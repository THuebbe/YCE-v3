'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, RefreshCw, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { 
  createStripeConnectAccount, 
  createStripeDashboardLink,
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
  // Shown under the setup buttons, where the tap happened (the load banner is off-screen on phones)
  const [connectError, setConnectError] = useState<string | null>(null)

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

  // 'express' = we set Stripe up for them ($3/booking); 'standard' = their own Stripe
  const handleStripeConnect = async (type: 'express' | 'standard' = 'express') => {
    try {
      setIsLoading(true)
      setConnectError(null)
      const result = await createStripeConnectAccount(type)
      
      if (result.success && result.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = result.onboardingUrl
      } else {
        throw new Error(result.error || 'Failed to create Stripe account')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect with Stripe'
      setConnectError(errorMessage)
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
      return <CheckCircle className="w-5 h-5 text-positive" />
    }
    if (stripeStatus?.isConnected) {
      return <AlertTriangle className="w-5 h-5 text-caution" />
    }
    return <CreditCard className="w-5 h-5 text-fg-muted" />
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
      return 'bg-positive-soft text-positive'
    }
    if (stripeStatus?.isConnected) {
      return 'bg-caution-soft text-caution'
    }
    return 'bg-surface-sunken text-fg-muted'
  }

  return (
    <div className="space-y-6">
      {/* Processing Return State */}
      {isReturningFromStripe && (
        <Alert className="border-notice/30 bg-notice-soft">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-action mr-3"></div>
          <AlertDescription className="text-notice">
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
              <p className="text-fine">
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
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
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
              <CreditCard className="w-12 h-12 text-fg-muted mx-auto mb-4" />
              <h4 className="mb-2 font-display text-lead font-semibold text-fg">Accept card payments</h4>
              <p className="text-fine text-fg-muted mb-6 max-w-md mx-auto">
                Customer payments go straight to your bank account through Stripe.
                Stripe handles card security and fraud protection.
              </p>
              <div className="flex flex-col gap-4 max-w-md mx-auto text-left">
                <div className="rounded-card border border-line p-4">
                  <div className="font-medium text-fg">Set it up for me</div>
                  <p className="text-fine text-fg-muted mt-1 mb-3">
                    A short Stripe signup (your ID and bank account), about 5 minutes.
                    YardCard Elite keeps $3 per booking; it shows on your Stripe statement.
                  </p>
                  <Button onClick={() => handleStripeConnect('express')} disabled={isLoading} className="w-full">
                    {isLoading ? 'Connecting...' : 'Set up payments'}
                  </Button>
                </div>
                <div className="rounded-card border border-line p-4">
                  <div className="font-medium text-fg">I already have a Stripe account</div>
                  <p className="text-fine text-fg-muted mt-1 mb-3">
                    Connect your own Stripe account. No per-booking fee from YardCard Elite.
                  </p>
                  <Button onClick={() => handleStripeConnect('standard')} disabled={isLoading} variant="secondary" className="w-full">
                    {isLoading ? 'Connecting...' : 'Connect my Stripe account'}
                  </Button>
                </div>
                {connectError && (
                  <Alert variant="destructive" role="alert">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Stripe setup didn&apos;t start</p>
                      <p className="text-fine mt-1">{connectError}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-6">
              {/* Account Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 shadow-raised border-0">
                  <div className="text-center">
                    <div className="text-fine font-medium text-fg mb-1">Stripe Account</div>
                    <div className="text-fine text-fg-muted">
                      ID: {stripeStatus.accountId?.substring(0, 12)}...
                    </div>
                    <Badge variant="secondary" className="mt-2">Connected</Badge>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-raised border-0">
                  <div className="text-center">
                    <div className="text-fine font-medium text-fg mb-1">Charge Payments</div>
                    <div className={`text-fine mb-2 ${stripeStatus.chargesEnabled ? 'text-positive' : 'text-caution'}`}>
                      {stripeStatus.chargesEnabled ? 'Ready to accept payments' : 
                       stripeStatus.hasCompletedOnboarding ? 'Additional verification needed' : 'Verification required'}
                    </div>
                    <Badge 
                      variant={stripeStatus.chargesEnabled ? 'default' : 'secondary'}
                      className={stripeStatus.chargesEnabled ? 'bg-positive' : 'bg-caution-soft text-caution'}
                    >
                      {stripeStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-raised border-0">
                  <div className="text-center">
                    <div className="text-fine font-medium text-fg mb-1">Receive Payouts</div>
                    <div className={`text-fine mb-2 ${stripeStatus.payoutsEnabled ? 'text-positive' : 'text-caution'}`}>
                      {stripeStatus.payoutsEnabled ? 'Bank account connected' : 
                       stripeStatus.hasCompletedOnboarding ? 'Additional verification needed' : 'Bank setup required'}
                    </div>
                    <Badge 
                      variant={stripeStatus.payoutsEnabled ? 'default' : 'secondary'}
                      className={stripeStatus.payoutsEnabled ? 'bg-positive' : 'bg-caution-soft text-caution'}
                    >
                      {stripeStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </Card>
              </div>
              
              {/* Status-specific alerts */}
              {stripeStatus.hasCompletedOnboarding && (!stripeStatus.chargesEnabled || !stripeStatus.payoutsEnabled) && (
                <Alert className="border-notice/30 bg-notice-soft">
                  <Info className="h-4 w-4 text-notice" />
                  <AlertDescription className="text-notice">
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
                {(!stripeStatus.hasCompletedOnboarding || !stripeStatus.chargesEnabled) && (
                  <Button
                    onClick={() => handleStripeConnect()}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? 'Connecting...'
                      : stripeStatus.hasCompletedOnboarding ? 'Finish Stripe verification' : 'Continue Setup'}
                  </Button>
                )}
                
                {stripeStatus.hasCompletedOnboarding && (
                  <Button
                    onClick={async () => {
                      const result = await createStripeDashboardLink()
                      if (result.success && result.url) window.location.href = result.url
                      else setLoadError(result.error || 'Could not open your Stripe dashboard')
                    }}
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
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle>Stripe Connect Features</CardTitle>
          <CardDescription>
            What you get with Stripe Connect integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Direct Bank Deposits</div>
                <div className="text-fine text-muted-foreground">
                  Payments go directly to your bank account, typically within 2 business days
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Multiple Payment Methods</div>
                <div className="text-fine text-muted-foreground">
                  Accept credit cards, debit cards, Apple Pay, Google Pay, and more
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Advanced Security</div>
                <div className="text-fine text-muted-foreground">
                  PCI DSS compliant with advanced fraud detection and dispute management
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Detailed Reporting</div>
                <div className="text-fine text-muted-foreground">
                  Comprehensive transaction reports and analytics through Stripe Dashboard
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle>Stripe Processing Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-fine">
              <span>Credit & Debit Cards:</span>
              <span className="font-medium">2.9% + $0.30</span>
            </div>
            <div className="flex justify-between text-fine">
              <span>Digital Wallets (Apple Pay, Google Pay):</span>
              <span className="font-medium">2.9% + $0.30</span>
            </div>
            <div className="flex justify-between text-fine">
              <span>ACH Direct Debit:</span>
              <span className="font-medium">0.8% (capped at $5)</span>
            </div>
          </div>
          <p className="text-fine text-muted-foreground mt-3">
            * Additional fees may apply for international cards, disputes, or premium features. 
            Visit{' '}
            <a 
              href="https://stripe.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-notice hover:underline"
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