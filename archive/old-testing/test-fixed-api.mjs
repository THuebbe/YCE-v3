#!/usr/bin/env node

/**
 * Test the fixed order creation API with properly mapped data
 */

const testOrderData = {
  formData: {
    contact: {
      fullName: "Test User",
      email: "test@example.com",
      phone: "5551234567"
    },
    event: {
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      deliveryAddress: {
        street: "123 Test St",
        city: "Test City",
        state: "CA",
        zipCode: "12345"
      },
      timeWindow: "morning",
      deliveryNotes: "Test delivery notes"
    },
    display: {
      eventMessage: "Happy Birthday",
      customMessage: null,
      recipientName: "Test Person",
      eventNumber: 25,
      messageStyle: "Classic",
      nameStyle: "Classic",
      characterTheme: "Classic",
      hobbies: ["Soccer"],
      extraDaysBefore: 0,
      extraDaysAfter: 0,
      holdId: "test_hold_123"
    },
    payment: {
      paymentMethod: "card",
      paymentMethodId: "pm_test_123",
      billingAddress: {
        zipCode: "12345"
      }
    }
  },
  holdId: "test_hold_123",
  paymentIntentId: "pi_test_123",
  agencyId: "yardcard-elite-west-branch",
  totalAmount: 95
};

async function testOrderAPI() {
  console.log('🚀 Testing fixed order creation API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData),
    });
    
    const result = await response.json();
    
    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Order creation successful!');
      console.log(`   Order ID: ${result.orderId}`);
      console.log(`   Order Number: ${result.orderNumber}`);
      console.log(`   Confirmation Code: ${result.confirmationCode}`);
      console.log('\n🎉 The booking flow should now work!');
    } else {
      console.log('\n❌ Order creation failed:');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure your development server is running:');
    console.log('   npm run dev');
  }
}

testOrderAPI();