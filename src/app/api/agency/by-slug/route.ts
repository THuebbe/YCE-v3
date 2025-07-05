import { NextRequest, NextResponse } from 'next/server'
import { getAgencyBySlug } from '@/lib/db/queries/agency'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  
  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 })
  }
  
  try {
    const agency = await getAgencyBySlug(slug)
    return NextResponse.json({ agency })
  } catch (error) {
    console.error('Error fetching agency by slug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}