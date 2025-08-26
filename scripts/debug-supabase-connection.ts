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

async function debugDatabase() {
  console.log('🔍 Debugging Supabase Database Connection...\n')
  
  try {
    // Test basic connection
    console.log('1. Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('agencies')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message)
      return
    }
    console.log('✅ Supabase connection successful\n')

    // Check agencies
    console.log('2. Checking agencies...')
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, slug, name')
    
    if (agenciesError) {
      console.error('❌ Failed to fetch agencies:', agenciesError.message)
    } else {
      console.log('✅ Found agencies:', agencies?.length || 0)
      agencies?.forEach(agency => {
        console.log(`   - ${agency.slug} (${agency.name}) - ID: ${agency.id}`)
      })
      console.log('')
    }

    // Check orders table structure
    console.log('3. Checking orders table structure...')
    const { data: sampleOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(3)
    
    if (ordersError) {
      console.error('❌ Failed to fetch orders:', ordersError.message)
    } else {
      console.log('✅ Sample orders found:', sampleOrders?.length || 0)
      if (sampleOrders && sampleOrders.length > 0) {
        console.log('   Sample order structure:')
        const sampleOrder = sampleOrders[0]
        Object.keys(sampleOrder).forEach(key => {
          console.log(`   - ${key}: ${typeof sampleOrder[key]} = ${sampleOrder[key]}`)
        })
        console.log('')
      }
    }

    // Check orders by agency
    if (agencies && agencies.length > 0) {
      const testAgency = agencies[0]
      console.log(`4. Checking orders for agency: ${testAgency.slug} (${testAgency.id})`)
      
      const { data: agencyOrders, error: agencyOrdersError } = await supabase
        .from('orders')
        .select('id, status, total, completedAt, updatedAt, createdAt')
        .eq('agencyId', testAgency.id)
      
      if (agencyOrdersError) {
        console.error('❌ Failed to fetch agency orders:', agencyOrdersError.message)
      } else {
        console.log(`✅ Found ${agencyOrders?.length || 0} orders for ${testAgency.slug}`)
        
        if (agencyOrders && agencyOrders.length > 0) {
          // Group by status
          const statusGroups = agencyOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          
          console.log('   Status breakdown:')
          Object.entries(statusGroups).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count}`)
          })
          
          // Check completed orders with revenue
          const completedOrders = agencyOrders.filter(order => order.status === 'completed')
          console.log(`   Completed orders: ${completedOrders.length}`)
          
          if (completedOrders.length > 0) {
            const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
            console.log(`   Total completed revenue: $${totalRevenue}`)
            
            // Check dates
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            
            const currentMonthCompleted = completedOrders.filter(order => {
              const orderDate = order.completedAt ? new Date(order.completedAt) : new Date(order.updatedAt)
              return orderDate >= startOfMonth
            })
            
            const last30DaysCompleted = completedOrders.filter(order => {
              const orderDate = order.completedAt ? new Date(order.completedAt) : new Date(order.updatedAt)
              return orderDate >= thirtyDaysAgo
            })
            
            console.log(`   Completed this month: ${currentMonthCompleted.length}`)
            console.log(`   Completed last 30 days: ${last30DaysCompleted.length}`)
            
            const monthlyRevenue = currentMonthCompleted.reduce((sum, order) => sum + (order.total || 0), 0)
            const thirtyDayRevenue = last30DaysCompleted.reduce((sum, order) => sum + (order.total || 0), 0)
            
            console.log(`   Monthly revenue: $${monthlyRevenue}`)
            console.log(`   30-day revenue: $${thirtyDayRevenue}`)
          }
        }
      }
    }

    console.log('\n🎉 Database debug completed!')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run the debug
debugDatabase()