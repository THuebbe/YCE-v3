"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
// Agency interface - only needs id property for API calls
interface AgencyWithProfile {
	id: string;
	name?: string;
	slug?: string;
}
import {
	OperatingHours,
	operatingHoursSchema,
} from "../validation/agencySettings";
import { AGENCY_TIME_ZONES } from "@/lib/time-zones";
import {
	DEFAULT_BOOKING_RULES,
	parseBookingRules,
	type BookingRules as SharedBookingRules,
} from "@/features/booking/booking-rules";

// BlackoutDate type
interface BlackoutDate {
	id: string;
	date: string;
	title: string;
	reason?: string;
	type: 'holiday' | 'maintenance' | 'vacation' | 'special_event';
}

// BookingRules: the shape the booking wizard enforces (features/booking/booking-rules.ts).
// setupDays/teardownDays have no UI yet (permissions stage) but are carried
// through so saving doesn't reset them.
type BookingRules = SharedBookingRules;

// BlackoutDatesTab Props
interface BlackoutDatesTabProps {
	blackoutDates: BlackoutDate[];
	setBlackoutDates: React.Dispatch<React.SetStateAction<BlackoutDate[]>>;
}

// BookingPoliciesTab Props
interface BookingPoliciesTabProps {
	/** Elite only; Essentials sees the standard rules */
	canEdit: boolean;
	bookingRules: BookingRules;
	setBookingRules: React.Dispatch<React.SetStateAction<BookingRules>>;
}

// Separate BlackoutDatesTab Component
const BlackoutDatesTab: React.FC<BlackoutDatesTabProps> = ({
	blackoutDates,
	setBlackoutDates,
}) => {
	const addBlackoutDate = useCallback(() => {
		const newBlackoutDate: BlackoutDate = {
			id: crypto.randomUUID(),
			date: '',
			title: '',
			reason: '',
			type: 'holiday'
		};
		setBlackoutDates(prev => [...prev, newBlackoutDate]);
	}, [setBlackoutDates]);

	const updateBlackoutDate = useCallback((id: string, field: keyof BlackoutDate, value: string) => {
		setBlackoutDates(prev => 
			prev.map(date => 
				date.id === id ? { ...date, [field]: value } : date
			)
		);
	}, [setBlackoutDates]);

	const removeBlackoutDate = useCallback((id: string) => {
		setBlackoutDates(prev => prev.filter(date => date.id !== id));
	}, [setBlackoutDates]);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="mb-4 font-display text-lead font-semibold text-fg">
					Blackout Dates
				</h3>
				<p className="text-fine text-fg-muted mb-6">
					Block specific dates when your agency is unavailable for deliveries or pickups.
				</p>
			</div>

			<div className="space-y-4">
				{blackoutDates.map((blackoutDate) => (
					<div key={blackoutDate.id} className="p-4 border border-line rounded-card">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-fine font-medium text-fg mb-1">
									Date
								</label>
								<input
									type="date"
									value={blackoutDate.date}
									onChange={(e) => updateBlackoutDate(blackoutDate.id, 'date', e.target.value)}
									className="w-full px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
								/>
							</div>

							<div>
								<label className="block text-fine font-medium text-fg mb-1">
									Title
								</label>
								<input
									type="text"
									value={blackoutDate.title}
									onChange={(e) => updateBlackoutDate(blackoutDate.id, 'title', e.target.value)}
									placeholder="e.g., Christmas Day"
									className="w-full px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
								/>
							</div>

							<div>
								<label className="block text-fine font-medium text-fg mb-1">
									Type
								</label>
								<select
									value={blackoutDate.type}
									onChange={(e) => updateBlackoutDate(blackoutDate.id, 'type', e.target.value)}
									className="w-full px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
								>
									<option value="holiday">Holiday</option>
									<option value="maintenance">Maintenance</option>
									<option value="vacation">Vacation</option>
									<option value="special_event">Special Event</option>
								</select>
							</div>

							<div className="flex items-end">
								<button
									onClick={() => removeBlackoutDate(blackoutDate.id)}
									className="px-3 py-2 text-danger hover:text-danger hover:bg-danger-soft rounded-control text-fine font-medium"
								>
									Remove
								</button>
							</div>
						</div>

						<div className="mt-4">
							<label className="block text-fine font-medium text-fg mb-1">
								Reason (Optional)
							</label>
							<textarea
								value={blackoutDate.reason || ''}
								onChange={(e) => updateBlackoutDate(blackoutDate.id, 'reason', e.target.value)}
								placeholder="Optional description or reason for this blackout date"
								rows={2}
								className="w-full px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
							/>
						</div>
					</div>
				))}

				{blackoutDates.length === 0 && (
					<div className="text-center py-8 border border-dashed border-line-strong rounded-card">
						<p className="text-fg-muted mb-4">No blackout dates configured</p>
						<button
							onClick={addBlackoutDate}
							className="px-4 py-2 bg-action text-on-action rounded-card hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
						>
							Add First Blackout Date
						</button>
					</div>
				)}

				{blackoutDates.length > 0 && (
					<button
						onClick={addBlackoutDate}
						className="px-4 py-2 bg-action text-on-action rounded-card hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
					>
						Add Another Blackout Date
					</button>
				)}
			</div>
		</div>
	);
};

