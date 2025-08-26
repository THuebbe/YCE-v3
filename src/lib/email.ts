import { Resend } from 'resend';

// Lazy-load Resend client
function getResendClient() {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error('RESEND_API_KEY environment variable is not set');
	}
	return new Resend(apiKey);
}

interface OrderNotificationData {
	orderNumber: string;
	customerName: string;
	eventDate: string;
	totalAmount: number;
	agencyName?: string;
	agencyEmail: string;
}

export async function sendOrderNotificationEmail(data: OrderNotificationData) {
	try {
		console.log('📧 Sending order notification email to:', data.agencyEmail);
		
		// Create HTML email template directly
		const emailHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #059669; text-align: center;">🎉 New Order Alert!</h1>
				
				<div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h2 style="color: #065f46; margin: 0 0 15px 0;">Order Details</h2>
					<p><strong>Order Number:</strong> ${data.orderNumber}</p>
					<p><strong>Customer:</strong> ${data.customerName}</p>
					<p><strong>Event Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
					<p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
				</div>
				
				<p style="text-align: center; color: #374151;">
					You have a new order! Please log into your dashboard to review the details and begin processing.
				</p>
				
				<div style="text-align: center; margin: 30px 0;">
					<a 
						href="#" 
						style="
							background-color: #059669; 
							color: white; 
							padding: 12px 24px; 
							text-decoration: none; 
							border-radius: 6px;
							display: inline-block;
						"
					>
						View Order in Dashboard
					</a>
				</div>
			</div>
		`;

		const resend = getResendClient();
		const result = await resend.emails.send({
			from: 'YardCard Elite <onboarding@resend.dev>',
			to: [data.agencyEmail],
			subject: `New Order: ${data.orderNumber} - ${data.customerName}`,
			html: emailHtml,
		});
		
		if (result.error) {
			console.error('❌ Resend returned an error:', result.error);
			return { success: false, error: result.error };
		}
		
		console.log('✅ Email sent successfully. ID:', result.data?.id);
		return { success: true, emailId: result.data?.id };
	} catch (error) {
		console.error('❌ Failed to send email:', error);
		console.error('❌ Error details:', JSON.stringify(error, null, 2));
		return { success: false, error: error };
	}
}

// Test function to verify email setup
export async function sendTestEmail(toEmail: string) {
	try {
		console.log('📧 Sending test email to:', toEmail);

		const resend = getResendClient();
		const result = await resend.emails.send({
			from: 'YardCard Elite <onboarding@resend.dev>',
			to: [toEmail],
			subject: 'YardCard Elite Email Setup Test',
			html: '<p>Congrats! Your email setup is working correctly. 🎉</p>',
		});
		
		if (result.error) {
			console.error('❌ Resend returned an error:', result.error);
			return { success: false, error: result.error };
		}
		
		console.log('✅ Test email sent. ID:', result.data?.id);
		return { success: true, emailId: result.data?.id };
	} catch (error) {
		console.error('❌ Test email failed:', error);
		return { success: false, error: error };
	}
}