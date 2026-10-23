import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site';
import { BRAND, COLORS, PALETTE } from '@/lib/brand';
import { formatDay } from '@/features/booking/booking-rules';

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
const SENDING_ADDRESS = FROM_ADDRESS.match(/<([^>]+)>/)?.[1] ?? FROM_ADDRESS;

/** "Texas Sign Solutions via YardCard Elite <orders@...>": the agency's name, our verified address */
const fromAgency = (agencyName: string) => `${agencyName.replace(/[<>"\r\n]/g, '')} via ${BRAND.name} <${SENDING_ADDRESS}>`;

// Customer-typed text goes into this HTML: escape it
const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

const money = (n: number) => `$${n.toFixed(2)}`;

// --- Layout ------------------------------------------------------------------
// Email clients ignore stylesheets and CSS variables, so everything is inline,
// in tables, with the brand's hex values from brand.ts (DESIGN.md colors).

const FONT = `'Nunito Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const HEADING_FONT = `Fredoka, 'Nunito Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;

/**
 * The frame every email shares. `from` decides the header: our logo on mail
 * to agencies, the agency's name on mail to their customers (it's their
 * booking; we're only the "Sent by" line).
 */
function emailLayout({ from, preheader, body, footer }: { from: { agency: string } | 'yce'; preheader: string; body: string; footer?: string }) {
	const header = from === 'yce'
		? `<img src="${SITE_URL}${BRAND.logo.emailPng}" width="180" alt="${BRAND.name}" style="display:block; width:180px; max-width:60%; height:auto; border:0;" />`
		: `<p style="margin:0; font-family:${HEADING_FONT}; font-size:20px; font-weight:600; color:${PALETTE.ink[0]};">${escapeHtml(from.agency)}</p>`;
	const headerCell = from === 'yce'
		? `padding:24px 28px 8px;`
		: `padding:18px 28px; background-color:${COLORS.brand}; border-radius:12px 12px 0 0;`;
	return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0; padding:0; background-color:${COLORS.canvas};">
	<span style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader)}</span>
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.canvas};">
		<tr><td align="center" style="padding:24px 12px;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:${COLORS.surface}; border:1px solid ${COLORS.line}; border-radius:12px;">
				<tr><td style="${headerCell}">${header}</td></tr>
				<tr><td style="padding:24px 28px 28px; font-family:${FONT}; font-size:16px; line-height:1.5; color:${COLORS.text};">${body}</td></tr>
			</table>
			<p style="max-width:560px; margin:16px auto 0; font-family:${FONT}; font-size:12px; line-height:1.5; color:${COLORS.textMuted}; text-align:center;">
				${footer ?? ''}${footer ? '<br>' : ''}<a href="${SITE_URL}/privacy" style="color:${COLORS.textMuted};">Privacy Policy</a>
			</p>
		</td></tr>
	</table>
</body></html>`;
}

const h1 = (text: string) =>
	`<h1 style="margin:0 0 12px; font-family:${HEADING_FONT}; font-size:24px; line-height:1.25; font-weight:600; color:${COLORS.text};">${text}</h1>`;

const p = (html: string, style = '') => `<p style="margin:0 0 14px; ${style}">${html}</p>`;

const small = (html: string) => p(html, `font-size:14px; color:${COLORS.textMuted};`);

/** Label / value rows on a tinted panel. Values are HTML (escape before passing). */
function details(rows: [string, string][], strongLast = false) {
	const cells = rows.map(([label, value], i) => {
		const last = strongLast && i === rows.length - 1;
		return `<tr>
			<td width="1%" style="padding:6px 16px 6px 0; color:${COLORS.textMuted}; vertical-align:top; white-space:nowrap;${last ? ` border-top:1px solid ${COLORS.line}; padding-top:10px;` : ''}">${label}</td>
			<td style="padding:6px 0; font-weight:${last ? 700 : 600}; color:${COLORS.text};${last ? ` border-top:1px solid ${COLORS.line}; padding-top:10px;` : ''}">${value}</td>
		</tr>`;
	}).join('');
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px; background-color:${PALETTE.ink[50]}; border-radius:8px;">
		<tr><td style="padding:12px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${FONT}; font-size:15px; line-height:1.4;">${cells}</table></td></tr>
	</table>`;
}

/** The one main action. Dark text on orange: white on orange fails contrast (DESIGN.md). */
const button = (href: string, label: string) =>
	`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:8px; background-color:${COLORS.action};">
		<a href="${escapeHtml(href)}" style="display:inline-block; padding:13px 24px; font-family:${FONT}; font-size:16px; font-weight:700; color:${COLORS.onAction}; text-decoration:none; border-radius:8px;">${label}</a>
	</td></tr></table>`;

const contactLine = (agencyName: string, phone: string | null, email: string | null) => {
	const contact = [phone, email].filter(Boolean).map(v => escapeHtml(v!)).join(' · ');
	return `Questions or changes? Contact ${escapeHtml(agencyName)}${contact ? `: ${contact}` : ''}, or reply to this email.`;
};

