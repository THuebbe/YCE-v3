'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { createStripeConnectAccount, getStripeConnectStatus } from '@/features/payments/actions';
import { Header } from '@/shared/components/layout/Header';

interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  accountStatus?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingUrl?: string;
}

export default function PaymentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnectStripe = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await createStripeConnectAccount();
      
      if (result.success && result.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = result.onboardingUrl;
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to create Stripe Connect account'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStripeStatus = async () => {
    try {
      const status = await getStripeConnectStatus();
      setStripeStatus(status);
    } catch (error) {
      console.error('Failed to fetch Stripe status:', error);
    }
  };

  const getStatusBadge = () => {
    if (!stripeStatus?.hasAccount) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }

    if (stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
      return <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>;
    }

    if (stripeStatus.detailsSubmitted) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">
        <AlertCircle className="w-3 h-3 mr-1" />
        Under Review
      </Badge>;
    }

    return <Badge variant="destructive">
      <AlertCircle className="w-3 h-3 mr-1" />
      Incomplete
    </Badge>;
  };

  return (
    <div className="min-h-screen bg-background-light">
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
          <p className="text-gray-600">
            Connect your Stripe account to accept payments from your clients.
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Stripe Connect
                </CardTitle>
                <CardDescription>
                  Connect your Stripe account to start accepting payments
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!stripeStatus?.hasAccount ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Connect with Stripe</h3>
                  <p className="text-gray-600 mb-6">
                    Link your Stripe account to start accepting payments from your clients.
                    You&apos;ll be redirected to Stripe&apos;s secure onboarding process.
                  </p>
                </div>
                
                <Button 
                  onClick={handleConnectStripe}
                  disabled={isLoading}
                  className="bg-[#635bff] hover:bg-[#5a54e6] text-white font-semibold px-8 py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Connect with</span>
                      <strong>Stripe</strong>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stripeStatus.chargesEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">Charges</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stripeStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stripeStatus.payoutsEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">Payouts</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stripeStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                {stripeStatus.onboardingUrl && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Complete your account setup to start accepting payments
                    </p>
                    <Button 
                      onClick={() => window.location.href = stripeStatus.onboardingUrl!}
                      className="bg-[#635bff] hover:bg-[#5a54e6] text-white"
                    >
                      Complete Setup
                    </Button>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={refreshStripeStatus}
                    size="sm"
                  >
                    Refresh Status
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}