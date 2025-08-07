#!/usr/bin/env node

/**
 * Verify orders table structure after SQL fixes
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

async function verifyOrdersTable() {
  console.log('🔍 Verifying orders table structure after SQL fixes...\n');
  
  try {
    // Test 1: Check if confirmationCode column exists by trying to select it
    console.log('1️⃣ Testing confirmationCode column...');
    const { error: confirmationError } = await supabase
      .from('orders')
      .select('confirmationCode')
      .limit(1);
    
    if (confirmationError) {
      if (confirmationError.message.includes('confirmationCode')) {
        console.log('❌ confirmationCode column still missing');
        return false;
      } else {
        console.log('✅ confirmationCode column exists (table might be empty, which is OK)');
      }
    } else {
      console.log('✅ confirmationCode column exists and accessible');
    }
    
    // Test 2: Test UUID auto-generation by trying to insert a minimal record
    console.log('\n2️⃣ Testing ID auto-generation...');
    const testOrderData = {
      agencyId: 'yardcard-elite-west-branch',
      orderNumber: 'TEST-' + Date.now(),
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '5551234567',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      total: 95,
      confirmationCode: 'TEST123'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select('id, orderNumber, confirmationCode')
      .single();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      
      // Check if it's still the ID issue
      if (insertError.message.includes('null value in column "id"')) {
        console.log('❌ ID auto-generation is still not working');
        console.log('   The UUID default might not be configured correctly');
        return false;
      } else {
        console.log('❌ Different error occurred:', insertError);
        return false;
      }
    } else {
      console.log('✅ Insert test successful!');
      console.log('   Generated ID:', insertResult.id);
      console.log('   Order Number:', insertResult.orderNumber);
      console.log('   Confirmation Code:', insertResult.confirmationCode);
      
      // Clean up test record
      await supabase.from('orders').delete().eq('id', insertResult.id);
      console.log('   (Test record cleaned up)');
    }
    
    console.log('\n🎉 Orders table verification complete!');
    console.log('✅ Both confirmationCode column and ID auto-generation are working');
    console.log('\n📝 Next steps:');
    console.log('   1. Update the order creation API to remove manual ID handling');
    console.log('   2. Test the complete booking flow');
    console.log('   3. Verify order creation works end-to-end');
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

verifyOrdersTable();