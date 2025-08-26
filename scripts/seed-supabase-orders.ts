#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY')
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomDate(daysFromNow: number, variationDays: number = 0): Date {
  const baseDate = new Date()
  const daysOffset = daysFromNow + randomBetween(-variationDays, variationDays)
  return new Date(baseDate.getTime() + (daysOffset * 24 * 60 * 60 * 1000))
}

// Sample data
const CUSTOMER_NAMES = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
  'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez', 'Christopher Lee', 'Amanda White',
  'Matthew Thompson', 'Jessica Garcia', 'Daniel Rodriguez', 'Ashley Lopez', 'James Miller'
]

const DELIVERY_TIMES = [
  'Morning (8-12pm)', 'Afternoon (12-5pm)', 'Evening (5-8pm)', 'Flexible'
]

const MESSAGES = [
  'Happy Birthday!', 'Congratulations!', 'Happy Anniversary!', 'Good Luck!', 
  'Welcome Home!', 'Happy Graduation!', 'Best Wishes!', 'Happy Retirement!'
]

async function createOrdersForAgency(agencyId: string, agencySlug: string) {
  console.log(`🎯 Creating orders for agency: ${agencySlug} (${agencyId})`)
  
  const orderCount = randomBetween(25, 40)
  let createdOrders = 0
  
  for (let i = 0; i < orderCount; i++) {
    const orderNumber = `${agencySlug.toUpperCase()}-${String(Date.now() + i).slice(-6)}`
    const internalNumber = `${agencyId}-${orderNumber}`
    
    // Create realistic date distribution
    let eventDate: Date
    let status: string
    let createdAt: Date
    let completedAt: Date | null = null
    
    const rand = Math.random()
    
    if (rand < 0.4) {
      // 40% completed orders (past 60 days, with focus on recent)
      eventDate = randomDate(-randomBetween(1, 60), 5)
      status = 'completed'
      createdAt = new Date(eventDate.getTime() - randomBetween(1, 14) * 24 * 60 * 60 * 1000)
      completedAt = eventDate
    } else if (rand < 0.65) {
      // 25% current/active orders  
      eventDate = randomDate(-randomBetween(-5, 10), 3)
      status = randomFromArray(['pending', 'processing', 'deployed'])
      createdAt = new Date(eventDate.getTime() - randomBetween(1, 7) * 24 * 60 * 60 * 1000)
    } else {
      // 35% future orders
      eventDate = randomDate(randomBetween(1, 45), 5)
      status = randomFromArray(['pending', 'processing'])
      createdAt = randomDate(-randomBetween(1, 15), 2)
    }
    
    const customerName = randomFromArray(CUSTOMER_NAMES)
    const customerEmail = `${customerName.replace(' ', '.').toLowerCase()}@test.com`
    
    // Realistic pricing
    const subtotal = randomBetween(75, 350)
    const extraDays = randomBetween(0, 3)
    const extraDayFee = extraDays * randomBetween(10, 15)
    const lateFee = status === 'completed' && Math.random() < 0.1 ? randomBetween(25, 50) : 0
    const total = subtotal + extraDayFee + lateFee
    
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          agencyId,
          orderNumber,
          internalNumber,
          customerName,
          customerEmail,
          customerPhone: `(${randomBetween(200, 999)}) ${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`,
          eventDate: eventDate.toISOString(),
          deliveryTime: randomFromArray(DELIVERY_TIMES),
          deliveryNotes: Math.random() < 0.3 ? 'Please call upon arrival' : null,
          message: Math.random() < 0.8 ? `${randomFromArray(MESSAGES)} ${customerName.split(' ')[0]}!` : null,
          status,
          subtotal,
          extraDays,
          extraDayFee,
          lateFee,
          total,
          paymentStatus: status === 'completed' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
          eventAddress: `${randomBetween(100, 9999)} ${randomFromArray(['Main', 'Oak', 'Elm', 'Park', 'Cedar'])} ${randomFromArray(['St', 'Ave', 'Dr', 'Ln'])}, Test City, ST 12345`,
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
          completedAt: completedAt?.toISOString() || null,
          cancelledAt: status === 'cancelled' ? createdAt.toISOString() : null
        })
        .select()
        .single()
      
      if (orderError) {
        console.error(`❌ Error creating order ${orderNumber}:`, orderError.message)
        continue
      }
      
      createdOrders++
      
      // Log progress every 10 orders
      if (createdOrders % 10 === 0) {
        console.log(`   ✅ Created ${createdOrders}/${orderCount} orders`)
      }
      
    } catch (error) {
      console.error(`💥 Exception creating order ${orderNumber}:`, error)
      continue
    }
  }
  
  console.log(`✅ Successfully created ${createdOrders} orders for ${agencySlug}`)
  return createdOrders
}

async function seedDatabase() {
  console.log('🌱 Starting Supabase order seeding...\n')
  
  try {
    // Get all agencies
    console.log('🔍 Fetching agencies...')
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, slug, name')
    
    if (agenciesError) {
      console.error('❌ Failed to fetch agencies:', agenciesError.message)
      return
    }
    
    if (!agencies || agencies.length === 0) {
      console.log('⚠️  No agencies found. Please create an agency first.')
      return
    }
    
    console.log(`✅ Found ${agencies.length} agencies:`)
    agencies.forEach(agency => {
      console.log(`   - ${agency.slug} (${agency.name})`)
    })
    console.log('')
    
    // Create orders for each agency
    let totalOrdersCreated = 0
    for (const agency of agencies) {
      const ordersCreated = await createOrdersForAgency(agency.id, agency.slug)
      totalOrdersCreated += ordersCreated
      console.log('')
    }
    
    console.log(`🎉 Seeding completed! Created ${totalOrdersCreated} total orders.`)
    console.log('📊 Dashboard metrics should now show data for:')
    console.log('   - Open Orders: Current pending/processing/deployed orders')
    console.log('   - Monthly Revenue: Revenue from completed orders this month')
    console.log('   - Last 30 Days: Revenue from completed orders in last 30 days')
    console.log('   - Completed This Month: Count of orders completed this month')
    
  } catch (error) {
    console.error('💥 Unexpected error during seeding:', error)
  }
}

// Run the seeding
seedDatabase()