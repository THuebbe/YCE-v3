import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getUserById } from '@/lib/db/supabase-client'
import { z } from 'zod'

// Blackout date schema
const blackoutDateSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }, {
    message: 'Date cannot be in the past'
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long'),
  reason: z
    .string()
    .max(500, 'Reason too long')
    .optional(),
  type: z.enum(['holiday', 'maintenance', 'vacation', 'special_event']),
})

const blackoutDatesArraySchema = z.array(blackoutDateSchema).default([])

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

    // Fetch blackout dates from the blackout_dates JSONB column
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, blackout_dates')
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

    // Return blackout dates or empty array if none exist
    const blackoutDates = agency.blackout_dates || []

    return NextResponse.json({
      success: true,
      data: blackoutDates
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
    
    // Validate the blackout dates array
    const validationResult = blackoutDatesArraySchema.safeParse(body)
    
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

    const validatedBlackoutDates = validationResult.data

    // Update the agency blackout dates in the blackout_dates JSONB column
    const { data, error } = await supabase
      .from('agencies')
      .update({ 
        blackout_dates: validatedBlackoutDates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', agencyId)
      .select('id, blackout_dates')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update blackout dates' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data.blackout_dates
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