const sentFor = (agencyName: string) => `Sent by ${BRAND.name} for ${escapeHtml(agencyName)}.`;

/** "2026-11-07" or an ISO time -> "Saturday, November 7, 2026" (the event's own day, not the server's) */
const eventDayOf = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? formatDay(iso.slice(0, 10), true) : iso);

async function send(label: string, message: Parameters<Resend['emails']['send']>[0]) {
	try {
		const result = await getResendClient().emails.send(message);
		if (result.error) {
			console.error(`${label} email: Resend error:`, result.error);
			return { success: false as const, error: result.error };
		}
		return { success: true as const, emailId: result.data?.id };
	} catch (error) {
		console.error(`${label} email failed:`, error);
		return { success: false as const, error };
	}
}

// --- Emails ------------------------------------------------------------------

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

/** To the agency: a customer booked */
export function orderNotificationHtml(data: OrderNotificationData) {
	const customer = escapeHtml(data.customerName);
	const day = eventDayOf(data.eventDate);
	return emailLayout({
		from: 'yce',
		preheader: `${data.customerName} booked a display for ${day}.`,
		body: [
			h1(`New booking from ${customer}`),
			p('It’s in your orders, ready to get going.'),
			details([
				['Order', escapeHtml(data.orderNumber)],
				['Customer', customer],
				['Event day', escapeHtml(day)],
				['Total', money(data.totalAmount)],
			], true),
			data.orderUrl ? button(data.orderUrl, 'Open the order') : '',
		].join(''),
	});
}

