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

// BlackoutDate type
interface BlackoutDate {
	id: string;
	date: string;
	title: string;
	reason?: string;
	type: 'holiday' | 'maintenance' | 'vacation' | 'special_event';
}

// BookingRules type
interface BookingRules {
	minimumLeadTimeHours: number;
	maximumRentalDays: number;
	minimumRentalDays: number;
	allowSameDayBooking: boolean;
}

// BlackoutDatesTab Props
interface BlackoutDatesTabProps {
	blackoutDates: BlackoutDate[];
	setBlackoutDates: React.Dispatch<React.SetStateAction<BlackoutDate[]>>;
}

// BookingPoliciesTab Props
interface BookingPoliciesTabProps {
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
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Blackout Dates
				</h3>
				<p className="text-sm text-gray-600 mb-6">
					Block specific dates when your agency is unavailable for deliveries or pickups.
				</p>
			</div>

			<div className="space-y-4">
				{blackoutDates.map((blackoutDate) => (
					<div key={blackoutDate.id} className="p-4 border border-gray-200 rounded-lg">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Date
								</label>
								<input
									type="date"
									value={blackoutDate.date}
									onChange={(e) => updateBlackoutDate(blackoutDate.id, 'date', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Title
								</label>
								<input
									type="text"
									value={blackoutDate.title}
									onChange={(e) => updateBlackoutDate(blackoutDate.id, 'title', e.target.value)}
									placeholder="e.g., Christmas Day"
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Type
								</label>
								<select
									value={blackoutDate.type}
									onChange={(e) => updateBlackoutDate(blackoutDate.id, 'type', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
									className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md text-sm font-medium"
								>
									Remove
								</button>
							</div>
						</div>

						<div className="mt-4">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Reason (Optional)
							</label>
							<textarea
								value={blackoutDate.reason || ''}
								onChange={(e) => updateBlackoutDate(blackoutDate.id, 'reason', e.target.value)}
								placeholder="Optional description or reason for this blackout date"
								rows={2}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>
				))}

				{blackoutDates.length === 0 && (
					<div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
						<p className="text-gray-500 mb-4">No blackout dates configured</p>
						<button
							onClick={addBlackoutDate}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Add First Blackout Date
						</button>
					</div>
				)}

				{blackoutDates.length > 0 && (
					<button
						onClick={addBlackoutDate}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
	bookingRules,
	setBookingRules,
}) => {
	const updateBookingRule = useCallback((field: keyof BookingRules, value: number | boolean) => {
		setBookingRules(prev => ({
			...prev,
			[field]: value
		}));
	}, [setBookingRules]);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Booking Policies
				</h3>
				<p className="text-sm text-gray-600 mb-6">
					Set rules and restrictions for how customers can book your services.
				</p>
			</div>

			<div className="space-y-6">
				{/* Minimum Lead Time */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Minimum Lead Time
						</label>
						<div className="flex items-center space-x-3">
							<input
								type="number"
								value={bookingRules.minimumLeadTimeHours}
								onChange={(e) => updateBookingRule('minimumLeadTimeHours', parseInt(e.target.value) || 0)}
								min="0"
								max="168"
								className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
							<span className="text-sm text-gray-600">hours before rental start</span>
						</div>
						<p className="mt-1 text-xs text-gray-500">
							How far in advance customers must book (0-168 hours)
						</p>
					</div>

					{/* Same Day Booking Toggle */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Same-Day Booking
						</label>
						<div className="flex items-center space-x-3">
							<input
								type="checkbox"
								checked={bookingRules.allowSameDayBooking}
								onChange={(e) => updateBookingRule('allowSameDayBooking', e.target.checked)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<span className="text-sm text-gray-700">Allow same-day bookings</span>
						</div>
						<p className="mt-1 text-xs text-gray-500">
							Override lead time requirement for same-day requests
						</p>
					</div>
				</div>

				{/* Rental Duration Limits */}
				<div className="border-t pt-6">
					<h4 className="text-md font-medium text-gray-900 mb-4">Rental Duration Limits</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Minimum Rental Period
							</label>
							<div className="flex items-center space-x-3">
								<input
									type="number"
									value={bookingRules.minimumRentalDays}
									onChange={(e) => updateBookingRule('minimumRentalDays', parseInt(e.target.value) || 1)}
									min="1"
									max="7"
									className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
								<span className="text-sm text-gray-600">days</span>
							</div>
							<p className="mt-1 text-xs text-gray-500">
								Shortest rental period allowed (1-7 days)
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Maximum Rental Period
							</label>
							<div className="flex items-center space-x-3">
								<input
									type="number"
									value={bookingRules.maximumRentalDays}
									onChange={(e) => updateBookingRule('maximumRentalDays', parseInt(e.target.value) || 1)}
									min="1"
									max="30"
									className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
								<span className="text-sm text-gray-600">days</span>
							</div>
							<p className="mt-1 text-xs text-gray-500">
								Longest rental period allowed (1-30 days)
							</p>
						</div>
					</div>
				</div>

				{/* Validation Warning */}
				{bookingRules.maximumRentalDays < bookingRules.minimumRentalDays && (
					<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
						<div className="text-yellow-800 text-sm">
							⚠️ Maximum rental period must be greater than or equal to minimum rental period.
						</div>
					</div>
				)}

				{/* Business Rules Summary */}
				<div className="bg-gray-50 p-4 rounded-lg">
					<h4 className="text-sm font-medium text-gray-900 mb-2">Current Policy Summary</h4>
					<ul className="text-sm text-gray-600 space-y-1">
						<li>• Customers must book at least <strong>{bookingRules.minimumLeadTimeHours} hours</strong> in advance</li>
						<li>• Same-day booking: <strong>{bookingRules.allowSameDayBooking ? 'Allowed' : 'Not allowed'}</strong></li>
						<li>• Rental period: <strong>{bookingRules.minimumRentalDays} - {bookingRules.maximumRentalDays} days</strong></li>
					</ul>
				</div>
			</div>
		</div>
	);
};

interface AgencySettingsSectionProps {
	agency: AgencyWithProfile;
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
	timeZone: "America/New_York",
};

export default function AgencySettingsSection({
	agency,
}: AgencySettingsSectionProps) {
	const { user } = useUser();
	const [activeTab, setActiveTab] = useState("operating-hours");
	const [operatingHours, setOperatingHours] = useState<OperatingHours>(
		defaultOperatingHours
	);
	const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
	const [bookingRules, setBookingRules] = useState<BookingRules>({
		minimumLeadTimeHours: 48,
		maximumRentalDays: 14,
		minimumRentalDays: 1,
		allowSameDayBooking: false
	});
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
					if (result.success && result.data && Object.keys(result.data).length > 1) {
						setOperatingHours(result.data);
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
						setBookingRules(result.data);
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
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Operating Hours
				</h3>
				<p className="text-sm text-gray-600 mb-6">
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
								className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
							>
								<div className="w-24">
									<label className="text-sm font-medium text-gray-700 capitalize">
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
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<span className="text-sm text-gray-600">Open</span>
								</div>

								<div
									className={`flex items-center space-x-4 ${
										!dayHours.isOpen ? "opacity-50" : ""
									}`}
								>
									<div className="flex items-center space-x-2">
										<label className="text-sm text-gray-600">From:</label>
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
											className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										/>
									</div>

									<div className="flex items-center space-x-2">
										<label className="text-sm text-gray-600">To:</label>
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
											className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
										/>
									</div>
								</div>
							</div>
						);
					})}
			</div>

			<div className="mt-6">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Time Zone
				</label>
				<select
					value={operatingHours?.timeZone || "America/New_York"}
					onChange={(e) => {
						setOperatingHours((prev) => ({
							...prev,
							timeZone: e.target.value,
						}));
					}}
					className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="America/New_York">Eastern Time (ET)</option>
					<option value="America/Chicago">Central Time (CT)</option>
					<option value="America/Denver">Mountain Time (MT)</option>
					<option value="America/Los_Angeles">Pacific Time (PT)</option>
				</select>
			</div>

			{validationErrors.length > 0 && (
				<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
					<div className="text-red-800 text-sm">
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
			<h3 className="text-lg font-semibold text-gray-900 mb-2">
				Booking Policies
			</h3>
			<p className="text-gray-600">Coming soon in Phase 3B</p>
		</div>
	);

	const CustomerExperienceTab = () => (
		<div className="text-center py-12">
			<h3 className="text-lg font-semibold text-gray-900 mb-2">
				Customer Experience
			</h3>
			<p className="text-gray-600">Coming soon in Phase 3B</p>
		</div>
	);

	const NotificationSettingsTab = () => (
		<div className="text-center py-12">
			<h3 className="text-lg font-semibold text-gray-900 mb-2">
				Notification Settings
			</h3>
			<p className="text-gray-600">Coming soon in Phase 3B</p>
		</div>
	);

	const tabs: Tab[] = [
		{
			id: "operating-hours",
			name: "Operating Hours",
			content: <OperatingHoursTab />,
		},
		{
			id: "blackout-dates",
			name: "Blackout Dates",
			content: <BlackoutDatesTab blackoutDates={blackoutDates} setBlackoutDates={setBlackoutDates} />,
		},
		{ 
			id: "policies", 
			name: "Policies", 
			content: <BookingPoliciesTab bookingRules={bookingRules} setBookingRules={setBookingRules} /> 
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
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
					<div className="space-y-4">
						<div className="h-4 bg-gray-200 rounded w-3/4"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2"></div>
						<div className="h-4 bg-gray-200 rounded w-2/3"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200">
			<div className="border-b border-gray-200 p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-2">
					Agency Settings
				</h2>
				<p className="text-gray-600">
					Configure your agency's operational parameters and business rules.
				</p>
			</div>

			{/* Tab Navigation */}
			<div className="border-b border-gray-200">
				<nav
					className="-mb-px flex space-x-8 px-6"
					aria-label="Tabs"
				>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`py-4 px-1 border-b-2 font-medium text-sm ${
								activeTab === tab.id
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
			<div className="border-t border-gray-200 p-6">
				<div className="flex items-center justify-between">
					<div>
						{saveMessage && (
							<div
								className={`text-sm ${
									saveMessage.includes("success")
										? "text-green-600"
										: "text-red-600"
								}`}
							>
								{saveMessage}
							</div>
						)}
						{validationErrors.length > 0 && (
							<div className="text-sm text-red-600">
								Please fix validation errors before saving.
							</div>
						)}
					</div>

					<button
						onClick={handleSave}
						disabled={isSaving}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						role="button"
						aria-label="Save Settings"
					>
						{isSaving ? "Saving..." : "Save Settings"}
					</button>
				</div>
			</div>
		</div>
	);
}
