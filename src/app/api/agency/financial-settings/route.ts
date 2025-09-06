import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getUserById } from '@/lib/db/supabase-client'
import { pricingConfigSchema } from '../../../[agency]/settings/validation/financialManagement'

// GET handler - Retrieve agency financial settings
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Financial Settings API: GET request received')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log('❌ Financial Settings API: No authentication found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get agency ID from query parameters
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    if (!agencyId) {
      console.log('❌ Financial Settings API: No agencyId provided')
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Financial Settings API: Request for agency: ${agencyId}`)

    // Validate user has access to this agency
    const user = await getUserById(userId)
    if (!user || user.agencyId !== agencyId) {
      console.log('❌ Financial Settings API: User not authorized for this agency')
      return NextResponse.json(
        { success: false, error: 'User not authorized for this agency' },
        { status: 403 }
      )
    }

    // Check if user has permission to view financial settings
    const allowedRoles = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN']
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ Financial Settings API: Insufficient permissions. User role: ${user.role}`)
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to access financial settings' },
        { status: 403 }
      )
    }

    console.log(`🔍 Financial Settings API: Fetching financial settings for agency: ${agencyId}`)

    // Get agency financial data from database (including Braintree fields)
    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        id,
        pricingConfig,
        stripeAccountId,
        stripeAccountStatus,
        stripeChargesEnabled,
        stripePayoutsEnabled,
        stripeDetailsSubmitted,
        braintree_environment,
        braintree_merchant_id,
        braintree_public_key,
        braintree_account_status,
        venmo_enabled,
        venmo_allow_desktop,
        venmo_allow_web_login,
        venmo_payment_method_usage,
        braintree_last_sync_at,
        braintree_integration_data
      `)
      .eq('id', agencyId)
      .eq('isActive', true)
      .single()

    if (error) {
      console.error('❌ Financial Settings API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve financial settings' },
        { status: 500 }
      )
    }

    if (!agency) {
      console.log('❌ Financial Settings API: Agency not found')
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Determine payment method based on connected processors
    const hasStripeAccount = !!agency.stripeAccountId
    const hasBraintreeAccount = !!agency.braintree_merchant_id
    
    // Payment method priority: Stripe > Braintree/Venmo > YCE Processing
    let paymentMethod = 'yce_processing'
    if (hasStripeAccount && agency.stripeDetailsSubmitted) {
      paymentMethod = 'stripe_connect'
    } else if (hasBraintreeAccount && agency.venmo_enabled) {
      paymentMethod = 'venmo_connect'
    }

    // Extract pricing data from JSONB pricingConfig field
    const pricingConfig = agency.pricingConfig || {}

    // Map database fields to API response format
    const financialData = {
      paymentMethod,
      basePrice: pricingConfig.basePrice || 50,
      extraDayPrice: pricingConfig.extraDayPrice || 10,
      lateFee: pricingConfig.lateFee || 25,
      stripeStatus: hasStripeAccount ? {
        accountId: agency.stripeAccountId,
        accountStatus: agency.stripeAccountStatus,
        chargesEnabled: agency.stripeChargesEnabled,
        payoutsEnabled: agency.stripePayoutsEnabled,
        detailsSubmitted: agency.stripeDetailsSubmitted
      } : null,
      braintreeStatus: hasBraintreeAccount ? {
        merchantId: agency.braintree_merchant_id,
        isConnected: true,
        environment: agency.braintree_environment || 'sandbox',
        venmoEnabled: agency.venmo_enabled || false,
        accountStatus: agency.braintree_account_status || 'active',
        allowDesktop: agency.venmo_allow_desktop || true,
        allowWebLogin: agency.venmo_allow_web_login || true,
        paymentMethodUsage: agency.venmo_payment_method_usage || 'multi_use',
        lastSyncAt: agency.braintree_last_sync_at,
        integrationData: agency.braintree_integration_data ? JSON.parse(agency.braintree_integration_data) : null,
        publicKey: agency.braintree_public_key
      } : {
        merchantId: null,
        isConnected: false,
        environment: 'sandbox',
        venmoEnabled: false,
        accountStatus: 'not_connected',
        allowDesktop: true,
        allowWebLogin: true,
        paymentMethodUsage: 'multi_use',
        lastSyncAt: null,
        integrationData: null,
        publicKey: null
      }
    }

    console.log('✅ Financial Settings API: Financial settings retrieved successfully')
    return NextResponse.json({
      success: true,
      data: financialData
    })

  } catch (error) {
    console.error('❌ Financial Settings API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT handler - Update agency financial settings
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Financial Settings API: PUT request received')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log('❌ Financial Settings API: No authentication found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get agency ID from query parameters
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    if (!agencyId) {
      console.log('❌ Financial Settings API: No agencyId provided')
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    // Validate user has access to this agency
    const user = await getUserById(userId)
    if (!user || user.agencyId !== agencyId) {
      console.log('❌ Financial Settings API: User not authorized for this agency')
      return NextResponse.json(
        { success: false, error: 'User not authorized for this agency' },
        { status: 403 }
      )
    }

    // Check if user has permission to update financial settings
    const allowedRoles = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN']
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ Financial Settings API: Insufficient permissions. User role: ${user.role}`)
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to update financial settings' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = pricingConfigSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('❌ Financial Settings API: Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data provided',
          details: validationResult.error.errors.map(error => ({
            field: `pricingConfig.${error.path.join('.')}`,
            message: error.message
          }))
        },
        { status: 400 }
      )
    }

    const { 
      basePrice, 
      extraDayPrice, 
      lateFee
    } = validationResult.data

    console.log(`🔍 Financial Settings API: Updating financial settings for agency: ${agencyId}`)

    // Create pricing config object for JSONB storage
    const pricingConfig = {
      basePrice,
      extraDayPrice,
      lateFee
    }

    // Update agency financial settings in database
    const { error } = await supabase
      .from('agencies')
      .update({
        pricingConfig,
        updatedAt: new Date().toISOString()
      })
      .eq('id', agencyId)
      .eq('isActive', true)

    if (error) {
      console.error('❌ Financial Settings API: Database update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update financial settings' },
        { status: 500 }
      )
    }

    console.log('✅ Financial Settings API: Financial settings updated successfully')
    return NextResponse.json({
      success: true,
      message: 'Financial settings updated successfully'
    })

  } catch (error) {
    console.error('❌ Financial Settings API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}