'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CircleDollarSign, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Settings,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react'
import { 
  initializeBraintreeMerchant,
  getBraintreeStatus,
  updateVenmoSettings,
  refreshBraintreeAccount
} from '@/features/payments/braintree-actions'
import type { Agency } from '@/lib/types/agency'

// Braintree/Venmo status type
interface BraintreeConnectStatus {
  merchantId: string | null
  isConnected: boolean
  environment: 'sandbox' | 'production'
  venmoEnabled: boolean
  accountStatus: string
  allowDesktop: boolean
  allowWebLogin: boolean
  paymentMethodUsage: 'single_use' | 'multi_use'
  lastSyncAt: string | null
  integrationData?: any
  publicKey?: string
}

interface VenmoSetupTabProps {
  agency: Agency
  braintreeReturnSuccess?: boolean
  braintreeReturnRefresh?: boolean
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function VenmoSetupTab({ 
  agency,
  braintreeReturnSuccess = false,
  braintreeReturnRefresh = false,
  onSuccess, 
  onError 
}: VenmoSetupTabProps) {
  const [braintreeStatus, setBraintreeStatus] = useState<BraintreeConnectStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load Braintree status on component mount
  useEffect(() => {
    loadBraintreeStatus()
  }, [agency.id])

  // Handle return from Braintree onboarding or configuration
  useEffect(() => {
    if (braintreeReturnSuccess || braintreeReturnRefresh) {
      setTimeout(async () => {
        console.log('🔄 Processing Braintree return - refreshing account status...')
        await handleRefreshBraintreeStatus()
      }, 2000)
    }
  }, [braintreeReturnSuccess, braintreeReturnRefresh])

  const loadBraintreeStatus = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      console.log('🔄 Loading Braintree status in component...')
      
      const status = await getBraintreeStatus()
      console.log('📊 Braintree status received in component:', status)
      
      setBraintreeStatus({
        ...status,
        environment: (status.environment as 'sandbox' | 'production') || 'sandbox',
        paymentMethodUsage: (status.paymentMethodUsage as 'single_use' | 'multi_use') || 'single_use'
      })
    } catch (error) {
      console.error('❌ Error loading Braintree status in component:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load Braintree status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitializeBraintree = async () => {
    try {
      setIsInitializing(true)
      setLoadError(null)
      console.log('🏦 Initializing Braintree integration...')
      
      const result = await initializeBraintreeMerchant()
      
      if (result.success) {
        console.log('✅ Braintree initialization successful')
        await loadBraintreeStatus() // Reload status
        onSuccess?.()
      } else {
        console.error('❌ Braintree initialization failed:', result.error)
        onError?.(result.error || 'Failed to initialize Braintree integration')
      }
    } catch (error) {
      console.error('❌ Error initializing Braintree:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to initialize Braintree')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleRefreshBraintreeStatus = async () => {
    try {
      setIsRefreshing(true)
      console.log('🔄 Refreshing Braintree status...')
      
      const result = await refreshBraintreeAccount()
      
      if (result.success && result.status) {
        setBraintreeStatus({
          ...result.status,
          environment: (result.status.environment as 'sandbox' | 'production') || 'sandbox',
          paymentMethodUsage: (result.status.paymentMethodUsage as 'single_use' | 'multi_use') || 'single_use'
        })
        onSuccess?.()
      } else {
        onError?.(result.error || 'Failed to refresh Braintree status')
      }
    } catch (error) {
      console.error('❌ Error refreshing Braintree status:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to refresh status')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUpdateSettings = async (newSettings: Partial<{
    venmoEnabled: boolean
    allowDesktop: boolean
    allowWebLogin: boolean
    paymentMethodUsage: 'single_use' | 'multi_use'
  }>) => {
    try {
      setIsUpdatingSettings(true)
      console.log('⚙️ Updating Venmo settings:', newSettings)
      
      const result = await updateVenmoSettings(newSettings)
      
      if (result.success) {
        // Update local state
        setBraintreeStatus(prev => prev ? { ...prev, ...newSettings } : null)
        onSuccess?.()
      } else {
        onError?.(result.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('❌ Error updating Venmo settings:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const getStatusIcon = () => {
    if (!braintreeStatus?.isConnected) {
      return <CircleDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    }
    if (braintreeStatus.venmoEnabled) {
      return <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
    }
    return <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
  }

  const getStatusBadge = () => {
    if (!braintreeStatus?.isConnected) {
      return <Badge variant="secondary">Not Connected</Badge>
    }
    if (braintreeStatus.accountStatus === 'active' && braintreeStatus.venmoEnabled) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>
    }
    if (braintreeStatus.accountStatus === 'active') {
      return <Badge variant="secondary" className="bg-orange-500">Connected - Venmo Disabled</Badge>
    }
    return <Badge variant="secondary" className="bg-red-500 text-white">Account Issue</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading Venmo integration status...</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load Venmo integration: {loadError}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Braintree/Venmo Status */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5" />
              Venmo via Braintree
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefreshBraintreeStatus}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Accept Venmo payments through PayPal's Braintree platform. Available for US-based businesses only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!braintreeStatus?.isConnected ? (
            /* Not Connected State */
            <div className="text-center py-8">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Braintree for Venmo Payments
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Braintree by PayPal enables Venmo payments on mobile devices and desktop browsers. 
                Get started with sandbox mode for testing.
              </p>
              
              <Button
                onClick={handleInitializeBraintree}
                disabled={isInitializing}
                className="bg-[#3D95CE] hover:bg-[#2E7BA6] text-white"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <CircleDollarSign className="w-4 h-4 mr-2" />
                    Initialize Braintree & Venmo
                  </>
                )}
              </Button>

              <div className="mt-6 text-sm text-gray-500">
                <p className="mb-2"><strong>Requirements:</strong></p>
                <ul className="text-left inline-block space-y-1">
                  <li>• US-based business entity required</li>
                  <li>• Braintree merchant account needed</li>
                  <li>• Venmo works on mobile and desktop browsers</li>
                  <li>• Sandbox mode available for testing</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 shadow-sm border-0">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-sm">Braintree Connected</p>
                    <p className="text-xs text-gray-600">Environment: {braintreeStatus.environment}</p>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-sm border-0">
                  <div className="text-center">
                    {braintreeStatus.venmoEnabled ? (
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    )}
                    <p className="font-medium text-sm">
                      Venmo {braintreeStatus.venmoEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className="text-xs text-gray-600">Payment acceptance</p>
                  </div>
                </Card>
                
                <Card className="p-4 shadow-sm border-0">
                  <div className="text-center">
                    <Info className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-medium text-sm">Account Status</p>
                    <p className="text-xs text-gray-600 capitalize">{braintreeStatus.accountStatus}</p>
                  </div>
                </Card>
              </div>

              {/* Venmo Settings */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Venmo Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure how Venmo payments work for your customers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable/Disable Venmo */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Enable Venmo Payments</Label>
                      <p className="text-sm text-gray-600">
                        Allow customers to pay using their Venmo account
                      </p>
                    </div>
                    <Switch
                      checked={braintreeStatus.venmoEnabled}
                      onCheckedChange={(enabled) => handleUpdateSettings({ venmoEnabled: enabled })}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  {braintreeStatus.venmoEnabled && (
                    <>
                      {/* Desktop Support */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5 text-gray-400" />
                          <div>
                            <Label className="text-base font-medium">Desktop QR Codes</Label>
                            <p className="text-sm text-gray-600">
                              Show QR codes for desktop users to scan with mobile
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={braintreeStatus.allowDesktop}
                          onCheckedChange={(allow) => handleUpdateSettings({ allowDesktop: allow })}
                          disabled={isUpdatingSettings}
                        />
                      </div>

                      {/* Web Login Support */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-gray-400" />
                          <div>
                            <Label className="text-base font-medium">Web Login Fallback</Label>
                            <p className="text-sm text-gray-600">
                              Allow web login when Venmo app isn't installed
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={braintreeStatus.allowWebLogin}
                          onCheckedChange={(allow) => handleUpdateSettings({ allowWebLogin: allow })}
                          disabled={isUpdatingSettings}
                        />
                      </div>

                      {/* Payment Method Usage */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-gray-400" />
                          <div>
                            <Label className="text-base font-medium">Payment Authorization Type</Label>
                            <p className="text-sm text-gray-600">
                              Choose how customer payment methods are stored
                            </p>
                          </div>
                        </div>
                        <Select
                          value={braintreeStatus.paymentMethodUsage}
                          onValueChange={(value: string) => 
                            handleUpdateSettings({ paymentMethodUsage: value as 'single_use' | 'multi_use' })
                          }
                        >
                          <SelectTrigger disabled={isUpdatingSettings}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_use">
                              Single Use - One-time payments only
                            </SelectItem>
                            <SelectItem value="multi_use">
                              Multi Use - Enable saving for future payments
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Integration Info */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Integration Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Merchant ID</Label>
                      <p className="text-gray-600 font-mono">{braintreeStatus.merchantId}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Environment</Label>
                      <p className="text-gray-600 capitalize">{braintreeStatus.environment}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Last Sync</Label>
                      <p className="text-gray-600">
                        {braintreeStatus.lastSyncAt 
                          ? new Date(braintreeStatus.lastSyncAt).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">SDK Version</Label>
                      <p className="text-gray-600">3.129.0 (JavaScript)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Venmo Requirements:</strong> Venmo payments are only available for US-based businesses and customers. 
          Customers must have the Venmo mobile app installed or access to Venmo's web interface. 
          Desktop payments work through QR codes or web login.
        </AlertDescription>
      </Alert>
    </div>
  )
}