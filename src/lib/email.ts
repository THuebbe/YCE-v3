import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site';

// Lazy-load Resend client
function getResendClient() {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error('RESEND_API_KEY environment variable is not set');
	}
	return new Resend(apiKey);
}

/**
 * Sender address. Until a domain is verified in Resend, only its test sender
 * works - and it delivers only to the Resend account owner's own address.
 * After verifying a domain, set EMAIL_FROM in Vercel (e.g.
 * "YardCard Elite <orders@yourdomain.com>").
 */
const FROM_ADDRESS = process.env.EMAIL_FROM || 'YardCard Elite <onboarding@resend.dev>';

interface OrderNotificationData {
	orderNumber: string;
	customerName: string;
	eventDate: string;
	totalAmount: number;
	agencyName?: string;
	agencyEmail: string;
	/** Link to the order in the dashboard; the button is left out without it */
	orderUrl?: string;
}

// Customer-typed text goes into this HTML: escape it
const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export async function sendOrderNotificationEmail(data: OrderNotificationData) {
	try {
		console.log('📧 Sending order notification email to:', data.agencyEmail);
		
		// Create HTML email template directly
		const emailHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #059669; text-align: center;">🎉 New Order Alert!</h1>
				
				<div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h2 style="color: #065f46; margin: 0 0 15px 0;">Order Details</h2>
					<p><strong>Order Number:</strong> ${escapeHtml(data.orderNumber)}</p>
					<p><strong>Customer:</strong> ${escapeHtml(data.customerName)}</p>
					<p><strong>Event Date:</strong> ${new Date(data.eventDate).toLocaleDateString()}</p>
					<p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
				</div>
				
				<p style="text-align: center; color: #374151;">
					You have a new order! Please log into your dashboard to review the details and begin processing.
				</p>
				
				${data.orderUrl ? `<div style="text-align: center; margin: 30px 0;">
					<a 
						href="${escapeHtml(data.orderUrl)}" 
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
				</div>` : ''}
			</div>
		`;

		const resend = getResendClient();
		const result = await resend.emails.send({
			from: FROM_ADDRESS,
			to: [data.agencyEmail],
			subject: `New Order: ${data.orderNumber} - ${data.customerName.replace(/[\r\n]+/g, ' ')}`,
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

interface CustomerConfirmationData {
	to: string;
	customerName: string;
	orderNumber: string;
	confirmationCode: string;
	/** "Saturday, November 7, 2026" */
	eventDay: string;
	address: string;
	/** Picture of their display (orders.display_image_url) */
	displayImageUrl: string | null;
	totalAmount: number;
	paidByCard: boolean;
	agencyName: string;
	agencyEmail: string | null;
	agencyPhone: string | null;
	/** The terms they agreed to (orders.terms_snapshot sections) */
	terms: { title: string; text: string }[];
	/** Their self-service cancel page (orders.cancel_token) */
	cancelUrl: string | null;
}

/**
 * The customer's booking confirmation, on the agency's behalf: replies go to
 * the agency. Customers otherwise only got Stripe's payment receipt.
 */
export async function sendCustomerConfirmationEmail(data: CustomerConfirmationData) {
	try {
		const contact = [data.agencyPhone, data.agencyEmail].filter(Boolean).map(v => escapeHtml(v!)).join(' · ');
		const terms = data.terms.map(t => `<p style="margin:0 0 8px"><strong>${escapeHtml(t.title)}:</strong> ${escapeHtml(t.text)}</p>`).join('');
		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
				<h1 style="font-size: 22px;">You're booked, ${escapeHtml(data.customerName.split(' ')[0] || data.customerName)}!</h1>
				<p>${escapeHtml(data.agencyName)} has your yard display order.</p>
				<div style="background-color: #f3f4f6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
					<p style="margin:0 0 6px"><strong>Order:</strong> ${escapeHtml(data.orderNumber)} (confirmation code ${escapeHtml(data.confirmationCode)})</p>
					<p style="margin:0 0 6px"><strong>Event day:</strong> ${escapeHtml(data.eventDay)}</p>
					<p style="margin:0 0 6px"><strong>Address:</strong> ${escapeHtml(data.address)}</p>
					<p style="margin:0"><strong>${data.paidByCard ? 'Paid' : 'Total'}:</strong> $${data.totalAmount.toFixed(2)}</p>
					${data.displayImageUrl ? `<img src="${escapeHtml(data.displayImageUrl)}" alt="Your yard display" width="100%" style="display:block; width:100%; max-width:560px; height:auto; margin-top:16px; border-radius:6px;" />` : ''}
				</div>
				<p>Questions or changes? Contact ${escapeHtml(data.agencyName)}${contact ? `: ${contact}` : ''}. You can also reply to this email.</p>
				${data.cancelUrl ? `<p style="font-size: 14px;">Need to cancel? <a href="${escapeHtml(data.cancelUrl)}" style="color: #4b5563;">Cancel your booking</a> (refund per the terms below).</p>` : ''}
				<h2 style="font-size: 16px; margin-top: 28px;">Your booking terms</h2>
				<div style="font-size: 14px; color: #4b5563;">${terms}</div>
				<p style="font-size: 12px; color: #9ca3af; margin-top: 28px;">Sent by YardCard Elite for ${escapeHtml(data.agencyName)}. <a href="${SITE_URL}/privacy" style="color: #9ca3af;">Privacy Policy</a></p>
			</div>
		`;
		// "Texas Sign Solutions via YardCard Elite <orders@...>": the agency's
		// name, our verified sending address
		const address = FROM_ADDRESS.match(/<([^>]+)>/)?.[1] ?? FROM_ADDRESS;
		const fromName = `${data.agencyName.replace(/[<>"\r\n]/g, '')} via YardCard Elite`;
		const resend = getResendClient();
		const result = await resend.emails.send({
			from: `${fromName} <${address}>`,
			to: [data.to],
			...(data.agencyEmail ? { replyTo: data.agencyEmail } : {}),
			subject: `Your booking with ${data.agencyName.replace(/[\r\n]+/g, ' ')}: ${data.eventDay}`,
			html,
		});
		if (result.error) {
			console.error('❌ Customer confirmation: Resend error:', result.error);
			return { success: false, error: result.error };
		}
		console.log('✅ Customer confirmation sent. ID:', result.data?.id);
		return { success: true, emailId: result.data?.id };
	} catch (error) {
		console.error('❌ Customer confirmation failed:', error);
		return { success: false, error };
	}
}