// Separate BookingPoliciesTab Component
const BookingPoliciesTab: React.FC<BookingPoliciesTabProps> = ({
	canEdit,
	bookingRules: storedRules,
	setBookingRules,
}) => {
	const bookingRules = canEdit ? storedRules : DEFAULT_BOOKING_RULES;
	const updateBookingRule = useCallback((field: keyof BookingRules, value: number | boolean) => {
		setBookingRules(prev => ({
			...prev,
			[field]: value
		}));
	}, [setBookingRules]);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="mb-4 font-display text-lead font-semibold text-fg">
					Booking Policies
				</h3>
				<p className="text-fine text-fg-muted mb-6">
					Set rules and restrictions for how customers can book your services.
				</p>
				{!canEdit && (
					<p className="mb-6 rounded-card bg-surface-sunken p-3 text-fine text-fg">
						🔒 Your bookings use the standard rules below. Setting your own is part of the Elite plan (Billing).
						Blackout dates work on every plan.
					</p>
				)}
			</div>

			<fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-60">
				{/* Order Cutoff */}
				<div>
					<label className="block text-fine font-medium text-fg mb-2">
						Order Cutoff
					</label>
					<div className="flex items-center space-x-3">
						<input
							type="number"
							value={bookingRules.orderCutoffDays}
							onChange={(e) => updateBookingRule('orderCutoffDays', Math.max(0, parseInt(e.target.value) || 0))}
							min="0"
							max="30"
							className="w-24 px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
						/>
						<span className="text-fine text-fg-muted">days before delivery</span>
					</div>
					<p className="mt-1 text-fine text-fg-muted">
						Customers must order by the end of this day. With 1, a Saturday event (delivered Friday) can be booked until Thursday night. 0 allows ordering on the delivery day.
					</p>
				</div>

				{/* Rental Duration Limits */}
				<div className="border-t pt-6">
					<h4 className="text-md font-medium text-fg mb-4">Rental Duration Limits</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-fine font-medium text-fg mb-2">
								Minimum Rental Period
							</label>
							<div className="flex items-center space-x-3">
								<input
									type="number"
									value={bookingRules.minimumRentalDays}
									onChange={(e) => updateBookingRule('minimumRentalDays', parseInt(e.target.value) || 1)}
									min="1"
									max="7"
									className="w-24 px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
								/>
								<span className="text-fine text-fg-muted">days</span>
							</div>
							<p className="mt-1 text-fine text-fg-muted">
								Shortest rental period allowed (1-7 days)
							</p>
						</div>

						<div>
							<label className="block text-fine font-medium text-fg mb-2">
								Maximum Rental Period
							</label>
							<div className="flex items-center space-x-3">
								<input
									type="number"
									value={bookingRules.maximumRentalDays}
									onChange={(e) => updateBookingRule('maximumRentalDays', parseInt(e.target.value) || 1)}
									min="1"
									max="30"
									className="w-24 px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
								/>
								<span className="text-fine text-fg-muted">days</span>
							</div>
							<p className="mt-1 text-fine text-fg-muted">
								Longest rental period allowed (1-30 days)
							</p>
						</div>
					</div>
				</div>

				{/* Validation Warning */}
				{bookingRules.maximumRentalDays < bookingRules.minimumRentalDays && (
					<div className="p-4 bg-caution-soft border border-caution/30 rounded-control">
						<div className="text-caution text-fine">
							⚠️ Maximum rental period must be greater than or equal to minimum rental period.
						</div>
					</div>
				)}

				{/* Business Rules Summary */}
				<div className="bg-surface-sunken p-4 rounded-card">
					<h4 className="text-fine font-medium text-fg mb-2">Current Policy Summary</h4>
					<ul className="text-fine text-fg-muted space-y-1">
						<li>• Orders close at the end of the day <strong>{bookingRules.orderCutoffDays} day{bookingRules.orderCutoffDays === 1 ? '' : 's'}</strong> before delivery</li>
						<li>• Signs go out <strong>{bookingRules.setupDays} day{bookingRules.setupDays === 1 ? '' : 's'}</strong> before the event and come back <strong>{bookingRules.teardownDays} day{bookingRules.teardownDays === 1 ? '' : 's'}</strong> after (no charge)</li>
						<li>• Rental period: <strong>{bookingRules.minimumRentalDays} - {bookingRules.maximumRentalDays} days</strong></li>
					</ul>
				</div>
			</fieldset>
		</div>
	);
};

