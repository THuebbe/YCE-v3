import { NextRequest, NextResponse } from "next/server";
import { supabase, getAgencyBySlug } from "@/lib/db/supabase-client";
import { BookingOrderResult } from "@/features/booking/types";
import { createOrderFromPayload, resumeCardCheckout, startCardCheckout, type CheckoutOutcome, type OrderPayload } from "@/features/booking/checkout";
import { calculateBookingTotal, parseBookingPricing } from "@/features/booking/pricing";
import { buildBookingTerms, TERMS_VERSION } from "@/features/booking/terms";
import { parseBookingRules, rentalWindow, resolveTimeZone, todayIn, validateBookingDates } from "@/features/booking/booking-rules";
import { z } from "zod";
import { subscriptionAllowsBookings } from "@/features/billing/subscription";

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
	/** Card collected on the Payment step (Stripe ConfirmationToken), for agencies on Stripe */
	confirmationTokenId: z.string().startsWith("ctoken_").optional(),
	agencySlug: z.string().min(1, "Agency slug is required"),
	totalAmount: z.number().positive("Total amount must be positive"),
	/** The booking terms checkbox on the Review step, and which terms it showed */
	termsAccepted: z.literal(true, { errorMap: () => ({ message: "Please agree to the booking terms" }) }),
	termsVersion: z.string().min(1),
	termsLateFee: z.number().min(0),
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

		const { formData, holdId, sessionId, timeZone, paymentIntentId, confirmationTokenId, agencySlug, totalAmount, termsVersion, termsLateFee } =
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

		// No new bookings without a paid-up subscription. A card payment already
		// made (3-D Secure return) is still finished below, so it gets its order.
		const resumingPayment = paymentIntentId.startsWith("pi_") && !paymentIntentId.startsWith("pi_mock");
		if (!resumingPayment && !subscriptionAllowsBookings(agency)) {
			return NextResponse.json({
				success: false,
				error: "This agency isn't taking online bookings right now, so nothing was charged. Please contact them directly."
			}, { status: 409 });
		}

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

		// The terms are the agency's too: the customer must have agreed to the
		// ones in force now (a late-fee change mid-booking means a new text)
		if (termsVersion !== TERMS_VERSION || Math.abs(termsLateFee - pricing.lateFee) > 0.005) {
			return NextResponse.json({
				success: false,
				error: "This agency's booking terms were updated while you were booking. Please refresh the page and review them."
			}, { status: 409 });
		}
		const method = formData.payment?.paymentMethod || "card";
		const stripeReady = Boolean(agency.stripe_account_id && agency.stripe_charges_enabled);
		const terms = buildBookingTerms({ agencyName: agency.name, pricing, paysByCard: stripeReady && method === "card" });

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

		// The order as it will be saved (number, code and payment are added when
		// it is created: now for demo checkouts, after the charge for cards)
		const order = {
			agency_id: actualAgencyId,
			status: "pending",
			total: serverTotal,
			subtotal: serverTotal,
			customer_name: formData.contact.fullName,
			customer_email: formData.contact.email,
			customer_phone: formData.contact.phone,
			event_date: eventDate.toISOString(),
			event_address: formData.event.deliveryAddress
				? `${formData.event.deliveryAddress.street}, ${formData.event.deliveryAddress.city}, ${formData.event.deliveryAddress.state} ${formData.event.deliveryAddress.zipCode}`
				: "Address not provided",
			delivery_time: formData.event.timeWindow || null,
			delivery_notes: formData.event.deliveryNotes || null,
			message: formData.display.eventMessage || "Event Message",
			message_text:
				formData.display.eventMessage === "Custom Message"
					? formData.display.customMessage
					: formData.display.eventMessage,
			theme: formData.display.characterTheme || null,
			extra_days: extraDaysBefore + extraDaysAfter,
			extra_day_fee: (extraDaysBefore + extraDaysAfter) * pricing.extraDayPrice,
			extraDaysBefore,
			extraDaysAfter,
			holdId,
			special_instructions: formData.event.deliveryNotes || null,
			// Consent for later late/damage charges, and chargeback evidence
			terms_accepted_at: new Date().toISOString(),
			terms_snapshot: terms,
		};
		const { start, end } = rentalWindow(rules, eventDate, extraDaysBefore, extraDaysAfter);
		const payload: OrderPayload = {
			order,
			agency: { id: actualAgencyId, slug: agency.slug, name: agency.name, email: agency.contactEmail || agency.email || null },
			holdId,
			sessionId,
			rentalStart: start,
			rentalEnd: end,
			totalDollars: serverTotal,
			customerName: formData.contact.fullName,
			eventDateIso: eventDate.toISOString(),
		};

		// Agencies that finished Stripe setup take real card payments (direct
		// charges to their account). Everyone else still gets the no-charge demo
		// checkout until the setup checklist gates bookings (milestone 4).
		// A real card from Stripe's form (token or 3-D Secure payment) must be
		// charged or refused - never turned into an unpaid demo order. Happens if
		// the agency's Stripe status changes mid-booking.
		const cardFromStripe = Boolean(confirmationTokenId) || (paymentIntentId.startsWith("pi_") && !paymentIntentId.startsWith("pi_mock"));
		if (cardFromStripe && !(stripeReady && method === "card")) {
			console.warn("Card payment for an agency not ready for cards:", { agencySlug, stripeReady, method });
			return NextResponse.json({
				success: false,
				error: "This agency can't take card payments right now, so your card was not charged. Please try again later or contact the agency."
			}, { status: 409 });
		}
		if (stripeReady && method === "card") {
			const stripeAgency = { stripe_account_id: agency.stripe_account_id, stripe_account_type: agency.stripe_account_type };
			let outcome: CheckoutOutcome;
			if (paymentIntentId.startsWith("pi_") && !paymentIntentId.startsWith("pi_mock")) {
				outcome = await resumeCardCheckout({ agency: stripeAgency, agencyId: actualAgencyId, sessionId, paymentIntentId });
			} else if (confirmationTokenId) {
				const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
				outcome = await startCardCheckout({
					agency: stripeAgency,
					payload,
					confirmationTokenId,
					customer: { name: formData.contact.fullName, email: formData.contact.email, phone: formData.contact.phone },
					returnUrl: `${origin}/${agency.slug}/booking`,
				});
			} else {
				return NextResponse.json({
					success: false,
					error: "Please go back to Payment and enter your card.",
				}, { status: 400 });
			}
			return checkoutResponse(outcome);
		}

		const outcome = await createOrderFromPayload(payload, {
			method: formData.payment?.paymentMethod || null,
			intentId: paymentIntentId,
			status: "pending",
		});
		return checkoutResponse(outcome);
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

function checkoutResponse(outcome: CheckoutOutcome): NextResponse<BookingOrderResult> {
	if (outcome.ok) {
		return NextResponse.json({
			success: true,
			orderId: outcome.orderId,
			orderNumber: outcome.orderNumber,
			confirmationCode: outcome.confirmationCode,
		});
	}
	if ("requiresAction" in outcome) {
		// 3-D Secure: the page asks the customer, then sends paymentIntentId back
		return NextResponse.json({
			success: false,
			requiresAction: true,
			clientSecret: outcome.clientSecret,
			paymentIntentId: outcome.paymentIntentId,
		});
	}
	return NextResponse.json({ success: false, error: outcome.error }, { status: outcome.status });
}
