import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    console.log('🔍 Payment Methods API: GET request received')
    
    const resolvedParams = await params
    const { agencyId } = resolvedParams

    if (!agencyId) {
      console.log('❌ Payment Methods API: No agencyId provided')
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Payment Methods API: Request for agency: ${agencyId}`)

    // Get agency payment processor configuration
    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        id,
        slug,
        name,
        stripe_account_id,
        stripe_account_status,
        stripe_charges_enabled,
        stripe_payouts_enabled,
        stripe_details_submitted,
        braintree_environment,
        braintree_merchant_id,
        braintree_public_key,
        braintree_account_status,
        venmo_enabled,
        venmo_allow_desktop,
        venmo_allow_web_login,
        venmo_payment_method_usage,
        paypal_account_id,
        paypal_account_status,
        paypal_details_submitted,
        paypal_payments_receivable,
        paypal_email_confirmed
      `)
      .eq('id', agencyId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('❌ Payment Methods API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve agency payment configuration' },
        { status: 500 }
      )
    }

    if (!agency) {
      console.log('❌ Payment Methods API: Agency not found')
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Determine available payment methods based on agency configuration
    const availablePaymentMethods = []

    // Credit Card - Always available
    // Use Stripe if connected and ready, otherwise fallback to platform processing
    const hasStripeConnected = !!(
      agency.stripe_account_id && 
      agency.stripe_details_submitted && 
      agency.stripe_charges_enabled
    )

    availablePaymentMethods.push({
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: 'CreditCard',
      processor: hasStripeConnected ? 'stripe' : 'platform',
      processorConfig: hasStripeConnected ? {
        accountId: agency.stripe_account_id,
        environment: 'production' // Assuming production for connected accounts
      } : {
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }
    })

    // Venmo - Available if Braintree is set up with Venmo enabled
    const hasVenmoEnabled = !!(
      agency.braintree_merchant_id &&
      agency.braintree_account_status === 'active' &&
      agency.venmo_enabled
    )

    if (hasVenmoEnabled) {
      availablePaymentMethods.push({
        id: 'venmo',
        name: 'Venmo',
        description: 'Pay with Venmo',
        icon: 'Smartphone',
        processor: 'braintree',
        processorConfig: {
          environment: agency.braintree_environment || 'sandbox',
          merchantId: agency.braintree_merchant_id,
          publicKey: agency.braintree_public_key,
          allowDesktop: agency.venmo_allow_desktop !== false,
          allowWebLogin: agency.venmo_allow_web_login !== false,
          paymentMethodUsage: agency.venmo_payment_method_usage || 'multi_use'
        }
      })
    }

    // PayPal - Available if PayPal Partner is connected and ready
    const hasPayPalConnected = !!(
      agency.paypal_account_id &&
      agency.paypal_details_submitted &&
      agency.paypal_payments_receivable &&
      agency.paypal_email_confirmed
    )

    if (hasPayPalConnected) {
      availablePaymentMethods.push({
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'DollarSign',
        processor: 'paypal',
        processorConfig: {
          accountId: agency.paypal_account_id,
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
        }
      })
    }

    // Apple Pay - Available if Stripe is connected (Stripe supports Apple Pay)
    if (hasStripeConnected) {
      availablePaymentMethods.push({
        id: 'apple_pay',
        name: 'Apple Pay',
        description: 'Pay with Touch ID or Face ID',
        icon: 'Smartphone',
        processor: 'stripe',
        processorConfig: {
          accountId: agency.stripe_account_id,
          environment: 'production'
        }
      })
    }

    const response = {
      success: true,
      data: {
        agencyId: agency.id,
        agencyName: agency.name,
        agencySlug: agency.slug,
        availablePaymentMethods,
        defaultPaymentMethod: availablePaymentMethods[0]?.id || 'card',
        processorSummary: {
          stripe: {
            connected: hasStripeConnected,
            accountId: agency.stripe_account_id || null
          },
          braintree: {
            connected: !!agency.braintree_merchant_id,
            venmoEnabled: hasVenmoEnabled,
            environment: agency.braintree_environment || null
          },
          paypal: {
            connected: hasPayPalConnected,
            accountId: agency.paypal_account_id || null
          }
        }
      }
    }

    console.log('✅ Payment Methods API: Available payment methods determined:', {
      agencyId: agency.id,
      methodsCount: availablePaymentMethods.length,
      methods: availablePaymentMethods.map(m => ({ id: m.id, processor: m.processor }))
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Payment Methods API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}