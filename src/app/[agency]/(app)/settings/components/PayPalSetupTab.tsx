'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CircleDollarSign, RefreshCw, ExternalLink, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react'
import { 
  createPayPalPartnerReferral, 
  getPayPalConnectStatus, 
  refreshPayPalAccount,
  processPayPalCallback
} from '@/features/payments/paypal-actions'
import type { 
  PayPalConnectStatus 
} from '../validation/financialManagement'
import type { Agency } from '@/lib/types/agency'

interface PayPalSetupTabProps {
  agency: Agency
  paypalStatus?: PayPalConnectStatus | null
  paypalReturnSuccess?: boolean
  paypalReturnRefresh?: boolean
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function PayPalSetupTab({ 
  agency,
  paypalStatus: initialPayPalStatus,
  paypalReturnSuccess = false,
  paypalReturnRefresh = false,
  onSuccess, 
  onError 
}: PayPalSetupTabProps) {
  const [paypalStatus, setPayPalStatus] = useState<PayPalConnectStatus | null>(initialPayPalStatus || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReturningFromPayPal, setIsReturningFromPayPal] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load PayPal status on component mount
  useEffect(() => {
    if (!paypalStatus) {
      loadPayPalStatus()
    }
  }, [agency.id])

  // Handle return from PayPal onboarding flow
  useEffect(() => {
    if (paypalReturnSuccess || paypalReturnRefresh) {
      setIsReturningFromPayPal(true)
      
      // For PayPal, we need to handle the authCode/sharedId callback
      // This would typically be handled by the URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const authCode = urlParams.get('authCode')
      const sharedId = urlParams.get('sharedId')
      
      if (authCode && sharedId) {
        handlePayPalCallback(authCode, sharedId)
      } else {
        // If no callback params, just refresh status (webhook may have updated it)
        setTimeout(async () => {
          console.log('🔄 Processing PayPal return - refreshing account status...')
          await handleRefreshPayPalStatus()
          setIsReturningFromPayPal(false)
        }, 2000)
      }
    }
  }, [paypalReturnSuccess, paypalReturnRefresh])

  const loadPayPalStatus = async () => {
    try {
      console.log('🔄 Loading PayPal status in component...')
      const status = await getPayPalConnectStatus()
      console.log('📊 PayPal status received in component:', status)
      
      setPayPalStatus(status)
    } catch (error) {
      console.error('❌ Error loading PayPal status in component:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load PayPal status')
    }
  }

  const handlePayPalConnect = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const result = await createPayPalPartnerReferral()
      
      if (result.success && result.onboardingUrl) {
        // Redirect to PayPal Partner Referrals onboarding
        window.location.href = result.onboardingUrl
      } else {
        throw new Error(result.error || 'Failed to create PayPal integration')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect with PayPal'
      setLoadError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayPalCallback = async (authCode: string, sharedId: string) => {
    try {
      console.log('🔄 Processing PayPal callback...')
      const result = await processPayPalCallback(authCode, sharedId)
      
      if (result.success && result.status) {
        setPayPalStatus(result.status)
        setIsReturningFromPayPal(false)
        onSuccess?.()
      } else {
        throw new Error(result.error || 'Failed to process PayPal connection')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PayPal callback'
      setLoadError(errorMessage)
      onError?.(errorMessage)
      setIsReturningFromPayPal(false)
    }
  }

  const handleRefreshPayPalStatus = async () => {
    try {
      console.log('🔄 Manual refresh triggered for PayPal...')
      setIsRefreshing(true)
      setLoadError(null)
      const result = await refreshPayPalAccount()
      
      if (result.success && result.status) {
        console.log('✅ PayPal refresh successful')
        setPayPalStatus(result.status)
        onSuccess?.()
      } else {
        console.error('❌ PayPal refresh failed:', result.error)
        throw new Error(result.error || 'Failed to refresh PayPal account status')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh PayPal account status'
      console.error('❌ Error during PayPal manual refresh:', errorMessage)
      setLoadError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = () => {
    if (paypalStatus?.hasCompletedOnboarding && paypalStatus?.paymentsReceivable) {
      return <CheckCircle className="w-5 h-5 text-positive" />
    }
    if (paypalStatus?.isConnected) {
      return <Clock className="w-5 h-5 text-caution" />
    }
    return <CircleDollarSign className="w-5 h-5 text-fg-muted" />
  }

  const getStatusText = () => {
    if (paypalStatus?.hasCompletedOnboarding && paypalStatus?.paymentsReceivable) {
      return 'Setup Complete'
    }
    if (paypalStatus?.isConnected) {
      return 'Setup In Progress'
    }
    return 'Not Connected'
  }

  const getStatusColor = () => {
    if (paypalStatus?.hasCompletedOnboarding && paypalStatus?.paymentsReceivable) {
      return 'bg-positive-soft text-positive'
    }
    if (paypalStatus?.isConnected) {
      return 'bg-caution-soft text-caution'
    }
    return 'bg-surface-sunken text-fg-muted'
  }

  return (
    <div className="space-y-6">
      {/* Processing Return State */}
      {isReturningFromPayPal && (
        <Alert className="border-notice/30 bg-notice-soft">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-action mr-3"></div>
          <AlertDescription className="text-notice">
            Processing your PayPal account connection... This may take a moment.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error State */}
      {loadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Error Loading PayPal Status</p>
              <p className="text-fine">
                {loadError.includes('Network') ? 'Network connection error. Please check your internet connection.' : 
                 loadError.includes('Unauthorized') ? 'Authentication error. Please try signing in again.' :
                 loadError.includes('PayPal account') ? 'Unable to fetch PayPal account status. This may be temporary.' :
                 loadError.includes('User not found') ? 'Account verification error. Please contact support.' :
                 loadError}
              </p>
              <Button
                onClick={handleRefreshPayPalStatus}
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

      {/* PayPal Connect Setup Card */}
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              PayPal Connect Integration
            </div>
            <div className="flex items-center gap-3">
              {paypalStatus?.isConnected && (
                <Button
                  onClick={handleRefreshPayPalStatus}
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
            Connect your PayPal business account to accept PayPal payments and Pay Later options.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!paypalStatus?.isConnected ? (
            /* Initial Setup State */
            <div className="text-center py-8">
              <CircleDollarSign className="w-12 h-12 text-fg-muted mx-auto mb-4" />
              <h4 className="mb-2 font-display text-lead font-semibold text-fg">Set up PayPal Connect</h4>
              <p className="text-fine text-fg-muted mb-6 max-w-md mx-auto">
                Accept PayPal payments, Pay Later options, and reach millions of PayPal users worldwide. 
                Fast setup with your existing PayPal business account.
              </p>
              <Button
                onClick={handlePayPalConnect}
                disabled={isLoading}
                size="lg"
                className="bg-notice hover:bg-action-hover"
              >
                {isLoading ? 'Connecting...' : 'Connect with PayPal'}
              </Button>
              
              <div className="mt-4 text-fine text-fg-muted">
                Don't have a PayPal business account? We'll help you create one during setup.
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-6">
              {/* Account Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 shadow-raised border-0">
                  <div className="text-center">
                    <div className="text-fine font-medium text-fg mb-1">PayPal Account</div>
                    <div className="text-fine text-fg-muted mb-2">
                      {paypalStatus.accountId ? `ID: ${paypalStatus.accountId.substring(0, 12)}...` : 'Connected'}
                    </div>
                    <Badge variant="outline" className="bg-notice-soft text-notice">Connected</Badge>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-raised border-0">
                  <div className="text-center">
                    <div className="text-fine font-medium text-fg mb-1">Permissions</div>
                    <div className={`text-fine mb-2 ${paypalStatus.permissionsGranted ? 'text-positive' : 'text-caution'}`}>
                      {paypalStatus.permissionsGranted ? 'Access granted' : 'Permissions pending'}
                    </div>
                    <Badge 
                      variant={paypalStatus.permissionsGranted ? 'default' : 'secondary'}
                      className={paypalStatus.permissionsGranted ? 'bg-positive' : 'bg-caution-soft text-caution'}
                    >
                      {paypalStatus.permissionsGranted ? 'Granted' : 'Pending'}
                    </Badge>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-raised border-0">
                  <div className="text-center">
                    <div className="text-fine font-medium text-fg mb-1">Accept Payments</div>
                    <div className={`text-fine mb-2 ${paypalStatus.paymentsReceivable ? 'text-positive' : 'text-caution'}`}>
                      {paypalStatus.paymentsReceivable ? 'Ready to accept payments' : 
                       paypalStatus.emailConfirmed ? 'Verification in progress' : 'Email verification required'}
                    </div>
                    <Badge 
                      variant={paypalStatus.paymentsReceivable ? 'default' : 'secondary'}
                      className={paypalStatus.paymentsReceivable ? 'bg-positive' : 'bg-caution-soft text-caution'}
                    >
                      {paypalStatus.paymentsReceivable ? 'Enabled' : 'Pending'}
                    </Badge>
                  </div>
                </Card>
              </div>
              
              {/* Additional Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-surface-sunken rounded-card">
                  <span className="text-fine text-fg">Email Verified:</span>
                  <Badge variant={paypalStatus.emailConfirmed ? 'default' : 'secondary'}>
                    {paypalStatus.emailConfirmed ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-surface-sunken rounded-card">
                  <span className="text-fine text-fg">Setup Complete:</span>
                  <Badge variant={paypalStatus.detailsSubmitted ? 'default' : 'secondary'}>
                    {paypalStatus.detailsSubmitted ? 'Yes' : 'In Progress'}
                  </Badge>
                </div>
              </div>
              
              {/* Status-specific alerts */}
              {paypalStatus.permissionsGranted && !paypalStatus.paymentsReceivable && (
                <Alert className="border-caution/30 bg-caution-soft">
                  <Clock className="h-4 w-4 text-caution" />
                  <AlertDescription className="text-caution">
                    <strong>Account Verification In Progress</strong>
                    <p className="mt-1">
                      Your PayPal account is connected and permissions are granted. PayPal is reviewing your account 
                      to enable payment processing. This typically takes 1-3 business days.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              {!paypalStatus.emailConfirmed && (
                <Alert className="border-notice/30 bg-notice-soft">
                  <Info className="h-4 w-4 text-notice" />
                  <AlertDescription className="text-notice">
                    <strong>Email Verification Required</strong>
                    <p className="mt-1">
                      Please check your email and verify your PayPal account to complete the setup process.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-center gap-3 pt-4">
                {!paypalStatus.hasCompletedOnboarding && (
                  <Button
                    onClick={handlePayPalConnect}
                    disabled={isLoading}
                    size="lg"
                    className="bg-notice hover:bg-action-hover"
                  >
                    {isLoading ? 'Connecting...' : 'Continue Setup'}
                  </Button>
                )}
                
                <Button
                  onClick={() => window.open('https://www.paypal.com/businessmanage/account/aboutBusiness', '_blank')}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage PayPal Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features & Benefits */}
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle>PayPal Connect Features</CardTitle>
          <CardDescription>
            What you get with PayPal Connect integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">PayPal & Pay Later</div>
                <div className="text-fine text-muted-foreground">
                  Accept PayPal payments and offer Pay in 4 or Pay Monthly options
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Global Reach</div>
                <div className="text-fine text-muted-foregreen">
                  Access to 400+ million active PayPal users worldwide
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Buyer Protection</div>
                <div className="text-fine text-muted-foreground">
                  PayPal's seller and buyer protection reduces chargebacks and disputes
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-fine">Easy Checkout</div>
                <div className="text-fine text-muted-foreground">
                  One-click payments for returning PayPal customers
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card className="shadow-raised border-0">
        <CardHeader>
          <CardTitle>PayPal Processing Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-fine">
              <span>PayPal Payments:</span>
              <span className="font-medium">2.9% + $0.30</span>
            </div>
            <div className="flex justify-between text-fine">
              <span>PayPal Pay Later:</span>
              <span className="font-medium">2.9% + $0.30</span>
            </div>
            <div className="flex justify-between text-fine">
              <span>International Transactions:</span>
              <span className="font-medium">4.4% + $0.30</span>
            </div>
          </div>
          <p className="text-fine text-muted-foreground mt-3">
            * Additional fees may apply for currency conversion, disputes, or premium features. 
            Visit{' '}
            <a 
              href="https://www.paypal.com/us/business/fees" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-notice hover:underline"
            >
              PayPal Business Fees
            </a>
            {' '}for full details.
          </p>
        </CardContent>
      </Card>

      {/* Troubleshooting Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> PayPal webhook delivery can sometimes be delayed in sandbox environments. 
          If your account status doesn't update automatically, try refreshing manually or contact support if issues persist.
        </AlertDescription>
      </Alert>
    </div>
  )
}