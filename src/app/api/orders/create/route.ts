import { NextRequest, NextResponse } from "next/server";
import { supabase, getAgencyBySlug } from "@/lib/db/supabase-client";
import { BookingOrderResult } from "@/features/booking/types";
import { sendOrderNotificationEmail } from "@/lib/email";
import { calculateBookingTotal, parseBookingPricing } from "@/features/booking/pricing";
import { parseBookingRules, rentalWindow, resolveTimeZone, todayIn, validateBookingDates } from "@/features/booking/booking-rules";
import { z } from "zod";

// Relaxed input validation schema - only validate essential fields
const createOrderInputSchema = z.object({
	formData: z.object({
		contact: z.object({
			fullName: z.string().min(2),
			email: z.string().email(),
			phone: z.string().min(10),
		}),
		event: z.object({
			eventDate: z.string(), // Accept as string, convert manually
			extraDaysBefore: z.number().int().min(0).max(7).default(0),
			extraDaysAfter: z.number().int().min(0).max(7).default(0),
			deliveryAddress: z
				.object({
					street: z.string().min(5),
					city: z.string().min(2),
					state: z.string().length(2),
					zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
				})
				.optional(), // Make optional to allow minimal data
			timeWindow: z.enum(["morning", "afternoon", "evening"]).optional(),
			deliveryNotes: z.string().optional(),
		}),
		display: z
			.object({
				eventMessage: z.string().min(1),
				customMessage: z.string().optional(),
				eventNumber: z.number().positive().optional(),
				messageStyle: z.string().min(1).optional(),
				recipientName: z.string().min(1),
				nameStyle: z.string().min(1).optional(),
				messageColorway: z.string().min(1).optional(),
				nameColorway: z.string().min(1).optional(),
				characterTheme: z.string().optional(),
				hobbies: z.array(z.string()).optional(),
				previewUrl: z.string().optional(),
				holdId: z.string().min(1),
			}),
		payment: z
			.object({
				paymentMethod: z
					.enum(["card", "apple_pay", "paypal", "venmo"])
					.optional(),
				paymentMethodId: z.string().optional(),
				billingAddress: z
					.object({
						zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
					})
					.optional(),
			})
			.optional(),
	}),
	holdId: z.string().min(1, "Hold ID is required"),
	sessionId: z.string().min(1, "Booking session is required"),
	timeZone: z.string().max(64).optional(),
	paymentIntentId: z.string().min(1, "Payment Intent ID is required"),
	agencySlug: z.string().min(1, "Agency slug is required"),
	totalAmount: z.number().positive("Total amount must be positive"),
});

