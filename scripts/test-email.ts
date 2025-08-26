#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
config({ path: envPath });

// Verify environment variables are loaded
if (!process.env.RESEND_API_KEY) {
	console.error('❌ RESEND_API_KEY not found in environment variables');
	console.error('🔍 Make sure .env.local exists and contains RESEND_API_KEY');
	console.error('📁 Looking for env file at:', envPath);
	process.exit(1);
}

import { sendTestEmail, sendOrderNotificationEmail } from '../src/lib/email';

async function main() {
	let args = process.argv.slice(2);
	
	// Remove npm script separator if present
	if (args[0] === '--') {
		args = args.slice(1);
	}
	
	if (args.length === 0) {
		console.log(`
📧 YardCard Elite Email Test Script

Usage:
  npm run test-email <email>                    - Send basic test email
  npm run test-email <email> --order           - Send order notification test
  npm run test-email <email> --order --agency  - Send with agency data

Examples:
  npm run test-email thuebbe.coding@gmail.com
  npm run test-email thuebbe.coding@gmail.com --order
  npm run test-email thuebbe.coding@gmail.com --order --agency
		`);
		process.exit(1);
	}

	const email = args[0];
	const isOrderTest = args.includes('--order');
	const withAgency = args.includes('--agency');

	console.log('🚀 Starting email test...');
	console.log('📧 Target email:', email);
	console.log('📬 Test type:', isOrderTest ? 'Order Notification' : 'Basic Test');

	try {
		if (isOrderTest) {
			// Send order notification email
			const result = await sendOrderNotificationEmail({
				orderNumber: 'YCE-2024-123456',
				customerName: 'John Smith',
				eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
				totalAmount: 150.00, // $150.00 as dollars
				agencyName: withAgency ? 'Test Agency' : undefined,
				agencyEmail: email,
			});

			if (result.success) {
				console.log('✅ Order notification email sent successfully!');
				console.log('📬 Email ID:', result.emailId);
				console.log('📋 Test order details:');
				console.log('   - Order Number: YCE-2024-123456');
				console.log('   - Customer: John Smith');
				console.log('   - Event Date:', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString());
				console.log('   - Total: $150.00');
			} else {
				console.error('❌ Failed to send order notification email');
				console.error('🔍 Error details:', result.error);
				process.exit(1);
			}
		} else {
			// Send basic test email
			const result = await sendTestEmail(email);

			if (result.success && result.emailId) {
				console.log('✅ Test email sent successfully!');
				console.log('📬 Email ID:', result.emailId);
			} else {
				console.error('❌ Failed to send test email');
				console.error('🔍 Error details:', result.error);
				if (result.error?.error) {
					console.error('📋 Specific error:', result.error.error);
				}
				process.exit(1);
			}
		}

		console.log('');
		console.log('🎉 Email test completed! Check your inbox.');
		console.log('💡 If you don\'t see the email, check your spam folder.');
		
	} catch (error) {
		console.error('❌ Unexpected error:', error);
		process.exit(1);
	}
}

main().catch(console.error);