export async function sendOrderNotificationEmail(data: OrderNotificationData) {
	const day = eventDayOf(data.eventDate);
	const html = orderNotificationHtml(data);
	return send('Order notification', {
		from: FROM_ADDRESS,
		to: [data.agencyEmail],
		subject: `New booking: ${data.customerName.replace(/[\r\n]+/g, ' ')}, ${day} (${data.orderNumber})`,
		html,
	});
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
export function customerConfirmationHtml(data: CustomerConfirmationData) {
	const firstName = escapeHtml(data.customerName.split(' ')[0] || data.customerName);
	const agency = escapeHtml(data.agencyName);
	const terms = data.terms
		.map(t => `<p style="margin:0 0 8px;"><strong style="color:${COLORS.text};">${escapeHtml(t.title)}:</strong> ${escapeHtml(t.text)}</p>`)
		.join('');
	return emailLayout({
		from: { agency: data.agencyName },
		preheader: `Your yard display is booked for ${data.eventDay}.`,
		body: [
			h1(`You’re booked, ${firstName}!`),
			p(`${agency} has your yard display order.`),
			data.displayImageUrl
				? `<img src="${escapeHtml(data.displayImageUrl)}" alt="Your yard display" width="504" style="display:block; width:100%; max-width:504px; height:auto; margin:4px 0 16px; border-radius:8px; border:0;" />`
				: '',
			details([
				['Event day', escapeHtml(data.eventDay)],
				['Address', escapeHtml(data.address)],
				['Order', `${escapeHtml(data.orderNumber)}<br><span style="font-weight:400; color:${COLORS.textMuted};">Confirmation code ${escapeHtml(data.confirmationCode)}</span>`],
				[data.paidByCard ? 'Paid' : 'Total', money(data.totalAmount)],
			], true),
			p(contactLine(data.agencyName, data.agencyPhone, data.agencyEmail)),
			data.cancelUrl
				? small(`Need to cancel? <a href="${escapeHtml(data.cancelUrl)}" style="color:${COLORS.actionText}; font-weight:700;">Cancel your booking</a> (refund per the terms below).`)
				: '',
			`<h2 style="margin:24px 0 8px; font-family:${HEADING_FONT}; font-size:17px; font-weight:600; color:${COLORS.text};">Your booking terms</h2>`,
			`<div style="font-size:14px; line-height:1.5; color:${COLORS.textMuted};">${terms}</div>`,
		].join(''),
		footer: sentFor(data.agencyName),
	});
}

export async function sendCustomerConfirmationEmail(data: CustomerConfirmationData) {
	const html = customerConfirmationHtml(data);
	return send('Customer confirmation', {
		from: fromAgency(data.agencyName),
		to: [data.to],
		...(data.agencyEmail ? { replyTo: data.agencyEmail } : {}),
		subject: `Your booking with ${data.agencyName.replace(/[\r\n]+/g, ' ')}: ${data.eventDay}`,
		html,
	});
}

interface CustomerCancellationData {
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
}

/** Tells the customer their order was cancelled, and what comes back */
export function customerCancellationHtml(data: CustomerCancellationData) {
	const agency = escapeHtml(data.agencyName);
	const refund = data.refundAmount > 0
		? data.refundedToCard
			? p(`A refund of <strong>${money(data.refundAmount)}</strong> is on its way to your card. Banks usually show it within 5-10 business days.`)
			: p(`${agency} will refund <strong>${money(data.refundAmount)}</strong> to you.`)
		: p('No refund is due under the booking terms you agreed to.');
	return emailLayout({
		from: { agency: data.agencyName },
		preheader: `Order ${data.orderNumber} for ${data.eventDay} is cancelled.`,
		body: [
			h1('Your booking was cancelled'),
			p(`${data.cancelledByCustomer ? 'You cancelled' : `${agency} cancelled`} order ${escapeHtml(data.orderNumber)} for ${escapeHtml(data.eventDay)}.`),
			refund,
			p(contactLine(data.agencyName, data.agencyPhone, data.agencyEmail)),
		].join(''),
		footer: sentFor(data.agencyName),
	});
}

export async function sendCustomerCancellationEmail(data: CustomerCancellationData) {
	const html = customerCancellationHtml(data);
	return send('Cancellation', {
		from: fromAgency(data.agencyName),
		to: [data.to],
		...(data.agencyEmail ? { replyTo: data.agencyEmail } : {}),
		subject: `Booking cancelled: ${data.orderNumber}`,
		html,
	});
}

interface AgencyCancellationData {
	to: string;
	orderNumber: string;
	customerName: string;
	eventDay: string;
	refundAmount: number;
}

/** Tells the agency a customer cancelled online (their order is already cancelled and refunded) */
export function agencyCancellationHtml(data: AgencyCancellationData) {
	return emailLayout({
		from: 'yce',
		preheader: `Order ${data.orderNumber} is cancelled and its signs are free again.`,
		body: [
			h1(`${escapeHtml(data.customerName)} cancelled their booking`),
			p(`Order ${escapeHtml(data.orderNumber)} for ${escapeHtml(data.eventDay)} is cancelled and its signs are free again.`),
			p(`${data.refundAmount > 0 ? `They were refunded ${money(data.refundAmount)} under your booking terms.` : 'No refund was due under your booking terms.'} Nothing else to do.`),
		].join(''),
	});
}

export async function sendAgencyCancellationNotice(data: AgencyCancellationData) {
	const html = agencyCancellationHtml(data);
	const result = await send('Agency cancellation notice', {
		from: FROM_ADDRESS,
		to: [data.to],
		subject: `Cancelled by the customer: ${data.orderNumber}`,
		html,
	});
	return { success: result.success };
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

function feeRows(d: FeeEmailData): [string, string][] {
	const rows: [string, string][] = [];
	if (d.lateAmount > 0) rows.push([`Late pickup (${d.lateDays} day${d.lateDays === 1 ? '' : 's'})`, money(d.lateAmount)]);
	if (d.damageAmount > 0) rows.push([`Damaged or missing signs (${d.damagedSigns})`, money(d.damageAmount)]);
	rows.push(['Total', money(d.total)]);
	return rows;
}

function feeHtml(d: FeeEmailData, subject: string, heading: string, intro: string, after: string) {
	return emailLayout({
		from: { agency: d.agencyName },
		preheader: `${subject}: ${money(d.total)}`,
		body: [
			h1(heading),
			p(intro),
			details(feeRows(d), true),
			after,
			small(`These fees are in the booking terms you agreed to. ${contactLine(d.agencyName, d.agencyPhone, d.agencyEmail)}`),
		].join(''),
		footer: sentFor(d.agencyName),
	});
}

async function sendFeeEmail(d: FeeEmailData, subject: string, html: string) {
	const result = await send('Fee', {
		from: fromAgency(d.agencyName),
		to: [d.to],
		...(d.agencyEmail ? { replyTo: d.agencyEmail } : {}),
		subject,
		html,
	});
	return { success: result.success };
}

/** Fees charged to the card saved at booking */
export function feeChargedHtml(d: FeeEmailData & { cardLast4: string }) {
	return feeHtml(d, `Fees for order ${d.orderNumber}`, 'Fees for your booking',
		`${escapeHtml(d.agencyName)} charged these fees for order ${escapeHtml(d.orderNumber)} to your card ending ${escapeHtml(d.cardLast4)}:`, '');
}

export async function sendFeeChargedEmail(d: FeeEmailData & { cardLast4: string }) {
	return sendFeeEmail(d, `Fees for order ${d.orderNumber}`, feeChargedHtml(d));
}

/** The saved card couldn't be charged: pay by link */
export function feePaymentLinkHtml(d: FeeEmailData & { payUrl: string }) {
	return feeHtml(d, `Payment needed: fees for order ${d.orderNumber}`, 'Payment needed for your booking',
		`${escapeHtml(d.agencyName)} has these fees for order ${escapeHtml(d.orderNumber)}. Your card on file couldn’t be charged, so please pay here:`,
		button(d.payUrl, `Pay ${money(d.total)}`));
}

export async function sendFeePaymentLinkEmail(d: FeeEmailData & { payUrl: string }) {
	return sendFeeEmail(d, `Payment needed: fees for order ${d.orderNumber}`, feePaymentLinkHtml(d));
}