export async function POST(
	request: NextRequest
): Promise<NextResponse<BookingOrderResult>> {
	try {
		console.log("🚀 Creating new booking order...");

		// Parse and validate request body
		const body = await request.json();
		// Never log the raw body: it is customer PII and, from older clients,
		// may contain card fields.
		console.log("📝 Received order data:", {
			hasFormData: !!body.formData,
			holdId: body.holdId,
			agencySlug: body.agencySlug,
			totalAmount: body.totalAmount,
		});

		console.log("🔍 About to validate with createOrderInputSchema...");
		console.log(
			"🔍 Schema expects eventDate as string, received:",
			typeof body.formData?.event?.eventDate
		);

		const validationResult = createOrderInputSchema.safeParse(body);
		if (!validationResult.success) {
			console.error("❌ Validation failed:", validationResult.error.errors);
			console.error(
				"❌ Detailed validation errors:",
				JSON.stringify(validationResult.error.issues, null, 2)
			);
			return NextResponse.json(
				{
					success: false,
					error:
						"Invalid order data: " +
						validationResult.error.errors.map((e) => e.message).join(", "),
				},
				{ status: 400 }
			);
		}

		const { formData, holdId, sessionId, timeZone, paymentIntentId, agencySlug, totalAmount } =
			validationResult.data;

		// Convert agency slug to UUID
		console.log('🔍 Looking up agency by slug:', agencySlug);
		const agency = await getAgencyBySlug(agencySlug);
		if (!agency) {
			return NextResponse.json({
				success: false,
				error: 'Agency not found: ' + agencySlug
			}, { status: 400 });
		}
		const actualAgencyId = agency.id;
		console.log('✅ Agency UUID found:', actualAgencyId);

		// The price is the agency's, not the browser's: recompute it and refuse
		// an order whose quoted total doesn't match (tampering or a stale page)
		const pricing = parseBookingPricing(agency.pricing_config);
		if (!pricing) {
			return NextResponse.json({
				success: false,
				error: 'This agency has not set up pricing yet'
			}, { status: 400 });
		}
		const serverTotal = calculateBookingTotal(
			pricing,
			formData.event.extraDaysBefore,
			formData.event.extraDaysAfter
		);
		if (Math.abs(serverTotal - totalAmount) > 0.005) {
			console.warn('⚠️ Order total mismatch:', { agencySlug, client: totalAmount, server: serverTotal });
			return NextResponse.json({
				success: false,
				error: 'This agency\'s prices were updated while you were booking. Please refresh the page to see current pricing.'
			}, { status: 400 });
		}

		// Convert eventDate string to Date object manually
		const eventDate = new Date(formData.event.eventDate);
		if (isNaN(eventDate.getTime())) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid event date format",
				},
				{ status: 400 }
			);
		}

		// The agency's booking rules (order cutoff before delivery, rental length)
		const { extraDaysBefore, extraDaysAfter } = formData.event;
		const rules = parseBookingRules(agency.booking_rules, agency.blackout_dates);
		const dateError = validateBookingDates(
			rules,
			eventDate,
			extraDaysBefore,
			extraDaysAfter,
			todayIn(resolveTimeZone(agency.operating_hours, timeZone))
		);
		if (dateError) {
			return NextResponse.json({ success: false, error: dateError }, { status: 400 });
		}

		// The hold must cover the display being ordered: one reserved letter
		// sign per letter of the message and name. (The client sends the text
		// and the held signs separately; nothing else ties them together.)
		const shortLetters = await lettersMissingFromHold(holdId, actualAgencyId, sessionId, [
			formData.display.eventMessage === "Custom Message"
				? formData.display.customMessage ?? ""
				: formData.display.eventMessage,
			formData.display.recipientName,
		]);
		if (shortLetters === null || shortLetters.length > 0) {
			return NextResponse.json({
				success: false,
				error: "Your reserved signs don't match your message. Please go back to Customize and regenerate your layout.",
			}, { status: 400 });
		}

		// Generate order number (format: YCE-YYYY-NNNNNN)
		const year = new Date().getFullYear();
		const randomNumber = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
		const orderNumber = `YCE-${year}-${randomNumber}`;

		// Generate confirmation code (8 characters)
		const confirmationCode = Math.random()
			.toString(36)
			.substring(2, 10)
			.toUpperCase();

		console.log("🔢 Generated order number:", orderNumber);
		console.log("🎫 Generated confirmation code:", confirmationCode);

		// Create order record in database - mapping to actual database columns
		const orderData = {
			order_number: orderNumber,
			agency_id: actualAgencyId, // Use the UUID, not the slug
			status: "pending",

			// Map the server-computed total to existing 'total' and 'subtotal' columns
			total: serverTotal,
			subtotal: serverTotal, // Set subtotal equal to total for now (no extra fees)

			// Customer information (essential) - using existing column names
			customer_name: formData.contact.fullName,
			customer_email: formData.contact.email,
			customer_phone: formData.contact.phone,

			// Event details - using existing column names
			event_date: eventDate.toISOString(),
			event_address: formData.event.deliveryAddress
				? `${formData.event.deliveryAddress.street}, ${formData.event.deliveryAddress.city}, ${formData.event.deliveryAddress.state} ${formData.event.deliveryAddress.zipCode}`
				: "Address not provided",
			delivery_time: formData.event.timeWindow || null,
			delivery_notes: formData.event.deliveryNotes || null,

			// Display customization - mapping to existing columns
			message: formData.display?.eventMessage || "Event Message",
			message_text:
				formData.display?.eventMessage === "Custom Message"
					? formData.display?.customMessage
					: formData.display?.eventMessage,
			theme: formData.display?.characterTheme || null,
			extra_days: extraDaysBefore + extraDaysAfter,
			extra_day_fee: (extraDaysBefore + extraDaysAfter) * pricing.extraDayPrice,
			extraDaysBefore,
			extraDaysAfter,
			holdId,

			// Payment information
			payment_method: formData.payment?.paymentMethod || null,
			payment_intent_id: paymentIntentId,
			payment_status: "pending",

			// Additional metadata
			special_instructions: formData.event.deliveryNotes || null,

			// Store confirmation code (now working!)
			confirmation_code: confirmationCode,

			// Add updated_at since it's required (created_at has default, updated_at doesn't)
			updated_at: new Date().toISOString(),
		};

		console.log("💾 Inserting order into database...");
		const { data: orderRecord, error: insertError } = await supabase
			.from("orders")
			.insert([orderData])
			.select("id, order_number")
			.single();

		if (insertError) {
			console.error("❌ Database insert failed:", insertError);
			return NextResponse.json(
				{
					success: false,
					// Details stay in the log; customers get something they can act on
					error: "We couldn't save your order. Please try again in a moment.",
				},
				{ status: 500 }
			);
		}

		console.log("✅ Order created successfully:", orderRecord?.id);

		// The order takes over the customer's sign hold (the signs stay
		// blocked until check-in). No hold, no order: an order without signs
		// would let the same letters be booked twice.
		const { start, end } = rentalWindow(rules, eventDate, extraDaysBefore, extraDaysAfter);
		const { data: conversion, error: conversionError } = await supabase.rpc(
			"yce_convert_hold_to_order",
			{
				p_hold_id: holdId,
				p_agency_id: actualAgencyId,
				p_session_id: sessionId,
				p_order_id: orderRecord.id,
				p_rental_start: start,
				p_rental_end: end,
			}
		);
		let converted = (conversion as { ok?: boolean; reason?: string } | null);
		if (conversionError) {
			// The call may have committed and only the response was lost: if
			// the hold now belongs to this order, the conversion succeeded.
			const { data: ownHold } = await supabase
				.from("inventory_holds")
				.select("id")
				.eq("id", holdId)
				.eq("order_id", orderRecord.id)
				.eq("hold_type", "order")
				.maybeSingle();
			if (ownHold) converted = { ok: true };
		}
		if (!converted?.ok) {
			console.warn("⚠️ Hold conversion failed:", conversionError?.message ?? converted?.reason);
			const { error: deleteError } = await supabase.from("orders").delete().eq("id", orderRecord.id);
			if (deleteError) {
				console.error("❌ Could not roll back order without signs:", orderRecord.id, deleteError.message);
			}
			const reason = converted?.reason;
			return NextResponse.json(
				{
					success: false,
					error:
						reason === "insufficient_stock"
							? "Some of your signs were booked by someone else while your reservation was idle. Please go back and regenerate your layout."
							: reason === "dates_changed"
								? "Your dates changed after your signs were reserved. Please go back and regenerate your layout."
								: "Your sign reservation has ended. Please go back and regenerate your layout.",
				},
				{ status: 409 }
			);
		}

		// Send email notification to agency
		try {
			await sendOrderNotificationEmail({
				orderNumber: orderRecord.order_number,
				customerName: formData.contact.fullName,
				eventDate: eventDate.toISOString(),
				totalAmount: serverTotal,
				agencyName: agency.name,
				agencyEmail: agency.contactEmail || agency.email || 'no-email@agency.com',
				orderUrl: process.env.NEXT_PUBLIC_APP_URL
					? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/${agency.slug}/orders/${orderRecord.id}`
					: undefined,
			});
			console.log("📧 Order notification email sent successfully");
		} catch (emailError) {
			console.error("⚠️ Failed to send order notification email:", emailError);
			// Don't fail the order creation if email fails
		}

		// TODO: Send confirmation email to customer
		// TODO: Create calendar event for delivery

		return NextResponse.json({
			success: true,
			orderId: orderRecord.id,
			orderNumber: orderRecord.order_number,
			confirmationCode: confirmationCode, // Use generated code since it may not be stored in DB
		});
	} catch (error) {
		console.error("❌ Unexpected error creating order:", error);
		return NextResponse.json(
			{
				success: false,
				error: "An unexpected error occurred while creating your order",
			},
			{ status: 500 }
		);
	}
}

/**
 * Letters the text needs that the session's live hold doesn't cover, or
 * null when there is no such hold. Digits and their ordinal suffix ("16TH")
 * become number/ordinal signs, so only the remaining letters are counted.
 */
async function lettersMissingFromHold(
	holdId: string,
	agencyId: string,
	sessionId: string,
	texts: string[]
): Promise<string[] | null> {
	const { data: hold } = await supabase
		.from("inventory_holds")
		.select("id, inventory_hold_items(quantity, sign:sign_library(sign_type, character))")
		.eq("id", holdId)
		.eq("agency_id", agencyId)
		.eq("session_id", sessionId)
		.maybeSingle();
	if (!hold) return null;
	const held = new Map<string, number>();
	for (const item of (hold as any).inventory_hold_items ?? []) {
		if (item.sign?.sign_type !== "letter" || !item.sign.character) continue;
		const ch = String(item.sign.character).toUpperCase();
		held.set(ch, (held.get(ch) ?? 0) + (item.quantity ?? 1));
	}
	const missing: string[] = [];
	for (const text of texts) {
		const letters = text.toUpperCase().replace(/\d+(ST|ND|RD|TH)?/g, "").replace(/[^A-Z]/g, "");
		for (const ch of letters) {
			const left = held.get(ch) ?? 0;
			if (left > 0) held.set(ch, left - 1);
			else missing.push(ch);
		}
	}
	return missing;
}
