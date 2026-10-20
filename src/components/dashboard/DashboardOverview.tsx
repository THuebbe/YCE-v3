"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAgencySlug } from "@/lib/navigation";
import type { PopularDisplays } from "@/features/dashboard/types";
import { MetricCard } from "./MetricCard";

interface DashboardData {
	openOrders: number;
	upcomingOrders: Array<{
		id: string;
		customer_name: string;
		event_date: string;
		status: "pending" | "processing" | "deployed";
		signCount: number;
	}>;
	/** Elite only; null on Essentials */
	popular: PopularDisplays | null;
	revenue: {
		current: number;
		previous: number;
		change: number;
	};
}

interface DashboardOverviewProps {
	className?: string;
}

export function DashboardOverview({ className = "" }: DashboardOverviewProps) {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [popularView, setPopularView] = useState<"occasions" | "themes">("occasions");
	const agencySlug = useAgencySlug();

	useEffect(() => {
		async function fetchDashboardData() {
			try {
				setLoading(true);
				setError(null);

				// Fetch real data from API
				const response = await fetch("/api/dashboard");

				if (!response.ok) {
					throw new Error(`API error: ${response.status}`);
				}

				const apiData = await response.json();

				// Transform API data to component format
				const dashboardData: DashboardData = {
					openOrders: apiData.openOrders || 0,
					upcomingOrders: apiData.upcomingOrders || [],
					popular: apiData.popular ?? null,
					revenue: {
						current: apiData.revenue?.current || 0,
						previous: apiData.revenue?.previous || 0,
						change: apiData.revenue?.change || 0,
					},
				};

				setData(dashboardData);
			} catch (err) {
				console.error("Dashboard data fetch error:", err);
				setError("Failed to load dashboard data");

				// Show empty cards if the API fails
				const fallbackData: DashboardData = {
					openOrders: 0,
					upcomingOrders: [],
					popular: null,
					revenue: {
						current: 0,
						previous: 0,
						change: 0,
					},
				};
				setData(fallbackData);
			} finally {
				setLoading(false);
			}
		}

		fetchDashboardData();
	}, []);

	const getOrderColorScheme = (count: number) => {
		if (count <= 5) return "success";
		if (count <= 10) return "warning";
		return "error";
	};

	const popularItems = data?.popular?.[popularView] ?? [];

	if (error) {
		return (
			<div className={`bg-white rounded-2xl shadow-default p-6 ${className}`}>
				<div className="text-center">
					<div className="text-error-red text-2xl mb-2">⚠️</div>
					<h3 className="text-lg font-semibold text-neutral-900 mb-2">
						Unable to load data
					</h3>
					<p className="text-neutral-600 mb-4">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={`h-full ${className}`}>
			{/* Dashboard Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
				{/* Upcoming Orders Card */}
				<div className="bg-white rounded-2xl shadow-default p-6 border border-neutral-100 h-full flex flex-col">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-xl font-semibold text-neutral-900">
							Upcoming Orders
						</h3>
						{data && data.upcomingOrders.length > 3 && (
							<button className="text-primary hover:text-primary-hover font-medium text-sm transition-colors">
								View All
							</button>
						)}
					</div>

					<div className="flex-1">
						{loading ? (
							<div className="space-y-4">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="animate-pulse"
									>
										<div className="h-4 bg-neutral-100 rounded w-1/3 mb-2"></div>
										<div className="h-3 bg-neutral-100 rounded w-1/2"></div>
									</div>
								))}
							</div>
						) : data?.upcomingOrders.length ? (
							<div className="space-y-4">
								{data.upcomingOrders.slice(0, 5).map((order) => (
									<div
										key={order.id}
										className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0"
									>
										<div>
											<h4 className="font-medium text-neutral-900">
												{order.customer_name}
											</h4>
											<p className="text-sm text-neutral-600">
												{order.signCount} signs •{" "}
												{new Date(order.event_date).toLocaleDateString()}
											</p>
										</div>
										<span
											className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
												order.status === "pending"
													? "bg-accent-yellow/10 text-accent-yellow"
													: order.status === "processing"
													? "bg-accent-blue/10 text-accent-blue"
													: "bg-accent-green/10 text-accent-green"
											}`}
										>
											{order.status.charAt(0).toUpperCase() +
												order.status.slice(1)}
										</span>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<div className="text-4xl mb-4">📅</div>
								<h4 className="text-lg font-medium text-neutral-900 mb-2">
									No upcoming orders
								</h4>
								<p className="text-neutral-600">
									Share your booking link to get started!
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Popular Displays Card (Elite) */}
				<div className="bg-white rounded-2xl shadow-default p-6 border border-neutral-100 h-full flex flex-col">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-xl font-semibold text-neutral-900">
							Popular Displays
						</h3>
						{data?.popular && (
							<div className="flex items-center space-x-2" role="group" aria-label="Group by">
								{(["occasions", "themes"] as const).map((v, i) => (
									<span key={v} className="flex items-center space-x-2">
										{i > 0 && <span className="text-neutral-300">|</span>}
										<button
											type="button"
											onClick={() => setPopularView(v)}
											aria-pressed={popularView === v}
											className={`text-sm transition-colors ${popularView === v ? "text-primary font-medium" : "text-neutral-600 hover:text-neutral-900"}`}
										>
											{v === "occasions" ? "Occasions" : "Themes"}
										</button>
									</span>
								))}
							</div>
						)}
					</div>

					<div className="flex-1">
						{loading ? (
							<div className="space-y-3">
								{[1, 2, 3, 4, 5].map((i) => (
									<div
										key={i}
										className="flex items-center justify-between animate-pulse"
									>
										<div className="h-4 bg-neutral-100 rounded w-1/2"></div>
										<div className="h-4 bg-neutral-100 rounded w-8"></div>
									</div>
								))}
							</div>
						) : !data?.popular ? (
							<div className="text-center py-8">
								<div className="text-4xl mb-4">📊</div>
								<h4 className="text-lg font-medium text-neutral-900 mb-2">
									An Elite feature
								</h4>
								<p className="text-neutral-600">
									See which occasions and themes your customers book most.{" "}
									{agencySlug && (
										<Link href={`/${agencySlug}/billing`} className="font-medium text-primary underline">
											Upgrade to Elite
										</Link>
									)}
								</p>
							</div>
						) : popularItems.length ? (
							<div className="space-y-3">
								{popularItems.map((item, index) => (
									<div
										key={item.name}
										className="flex items-center justify-between"
									>
										<div className="flex items-center space-x-3">
											<span className="text-sm font-medium text-neutral-500 w-4">
												#{index + 1}
											</span>
											<span className="font-medium text-neutral-900">
												{item.name}
											</span>
										</div>
										<div className="flex items-center space-x-2">
											<div className="w-16 bg-neutral-100 rounded-full h-2">
												<div
													className="bg-primary h-2 rounded-full transition-all duration-500"
													style={{
														width: `${(item.count / popularItems[0].count) * 100}%`,
													}}
												/>
											</div>
											<span className="text-sm font-medium text-neutral-700 w-8 text-right">
												{item.count}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<div className="text-4xl mb-4">📊</div>
								<h4 className="text-lg font-medium text-neutral-900 mb-2">
									No bookings yet
								</h4>
								<p className="text-neutral-600">
									Your most-booked {popularView === "occasions" ? "occasions" : "themes"} from the last 12 months show here.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
