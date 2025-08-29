import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getUserById } from '@/lib/db/supabase-client'
import { agencySettingsSchema, defaultAgencySettings } from '@/app/[agency]/settings/validation/agencySettings'

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

    // Fetch agency settings from the settings JSONB column
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, settings')
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

    // Return settings or default settings if none exist
    const settings = agency.settings || defaultAgencySettings

    return NextResponse.json({
      success: true,
      data: settings
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
    
    // Validate the settings data
    const validationResult = agencySettingsSchema.safeParse(body)
    
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

    const validatedSettings = validationResult.data

    // Update the agency settings in the settings JSONB column
    const { data, error } = await supabase
      .from('agencies')
      .update({ 
        settings: validatedSettings,
        updatedAt: new Date().toISOString()
      })
      .eq('id', agencyId)
      .select('id, settings')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update settings' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data.settings
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