/** Tells the customer their order was cancelled, and what comes back */
export async function sendCustomerCancellationEmail(data: {
	to: string;
	customerName: string;
	orderNumber: string;
	eventDay: string;
	refundAmount: number;
	refundedToCard: boolean;
	/** "You cancelled" vs "<agency> cancelled" */
	cancelledByCustomer?: boolean;
	agencyName: string;
	agencyEmail: string | null;
	agencyPhone: string | null;
}) {
	try {
		const contact = [data.agencyPhone, data.agencyEmail].filter(Boolean).map(v => escapeHtml(v!)).join(' · ');
		const refund = data.refundAmount > 0
			? data.refundedToCard
				? `<p>A refund of <strong>$${data.refundAmount.toFixed(2)}</strong> is on its way to your card. Banks usually show it within 5-10 business days.</p>`
				: `<p>${escapeHtml(data.agencyName)} will refund <strong>$${data.refundAmount.toFixed(2)}</strong> to you.</p>`
			: '<p>No refund is due under the booking terms you agreed to.</p>';
		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
				<h1 style="font-size: 22px;">Your booking was cancelled</h1>
				<p>${data.cancelledByCustomer ? 'You cancelled' : `${escapeHtml(data.agencyName)} cancelled`} order ${escapeHtml(data.orderNumber)} for ${escapeHtml(data.eventDay)}.</p>
				${refund}
				<p>Questions? Contact ${escapeHtml(data.agencyName)}${contact ? `: ${contact}` : ''}, or reply to this email.</p>
				<p style="font-size: 12px; color: #9ca3af; margin-top: 28px;">Sent by YardCard Elite for ${escapeHtml(data.agencyName)}. <a href="${SITE_URL}/privacy" style="color: #9ca3af;">Privacy Policy</a></p>
			</div>
		`;
		const address = FROM_ADDRESS.match(/<([^>]+)>/)?.[1] ?? FROM_ADDRESS;
		const resend = getResendClient();
		const result = await resend.emails.send({
			from: `${data.agencyName.replace(/[<>"\r\n]/g, '')} via YardCard Elite <${address}>`,
			to: [data.to],
			...(data.agencyEmail ? { replyTo: data.agencyEmail } : {}),
			subject: `Booking cancelled: ${data.orderNumber}`,
			html,
		});
		if (result.error) {
			console.error('❌ Cancellation email: Resend error:', result.error);
			return { success: false, error: result.error };
		}
		return { success: true, emailId: result.data?.id };
	} catch (error) {
		console.error('❌ Cancellation email failed:', error);
		return { success: false, error };
	}
}

/** Tells the agency a customer cancelled online (their order is already cancelled and refunded) */
export async function sendAgencyCancellationNotice(data: {
	to: string;
	orderNumber: string;
	customerName: string;
	eventDay: string;
	refundAmount: number;
}) {
	try {
		const resend = getResendClient();
		const result = await resend.emails.send({
			from: FROM_ADDRESS,
			to: [data.to],
			subject: `Cancelled by the customer: ${data.orderNumber}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
					<h1 style="font-size: 20px;">${escapeHtml(data.customerName)} cancelled their booking</h1>
					<p>Order ${escapeHtml(data.orderNumber)} for ${escapeHtml(data.eventDay)} is cancelled and its signs are free again.</p>
					<p>${data.refundAmount > 0 ? `They were refunded $${data.refundAmount.toFixed(2)} under your booking terms.` : 'No refund was due under your booking terms.'} Nothing else to do.</p>
				</div>`,
		});
		if (result.error) console.error('❌ Agency cancellation notice: Resend error:', result.error);
		return { success: !result.error };
	} catch (error) {
		console.error('❌ Agency cancellation notice failed:', error);
		return { success: false };
	}
}

interface FeeEmailData {
	to: string;
	customerName: string;
	orderNumber: string;
	lateDays: number;
	lateAmount: number;
	damagedSigns: number;
	damageAmount: number;
	total: number;
	agencyName: string;
	agencyEmail: string | null;
	agencyPhone: string | null;
}

function feeLines(d: FeeEmailData): string {
	const lines: string[] = [];
	if (d.lateAmount > 0) lines.push(`<p style="margin:0 0 6px">Late pickup (${d.lateDays} day${d.lateDays === 1 ? '' : 's'}): $${d.lateAmount.toFixed(2)}</p>`);
	if (d.damageAmount > 0) lines.push(`<p style="margin:0 0 6px">Damaged or missing signs (${d.damagedSigns}): $${d.damageAmount.toFixed(2)}</p>`);
	lines.push(`<p style="margin:0"><strong>Total: $${d.total.toFixed(2)}</strong></p>`);
	return lines.join('');
}

async function sendFeeEmail(d: FeeEmailData, subject: string, intro: string, after: string) {
	const contact = [d.agencyPhone, d.agencyEmail].filter(Boolean).map(v => escapeHtml(v!)).join(' · ');
	const address = FROM_ADDRESS.match(/<([^>]+)>/)?.[1] ?? FROM_ADDRESS;
	const resend = getResendClient();
	const result = await resend.emails.send({
		from: `${d.agencyName.replace(/[<>"\r\n]/g, '')} via YardCard Elite <${address}>`,
		to: [d.to],
		...(d.agencyEmail ? { replyTo: d.agencyEmail } : {}),
		subject,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
				<p>${intro}</p>
				<div style="background-color: #f3f4f6; padding: 16px 20px; border-radius: 8px; margin: 16px 0;">${feeLines(d)}</div>
				${after}
				<p style="font-size: 14px;">These fees are in the booking terms you agreed to. Questions? Contact ${escapeHtml(d.agencyName)}${contact ? `: ${contact}` : ''}, or reply to this email.</p>
			</div>`,
	});
	if (result.error) console.error('❌ Fee email: Resend error:', result.error);
	return { success: !result.error };
}

/** Fees charged to the card saved at booking */
export async function sendFeeChargedEmail(d: FeeEmailData & { cardLast4: string }) {
	return sendFeeEmail(d, `Fees for order ${d.orderNumber}`,
		`${escapeHtml(d.agencyName)} charged these fees for order ${escapeHtml(d.orderNumber)} to your card ending ${escapeHtml(d.cardLast4)}:`, '');
}

/** The saved card couldn't be charged: pay by link */
export async function sendFeePaymentLinkEmail(d: FeeEmailData & { payUrl: string }) {
	return sendFeeEmail(d, `Payment needed: fees for order ${d.orderNumber}`,
		`${escapeHtml(d.agencyName)} has these fees for order ${escapeHtml(d.orderNumber)}. Your card on file couldn't be charged, so please pay here:`,
		`<p style="text-align:center; margin: 24px 0;"><a href="${escapeHtml(d.payUrl)}" style="background-color:#111827; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none;">Pay $${d.total.toFixed(2)}</a></p>`);
}

// Test function to verify email setup
export async function sendTestEmail(toEmail: string) {
	try {
		console.log('📧 Sending test email to:', toEmail);

		const resend = getResendClient();
		const result = await resend.emails.send({
			from: FROM_ADDRESS,
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