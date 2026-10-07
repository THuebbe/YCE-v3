import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getUserById } from '@/lib/db/supabase-client'
import { bookingRulesSchema } from '@/app/[agency]/settings/validation/agencySettings'
import { parseBookingRules } from '@/features/booking/booking-rules'

// One schema for the settings form and this route; the booking wizard reads
// the same shape via parseBookingRules (features/booking/booking-rules.ts)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'Agency ID is required' }, { status: 400 })
    }

    // Verify user has access to this agency
    const user = await getUserById(userId)
    if (!user || user.agency_id !== agencyId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Fetch booking rules from the booking_rules JSONB column
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, booking_rules')
      .eq('id', agencyId)
      .single()

    if (agencyError) {
      console.error('Database error:', agencyError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database error occurred' 
      }, { status: 500 })
    }

    if (!agency) {
      return NextResponse.json({ 
        success: false, 
        error: 'Agency not found' 
      }, { status: 404 })
    }

    // Stored rules normalized to the current shape (defaults fill gaps)
    const bookingRules = parseBookingRules(agency.booking_rules)

    return NextResponse.json({
      success: true,
      data: bookingRules
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'Agency ID is required' }, { status: 400 })
    }

    // Verify user has access to this agency
    const user = await getUserById(userId)
    if (!user || user.agency_id !== agencyId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate the booking rules data
    const validationResult = bookingRulesSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))

      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      }, { status: 400 })
    }

    const validatedBookingRules = validationResult.data

    // Update the agency booking rules in the booking_rules JSONB column
    const { data, error } = await supabase
      .from('agencies')
      .update({ 
        booking_rules: validatedBookingRules,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId)
      .select('id, booking_rules')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update booking rules' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data.booking_rules
    })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}