interface AgencySettingsSectionProps {
	agency: AgencyWithProfile;
	/** Elite: the agency sets its own booking rules */
	canEditBookingRules: boolean;
}

interface Tab {
	id: string;
	name: string;
	content: React.ReactNode;
}

// Default operating hours for this component
const defaultOperatingHours: OperatingHours = {
	monday: { open: "09:00", close: "17:00", isOpen: true },
	tuesday: { open: "09:00", close: "17:00", isOpen: true },
	wednesday: { open: "09:00", close: "17:00", isOpen: true },
	thursday: { open: "09:00", close: "17:00", isOpen: true },
	friday: { open: "09:00", close: "17:00", isOpen: true },
	saturday: { open: "10:00", close: "16:00", isOpen: true },
	sunday: { open: "12:00", close: "16:00", isOpen: false },
	timeZone: "", // never assumed - the agency picks it
};

export default function AgencySettingsSection({
	agency,
	canEditBookingRules,
}: AgencySettingsSectionProps) {
	const { user } = useUser();
	const [activeTab, setActiveTab] = useState("operating-hours");
	const [operatingHours, setOperatingHours] = useState<OperatingHours>(
		defaultOperatingHours
	);
	const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
	const [bookingRules, setBookingRules] = useState<BookingRules>(DEFAULT_BOOKING_RULES);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);

	// Load agency operating hours on mount
	useEffect(() => {
		const loadOperatingHours = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(
					`/api/agency/operating-hours?agencyId=${agency.id}`
				);

				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						setOperatingHours({ ...defaultOperatingHours, ...result.data });
					} else {
						setOperatingHours(defaultOperatingHours);
					}
				} else {
					console.error("API response not ok:", response.status);
					setOperatingHours(defaultOperatingHours);
				}
			} catch (error) {
				console.error("Failed to load operating hours:", error);
				setOperatingHours(defaultOperatingHours);
			} finally {
				setIsLoading(false);
			}
		};

		loadOperatingHours();
	}, [agency.id]);

	// Load agency blackout dates on mount
	useEffect(() => {
		const loadBlackoutDates = async () => {
			try {
				const response = await fetch(
					`/api/agency/blackout-dates?agencyId=${agency.id}`
				);

				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						setBlackoutDates(result.data);
					} else {
						setBlackoutDates([]);
					}
				} else {
					console.error("API response not ok:", response.status);
					setBlackoutDates([]);
				}
			} catch (error) {
				console.error("Failed to load blackout dates:", error);
				setBlackoutDates([]);
			}
		};

		loadBlackoutDates();
	}, [agency.id]);

	// Load agency booking rules on mount
	useEffect(() => {
		const loadBookingRules = async () => {
			try {
				const response = await fetch(
					`/api/agency/booking-rules?agencyId=${agency.id}`
				);

				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) {
						setBookingRules(parseBookingRules(result.data));
					}
				} else {
					console.error("API response not ok:", response.status);
				}
			} catch (error) {
				console.error("Failed to load booking rules:", error);
			}
		};

		loadBookingRules();
	}, [agency.id]);

	// Operating Hours Component (Phase 3A focus)
	const OperatingHoursTab = () => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-4 font-display text-lead font-semibold text-fg">
					Operating Hours
				</h3>
				<p className="text-fine text-fg-muted mb-6">
					Configure your business hours and availability for each day of the
					week.
				</p>
			</div>

			<div className="space-y-4">
				{operatingHours &&
					Object.entries(operatingHours).map(([day, hours]) => {
						if (day === "timeZone") return null;

						const dayHours = hours as {
							open?: string;
							close?: string;
							isOpen: boolean;
						};

						return (
							<div
								key={day}
								className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 border border-line rounded-card"
							>
								<div className="w-24">
									<label className="text-fine font-medium text-fg capitalize">
										{day}
									</label>
								</div>

								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={dayHours.isOpen}
										onChange={(e) => {
											setOperatingHours(prev => ({
												...prev,
												[day]: {
													open: dayHours.open || "09:00",
													close: dayHours.close || "17:00",
													isOpen: e.target.checked
												}
											}));
										}}
										className="h-4 w-4 text-notice focus:ring-focus border-line-strong rounded"
									/>
									<span className="text-fine text-fg-muted">Open</span>
								</div>

								{/* On a phone From and To each get a full-width line; a time
								    field needs ~120px and two side by side don't fit */}
								<div
									className={`flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4 ${
										!dayHours.isOpen ? "opacity-50" : ""
									}`}
								>
									<div className="flex items-center gap-2">
										<label className="w-12 text-fine text-fg-muted sm:w-auto">From:</label>
										<input
											type="time"
											value={dayHours.open || ""}
											disabled={!dayHours.isOpen}
											onChange={(e) => {
												setOperatingHours(prev => ({
													...prev,
													[day]: {
														open: e.target.value,
														close: dayHours.close || "17:00",
														isOpen: dayHours.isOpen
													}
												}));
											}}
											data-testid={`${day}-open-time`}
											className="min-w-0 flex-1 px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus disabled:bg-surface-sunken disabled:cursor-not-allowed sm:flex-none"
										/>
									</div>

									<div className="flex items-center gap-2">
										<label className="w-12 text-fine text-fg-muted sm:w-auto">To:</label>
										<input
											type="time"
											value={dayHours.close || ""}
											disabled={!dayHours.isOpen}
											onChange={(e) => {
												setOperatingHours(prev => ({
													...prev,
													[day]: {
														open: dayHours.open || "09:00",
														close: e.target.value,
														isOpen: dayHours.isOpen
													}
												}));
											}}
											data-testid={`${day}-close-time`}
											className="min-w-0 flex-1 px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus disabled:bg-surface-sunken disabled:cursor-not-allowed sm:flex-none"
										/>
									</div>
								</div>
							</div>
						);
					})}
			</div>

			<div className="mt-6">
				<label className="block text-fine font-medium text-fg mb-2">
					Time Zone
				</label>
				<select
					value={operatingHours?.timeZone || ""}
					onChange={(e) => {
						setOperatingHours((prev) => ({
							...prev,
							timeZone: e.target.value,
						}));
					}}
					className="px-3 py-2 border border-line-strong rounded-control shadow-raised focus:outline-none focus:ring-focus focus:border-focus"
				>
					<option value="" disabled>
						Not set - choose your time zone
					</option>
					{AGENCY_TIME_ZONES.map((zone) => (
						<option key={zone.value} value={zone.value}>
							{zone.label}
						</option>
					))}
				</select>
				<p className="mt-1 text-fine text-fg-muted">
					Booking cutoffs (&quot;order by end of day&quot;) use this time zone.
					{!operatingHours?.timeZone && " Until you set it, the customer's own time zone is used."}
				</p>
			</div>

			{validationErrors.length > 0 && (
				<div className="mt-4 p-4 bg-danger-soft border border-danger/30 rounded-control">
					<div className="text-danger text-fine">
						{validationErrors.map((error, idx) => (
							<div key={idx}>{error}</div>
						))}
					</div>
				</div>
			)}
		</div>
	);

	// Placeholder components for other tabs

	const PoliciesTab = () => (
		<div className="text-center py-12">
			<h3 className="mb-2 font-display text-lead font-semibold text-fg">
				Booking Policies
			</h3>
			<p className="text-fg-muted">Coming soon in Phase 3B</p>
		</div>
	);

	const CustomerExperienceTab = () => (
		<div className="text-center py-12">
			<h3 className="mb-2 font-display text-lead font-semibold text-fg">
				Customer Experience
			</h3>
			<p className="text-fg-muted">Coming soon in Phase 3B</p>
		</div>
	);

	const NotificationSettingsTab = () => (
		<div className="text-center py-12">
			<h3 className="mb-2 font-display text-lead font-semibold text-fg">
				Notification Settings
			</h3>
			<p className="text-fg-muted">Coming soon in Phase 3B</p>
		</div>
	);

	const tabs: Tab[] = [
		{
			id: "operating-hours",
			name: "Hours",
			content: <OperatingHoursTab />,
		},
		{
			id: "blackout-dates",
			name: "Days off",
			content: <BlackoutDatesTab blackoutDates={blackoutDates} setBlackoutDates={setBlackoutDates} />,
		},
		{ 
			id: "policies", 
			name: "Booking rules", 
			content: <BookingPoliciesTab canEdit={canEditBookingRules} bookingRules={bookingRules} setBookingRules={setBookingRules} /> 
		},
		// Future features - hidden for now
		// {
		// 	id: "customer-experience",
		// 	name: "Customer Experience", 
		// 	content: <CustomerExperienceTab />,
		// },
		// {
		// 	id: "notifications",
		// 	name: "Notification Settings",
		// 	content: <NotificationSettingsTab />,
		// },
	];

	const handleSave = async () => {
		try {
			setIsSaving(true);
			setSaveMessage(null);
			setValidationErrors([]);

			let response;
			let dataToSave;
			let endpoint;
			let successMessage;

			if (activeTab === 'operating-hours') {
				// Save operating hours
				if (!operatingHours) {
					setSaveMessage("Operating hours data is missing");
					return;
				}
				dataToSave = operatingHours;
				endpoint = `/api/agency/operating-hours?agencyId=${agency.id}`;
				successMessage = "Operating hours saved successfully!";
			} else if (activeTab === 'blackout-dates') {
				// Save blackout dates
				dataToSave = blackoutDates;
				endpoint = `/api/agency/blackout-dates?agencyId=${agency.id}`;
				successMessage = "Blackout dates saved successfully!";
			} else if (activeTab === 'policies') {
				if (!canEditBookingRules) {
					setSaveMessage("Setting your own booking rules is part of the Elite plan");
					return;
				}
				// Save booking policies
				dataToSave = bookingRules;
				endpoint = `/api/agency/booking-rules?agencyId=${agency.id}`;
				successMessage = "Booking policies saved successfully!";
			} else {
				setSaveMessage("This tab doesn't support saving yet");
				return;
			}

			response = await fetch(endpoint, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(dataToSave),
			});

			const result = await response.json();
			console.log("Save response:", result);

			if (result.success) {
				setSaveMessage(successMessage);
				setTimeout(() => setSaveMessage(null), 3000);
			} else {
				console.error("Save failed:", result);
				if (result.details) {
					console.log("Validation errors:", result.details);
					const errorMessages = result.details.map(
						(detail: { field: string; message: string }) => {
							console.log(
								`Validation error - Field: ${detail.field}, Message: ${detail.message}`
							);
							return `${detail.field}: ${detail.message}`;
						}
					);
					setValidationErrors(errorMessages);
					setSaveMessage(
						`Validation failed: ${result.details.length} error(s) found`
					);
				} else {
					setSaveMessage(result.error || "Failed to save data");
				}
			}
		} catch (error) {
			console.error("Failed to save data:", error);
			setSaveMessage("Network error occurred");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="bg-surface rounded-card border border-line p-6">
				<div className="animate-pulse">
					<div className="h-8 bg-surface-sunken rounded w-1/4 mb-6"></div>
					<div className="space-y-4">
						<div className="h-4 bg-surface-sunken rounded w-3/4"></div>
						<div className="h-4 bg-surface-sunken rounded w-1/2"></div>
						<div className="h-4 bg-surface-sunken rounded w-2/3"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-surface rounded-card border border-line">
			<div className="border-b border-line p-6">
				<h2 className="mb-1 font-display text-heading font-semibold text-fg">
					Hours and availability
				</h2>
				<p className="text-fg-muted">
					When you work, the days you're closed, and how far ahead customers can book.
				</p>
			</div>

			{/* Tab Navigation */}
			<div className="border-b border-line">
				<nav
					className="-mb-px flex space-x-8 px-6"
					aria-label="Tabs"
				>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`py-4 px-1 border-b-2 font-medium text-fine ${
								activeTab === tab.id
									? "border-action text-notice"
									: "border-transparent text-fg-muted hover:text-fg hover:border-line-strong"
							}`}
							role="tab"
							aria-selected={activeTab === tab.id}
						>
							{tab.name}
						</button>
					))}
				</nav>
			</div>

			{/* Tab Content */}
			<div className="p-6">
				{tabs.find((tab) => tab.id === activeTab)?.content}
			</div>

			{/* Save Button */}
			<div className="border-t border-line p-6">
				<div className="flex items-center justify-between">
					<div>
						{saveMessage && (
							<div
								className={`text-fine ${
									saveMessage.includes("success")
										? "text-positive"
										: "text-danger"
								}`}
							>
								{saveMessage}
							</div>
						)}
						{validationErrors.length > 0 && (
							<div className="text-fine text-danger">
								Please fix validation errors before saving.
							</div>
						)}
					</div>

					<button
						onClick={handleSave}
						disabled={isSaving}
						className="px-6 py-2 bg-action text-on-action rounded-card hover:bg-action-hover focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						role="button"
						aria-label="Save Settings"
					>
						{isSaving ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
