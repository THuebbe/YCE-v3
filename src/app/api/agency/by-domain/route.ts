import { NextRequest, NextResponse } from 'next/server'
import { getAgencyByDomain } from '@/lib/db/queries/agency'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 })
  }
  
  try {
    const agency = await getAgencyByDomain(domain)
    return NextResponse.json({ agency })
  } catch (error) {
    console.error('Error fetching agency by domain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}