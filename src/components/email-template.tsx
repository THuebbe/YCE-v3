import * as React from "react";

interface OrderNotificationEmailProps {
	orderNumber: string;
	customerName: string;
	eventDate: string;
	totalAmount: number;
	agencyName?: string;
}

export function OrderNotificationEmail({ 
	orderNumber, 
	customerName, 
	eventDate, 
	totalAmount,
	agencyName = "Your Agency"
}: OrderNotificationEmailProps) {
	return (
		<div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
			<h1 style={{ color: '#059669', textAlign: 'center' }}>🎉 New Order Alert!</h1>
			
			<div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
				<h2 style={{ color: '#065f46', margin: '0 0 15px 0' }}>Order Details</h2>
				<p><strong>Order Number:</strong> {orderNumber}</p>
				<p><strong>Customer:</strong> {customerName}</p>
				<p><strong>Event Date:</strong> {new Date(eventDate).toLocaleDateString()}</p>
				<p><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</p>
			</div>
			
			<p style={{ textAlign: 'center', color: '#374151' }}>
				You have a new order! Please log into your dashboard to review the details and begin processing.
			</p>
			
			<div style={{ textAlign: 'center', margin: '30px 0' }}>
				<a 
					href="#" 
					style={{ 
						backgroundColor: '#059669', 
						color: 'white', 
						padding: '12px 24px', 
						textDecoration: 'none', 
						borderRadius: '6px',
						display: 'inline-block'
					}}
				>
					View Order in Dashboard
				</a>
			</div>
		</div>
	);
}

// Keep the original template for backwards compatibility
interface EmailTemplateProps {
	firstName: string;
}

export function EmailTemplate({ firstName }: EmailTemplateProps) {
	return (
		<div>
			<h1>Welcome, {firstName}!</h1>
		</div>
	);
}
