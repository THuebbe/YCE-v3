import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getUserById } from '@/lib/db/supabase-client'
import { operatingHoursSchema } from '@/app/[agency]/settings/validation/agencySettings'

// Default operating hours for new agencies
const defaultOperatingHours = {
  monday: { open: '09:00', close: '17:00', isOpen: true },
  tuesday: { open: '09:00', close: '17:00', isOpen: true },
  wednesday: { open: '09:00', close: '17:00', isOpen: true },
  thursday: { open: '09:00', close: '17:00', isOpen: true },
  friday: { open: '09:00', close: '17:00', isOpen: true },
  saturday: { open: '10:00', close: '16:00', isOpen: true },
  sunday: { open: '12:00', close: '16:00', isOpen: false },
  timeZone: 'America/New_York'
}

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
    if (!user || user.agencyId !== agencyId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Fetch operating hours from the operating_hours JSONB column
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, operating_hours')
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

    // Return operating hours or default operating hours if none exist
    const operatingHours = agency.operating_hours || defaultOperatingHours

    return NextResponse.json({
      success: true,
      data: operatingHours
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
    if (!user || user.agencyId !== agencyId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate only the operating hours data
    const validationResult = operatingHoursSchema.safeParse(body)
    
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

    const validatedOperatingHours = validationResult.data

    // Update the agency operating hours in the operating_hours JSONB column
    const { data, error } = await supabase
      .from('agencies')
      .update({ 
        operating_hours: validatedOperatingHours,
        updatedAt: new Date().toISOString()
      })
      .eq('id', agencyId)
      .select('id, operating_hours')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update operating hours' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data.operating_hours
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