#!/usr/bin/env node

/**
 * Add confirmationCode column to fix immediate booking flow error
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addConfirmationCodeColumn() {
  console.log('🚀 Adding confirmationCode column to orders table...\n');
  
  try {
    // First, let's check what columns currently exist
    console.log('🔍 Checking current orders table structure...');
    
    const { data: existingOrders, error: selectError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('Table structure check result:', selectError.message);
    } else {
      const columns = existingOrders && existingOrders.length > 0 
        ? Object.keys(existingOrders[0]) 
        : [];
      console.log('Current columns:', columns.join(', ') || 'Table is empty, cannot determine structure');
      
      if (columns.includes('confirmationCode')) {
        console.log('✅ confirmationCode column already exists!');
        return;
      }
    }
    
    // Try using the direct PostgreSQL approach via SQL statements
    console.log('\n🔧 Attempting to add confirmationCode column...');
    
    // We'll use a raw SQL approach since exec_sql doesn't work
    // This will require manual execution in the Supabase dashboard
    const addColumnSQL = `
-- Add confirmationCode column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "confirmationCode" TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS orders_confirmation_code_idx ON orders("confirmationCode");

-- Add comment for documentation
COMMENT ON COLUMN orders."confirmationCode" IS 'Customer-facing confirmation code for order lookup';
`;

    console.log('\n📋 SQL to run manually in Supabase dashboard:');
    console.log('=====================================');
    console.log(addColumnSQL);
    console.log('=====================================\n');
    
    console.log('⚠️  Since we cannot execute DDL directly via the JavaScript client,');
    console.log('   please run the SQL above in your Supabase dashboard:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Paste and run the SQL above');
    console.log('   4. Then test your booking flow again');
    
    // Let's also try to test if we can at least insert a record with the existing schema
    console.log('\n🧪 Testing current order insertion capability...');
    
    const testOrderData = {
      orderNumber: 'TEST-' + Date.now(),
      agencyId: 'yardcard-elite-west-branch',
      status: 'pending',
      totalAmount: 95,
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '5551234567',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select('id, orderNumber')
      .single();
    
    if (insertError) {
      console.log('❌ Test insert failed:', insertError.message);
      console.log('This shows what columns are missing or have issues.');
    } else {
      console.log('✅ Basic order insert works! Order ID:', insertTest.id);
      // Clean up test order
      await supabase.from('orders').delete().eq('id', insertTest.id);
      console.log('   (Test order cleaned up)');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

addConfirmationCodeColumn();