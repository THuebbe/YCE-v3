#!/usr/bin/env node

/**
 * Final test of the fixed order creation directly with Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteOrderCreation() {
  console.log('🚀 Testing complete order creation with all fixes...\n');
  
  try {
    // Simulate the exact data structure from your booking flow
    const formData = {
      contact: {
        fullName: "Tobi Huebbe",
        email: "thuebbe08@gmail.com",
        phone: "(563) 340-9430"
      },
      event: {
        eventDate: "2025-08-30T17:00:00.000Z",
        deliveryAddress: {
          street: "543 N 4th St",
          city: "West Branch",
          state: "IA",
          zipCode: "52358"
        },
        timeWindow: "afternoon",
        deliveryNotes: ""
      },
      display: {
        eventMessage: "Get Well Soon",
        customMessage: "",
        messageStyle: "Bold",
        recipientName: "Mary",
        nameStyle: "Fun",
        characterTheme: "Princess",
        hobbies: ["Music", "Dance"],
        extraDaysBefore: 0,
        extraDaysAfter: 0,
        holdId: "mock_hold_test_final"
      },
      payment: {
        paymentMethod: "card",
        billingAddress: {
          zipCode: "65412"
        }
      }
    };
    
    const holdId = "mock_hold_test_final";
    const paymentIntentId = "pi_mock_final_test";
    const agencyId = "cmcpq75r40000q8x9umnkdn4s"; // YardCard Elite West Branch UUID
    const totalAmount = 95;
    
    // Convert eventDate string to Date object manually
    const eventDate = new Date(formData.event.eventDate);
    
    // Generate order number and confirmation code
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(Math.random() * 900000) + 100000;
    const orderNumber = `YCE-${year}-${randomNumber}`;
    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Create order data exactly like the API does
    const orderData = {
      orderNumber,
      agencyId,
      status: "pending",
      
      // Map totalAmount to existing 'total' and 'subtotal' columns
      total: totalAmount,
      subtotal: totalAmount,
      
      // Customer information
      customerName: formData.contact.fullName,
      customerEmail: formData.contact.email,
      customerPhone: formData.contact.phone,
      
      // Event details
      eventDate: eventDate.toISOString(),
      eventAddress: formData.event.deliveryAddress ? 
        `${formData.event.deliveryAddress.street}, ${formData.event.deliveryAddress.city}, ${formData.event.deliveryAddress.state} ${formData.event.deliveryAddress.zipCode}` :
        'Address not provided',
      deliveryTime: formData.event.timeWindow || null,
      deliveryNotes: formData.event.deliveryNotes || null,
      
      // Display customization
      message: formData.display?.eventMessage || 'Event Message',
      messageText: formData.display?.eventMessage === 'Custom Message' ? 
        formData.display?.customMessage : 
        formData.display?.eventMessage,
      theme: formData.display?.characterTheme || null,
      
      // Payment information
      paymentMethod: formData.payment?.paymentMethod || null,
      paymentIntentId: paymentIntentId,
      paymentStatus: "pending",
      
      // Additional metadata
      specialInstructions: formData.event.deliveryNotes || null,
      
      // Store confirmation code
      confirmationCode: confirmationCode,
      
      // Add updatedAt since it's required
      updatedAt: new Date().toISOString()
    };
    
    console.log('📋 Order data to insert:');
    console.log(JSON.stringify(orderData, null, 2));
    console.log('\n💾 Inserting order into database...');
    
    const { data: orderRecord, error: insertError } = await supabase
      .from('orders')
      .insert([orderData])
      .select('id, orderNumber, confirmationCode')
      .single();
    
    if (insertError) {
      console.error('❌ Database insert failed:', insertError);
      return false;
    }
    
    console.log('\n🎉 ORDER CREATION SUCCESSFUL!');
    console.log(`   Order ID: ${orderRecord.id}`);
    console.log(`   Order Number: ${orderRecord.orderNumber}`);
    console.log(`   Confirmation Code: ${orderRecord.confirmationCode}`);
    
    // Clean up test order
    await supabase.from('orders').delete().eq('id', orderRecord.id);
    console.log('\n🧹 Test order cleaned up');
    
    console.log('\n✅ BOOKING FLOW SHOULD NOW WORK COMPLETELY!');
    console.log('\n🎯 Summary of fixes applied:');
    console.log('   1. ✅ Added confirmationCode column to orders table');  
    console.log('   2. ✅ Configured UUID auto-generation for id column');
    console.log('   3. ✅ Fixed API data mapping to existing database schema');
    console.log('   4. ✅ Added required subtotal field');
    console.log('   5. ✅ Removed manual ID and timestamp handling');
    
    console.log('\n🚀 Try your booking flow now - Step 5 should work!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testCompleteOrderCreation();