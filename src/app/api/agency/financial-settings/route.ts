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
    if (!user || user.agency_id !== agencyId) {
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

    // Get agency financial data from database (only existing fields)
    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        id,
        pricing_config,
        stripe_account_id,
        stripe_account_status,
        stripe_charges_enabled,
        stripe_payouts_enabled,
        stripe_details_submitted
      `)
      .eq('id', agencyId)
      .eq('is_active', true)
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
    const hasStripeAccount = !!agency.stripe_account_id
    // PayPal integration will be handled by separate PayPal actions
    // For now, assume no PayPal account until properly connected
    const hasPayPalAccount = false
    
    // Payment method priority: Stripe > YCE Processing (PayPal handled separately)
    let paymentMethod = 'yce_processing'
    if (hasStripeAccount && agency.stripe_details_submitted) {
      paymentMethod = 'stripe_connect'
    }

    // Extract pricing data from JSONB pricingConfig field
    const pricingConfig = agency.pricing_config || {}

    // Map database fields to API response format
    const financialData = {
      paymentMethod,
      basePrice: pricingConfig.basePrice || 50,
      extraDayPrice: pricingConfig.extraDayPrice || 10,
      lateFee: pricingConfig.lateFee || 25,
      stripeStatus: hasStripeAccount ? {
        accountId: agency.stripe_account_id,
        accountStatus: agency.stripe_account_status,
        chargesEnabled: agency.stripe_charges_enabled,
        payoutsEnabled: agency.stripe_payouts_enabled,
        detailsSubmitted: agency.stripe_details_submitted,
        // Add missing properties expected by frontend
        isConnected: true, // If we have a stripeAccountId, it's connected
        hasCompletedOnboarding: agency.stripe_details_submitted && 
                               agency.stripe_charges_enabled && 
                               agency.stripe_payouts_enabled,
        // Add missing arrays for requirements (empty for now since we don't track these)
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        pendingVerification: []
      } : {
        accountId: null,
        accountStatus: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        isConnected: false,
        hasCompletedOnboarding: false,
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        pendingVerification: []
      },
      paypalStatus: {
        accountId: null,
        accountStatus: 'not_connected',
        isConnected: false,
        hasCompletedOnboarding: false,
        paymentsReceivable: false,
        emailConfirmed: false,
        detailsSubmitted: false
      },
      // Braintree/Venmo status - placeholder for future implementation
      braintreeStatus: {
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
    if (!user || user.agency_id !== agencyId) {
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
        pricing_config: pricingConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId)
      .eq('is_active', true)

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