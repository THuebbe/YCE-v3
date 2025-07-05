import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter (passed from middleware)
    const url = new URL(request.url)
    const userIdParam = url.searchParams.get('userId')
    
    // Also try to get from auth as fallback
    const { userId: authUserId } = await auth()
    const userId = userIdParam || authUserId
    
    console.log('🔍 API: User agency lookup', { userIdParam, authUserId, finalUserId: userId })
    
    if (!userId) {
      console.log('🔍 API: No user ID found, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simplified single query to get user with agency
    console.log('🔍 API: Fetching user and agency for:', userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true }
    })
    
    console.log('🔍 API: User query result:', user)

    const userExists = !!user
    const agency = user?.agency || null
    
    console.log('🔍 API: Final results:', { userExists, agency })

    return NextResponse.json({
      userExists,
      agency
    })
  } catch (error) {
    console.error('Error in user agency API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user agency' },
      { status: 500 }
    )
  }
}