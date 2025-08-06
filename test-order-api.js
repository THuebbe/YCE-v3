// Test script to verify the order creation API endpoint
const fetch = require('node-fetch');

const testOrderData = {
  formData: {
    contact: {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567"
    },
    event: {
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      deliveryAddress: {
        street: "123 Main St",
        city: "Test City",
        state: "CA",
        zipCode: "12345"
      },
      timeWindow: "morning",
      deliveryNotes: "Test delivery notes"
    },
    display: {
      eventMessage: "Happy Birthday",
      recipientName: "Test Person",
      eventNumber: 25,
      messageStyle: "Classic",
      nameStyle: "Classic",
      characterTheme: "Classic",
      hobbies: ["Soccer"],
      extraDaysBefore: 0,
      extraDaysAfter: 0
    },
    payment: {
      paymentMethod: "card",
      billingAddress: {
        zipCode: "12345"
      }
    }
  },
  holdId: "test-hold-123",
  paymentIntentId: "pi_test_123456",
  agencyId: "yardcard-elite-west-branch",
  totalAmount: 95
};

console.log('Test order data prepared:', JSON.stringify(testOrderData, null, 2));
console.log('Ready to test the order API endpoint when server is running...');