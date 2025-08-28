import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase, getUserById } from '@/lib/db/supabase-client'
import { agencyProfileSchema } from '../../../[agency]/settings/validation/agencyProfile'

// GET handler - Retrieve agency profile data
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Agency Profile API: GET request received')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log('❌ Agency Profile API: No authentication found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get agency ID from query parameters
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    if (!agencyId) {
      console.log('❌ Agency Profile API: No agencyId provided')
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Agency Profile API: Request for agency: ${agencyId}`)

    // Validate user has access to this agency
    const user = await getUserById(userId)
    if (!user || user.agencyId !== agencyId) {
      console.log('❌ Agency Profile API: User not authorized for this agency')
      return NextResponse.json(
        { success: false, error: 'User not authorized for this agency' },
        { status: 403 }
      )
    }

    // Check if user has permission to view agency profile
    const allowedRoles = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN']
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ Agency Profile API: Insufficient permissions. User role: ${user.role}`)
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to access agency profile' },
        { status: 403 }
      )
    }

    console.log(`🔍 Agency Profile API: Fetching profile for agency: ${agencyId}`)

    // Get agency profile data from database
    const { data: agency, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .eq('isActive', true)
      .single()

    if (error) {
      console.error('❌ Agency Profile API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve agency profile' },
        { status: 500 }
      )
    }

    if (!agency) {
      console.log('❌ Agency Profile API: Agency not found')
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      )
    }

    // Generate booking URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yardcard-elite.com'
    const bookingUrl = `${baseUrl}/${agency.slug}/booking`

    // Map database fields to API response format
    const profileData = {
      id: agency.id,
      agencyName: agency.name || '',
      agencyWebsite: agency.domain || '',
      contactEmail: agency.email || '',
      phone: agency.phone || '',
      address: typeof agency.address === 'object' && agency.address ? {
        street: agency.address.street || '',
        city: agency.address.city || '',
        state: agency.address.state || '',
        postalCode: agency.address.postalCode || '',
        country: agency.address.country || ''
      } : {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      agencySlug: agency.slug || '',
      bookingUrl: bookingUrl
    }

    console.log('✅ Agency Profile API: Profile data retrieved successfully')
    return NextResponse.json({
      success: true,
      data: profileData
    })

  } catch (error) {
    console.error('❌ Agency Profile API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT handler - Update agency profile data
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Agency Profile API: PUT request received')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log('❌ Agency Profile API: No authentication found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get agency ID from query parameters
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')
    if (!agencyId) {
      console.log('❌ Agency Profile API: No agencyId provided')
      return NextResponse.json(
        { success: false, error: 'Agency ID is required' },
        { status: 400 }
      )
    }

    // Validate user has access to this agency
    const user = await getUserById(userId)
    if (!user || user.agencyId !== agencyId) {
      console.log('❌ Agency Profile API: User not authorized for this agency')
      return NextResponse.json(
        { success: false, error: 'User not authorized for this agency' },
        { status: 403 }
      )
    }

    // Check if user has permission to update agency profile
    const allowedRoles = ['ADMIN', 'SUPER_USER', 'SUPER_ADMIN']
    if (!allowedRoles.includes(user.role)) {
      console.log(`❌ Agency Profile API: Insufficient permissions. User role: ${user.role}`)
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to update agency profile' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = agencyProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('❌ Agency Profile API: Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data provided',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { agencyName, agencyWebsite, contactEmail, phone, address } = validationResult.data

    console.log(`🔍 Agency Profile API: Updating profile for agency: ${agencyId}`)

    // Update agency in database
    const { error } = await supabase
      .from('agencies')
      .update({
        name: agencyName,
        domain: agencyWebsite,
        email: contactEmail,
        phone: phone,
        address: address,
        updatedAt: new Date().toISOString()
      })
      .eq('id', agencyId)
      .eq('isActive', true)

    if (error) {
      console.error('❌ Agency Profile API: Database update error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update agency profile' },
        { status: 500 }
      )
    }

    console.log('✅ Agency Profile API: Profile updated successfully')
    return NextResponse.json({
      success: true,
      message: 'Agency profile updated successfully'
    })

  } catch (error) {
    console.error('❌ Agency Profile API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}