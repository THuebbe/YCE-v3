"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
	currentStep: number;
	totalSteps: number;
	furthestStep: number;
	onStepClick?: (step: number) => void;
	steps?: Array<{
		id: number;
		name: string;
		title: string;
	}>;
}

const defaultSteps = [
	{ id: 1, name: "contact", title: "Contact" },
	{ id: 2, name: "event", title: "Event Details" },
	{ id: 3, name: "customize", title: "Customize" },
	{ id: 4, name: "payment", title: "Payment" },
	{ id: 5, name: "review", title: "Review" },
	{ id: 6, name: "confirm", title: "Confirm" },
];

export function ProgressIndicator({
	currentStep,
	totalSteps,
	furthestStep,
	onStepClick,
	steps = defaultSteps,
}: ProgressIndicatorProps) {
	const [isSnappingBack, setIsSnappingBack] = useState(false);
	const [snapBackDirection, setSnapBackDirection] = useState<'left' | 'right' | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	return (
		<div className="w-full bg-background-white border-b border-neutral-200 px-4 py-6 select-none">
			<div className="max-w-4xl mx-auto">
				{/* Desktop Progress Bar */}
				<div className="hidden md:block">
					<div className="flex items-center justify-between">
						{steps.slice(0, totalSteps).map((step, index) => (
							<div
								key={step.id}
								className="flex items-center flex-1"
							>
								{/* Step Circle */}
								<div className="relative flex items-center">
									<motion.div
										className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center
                      transition-all duration-200 select-none
                      ${
												onStepClick && step.id <= furthestStep
													? "cursor-pointer hover:shadow-medium"
													: ""
											}
                      ${
												step.id > furthestStep
													? "cursor-not-allowed opacity-50"
													: ""
											}
                      ${
												currentStep > step.id
													? "bg-primary border-primary text-white"
													: currentStep === step.id
													? "bg-primary border-primary text-white animate-pulse"
													: step.id > furthestStep
													? "bg-neutral-100 border-neutral-200 text-neutral-400"
													: "bg-background-white border-neutral-300 text-neutral-500"
											}
                    `}
										initial={{ scale: 0.8 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.2 }}
										onClick={() => onStepClick?.(step.id)}
										role={onStepClick ? "button" : undefined}
										tabIndex={onStepClick ? 0 : undefined}
										onKeyDown={(e) => {
											if (onStepClick && (e.key === "Enter" || e.key === " ")) {
												e.preventDefault();
												onStepClick(step.id);
											}
										}}
									>
										{currentStep > step.id ? (
											<Check className="w-5 h-5" />
										) : (
											<span className="text-body-small font-medium">
												{step.id}
											</span>
										)}
									</motion.div>

									{/* Step Label */}
									<div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
										<span
											className={`
                        text-body-small font-medium select-none
                        ${
													onStepClick && step.id <= furthestStep
														? "cursor-pointer hover:underline"
														: ""
												}
                        ${
													step.id > furthestStep
														? "cursor-not-allowed opacity-50"
														: ""
												}
                        ${
													currentStep >= step.id
														? "text-primary"
														: step.id > furthestStep
														? "text-neutral-400"
														: "text-neutral-500"
												}
                      `}
											onClick={() => onStepClick?.(step.id)}
											role={onStepClick ? "button" : undefined}
											tabIndex={onStepClick ? 0 : undefined}
											onKeyDown={(e) => {
												if (
													onStepClick &&
													(e.key === "Enter" || e.key === " ")
												) {
													e.preventDefault();
													onStepClick(step.id);
												}
											}}
										>
											{step.title}
										</span>
									</div>
								</div>

								{/* Connection Line */}
								{index < totalSteps - 1 && (
									<div className="flex-1 mx-4 select-none">
										<div
											className={`
                        h-0.5 transition-colors duration-300 select-none
                        ${
													currentStep > step.id
														? "bg-primary"
														: "bg-neutral-200"
												}
                      `}
										/>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Mobile Horizontal Scrolling Progress Bar */}
				<div className="md:hidden">
					<div className="relative overflow-x-auto">
						{/* Horizontal scrolling container with same design as desktop */}
						<div className="flex items-center justify-start gap-6 px-4 min-w-max">
							{steps.slice(0, totalSteps).map((step, index) => (
								<div
									key={step.id}
									className="flex items-center flex-shrink-0"
								>
									{/* Step Circle - Same as desktop */}
									<div className="relative flex items-center">
										<motion.div
											className={`
												w-10 h-10 rounded-full border-2 flex items-center justify-center
												transition-all duration-200 select-none
												${
													onStepClick && step.id <= furthestStep
														? "cursor-pointer hover:shadow-medium"
														: ""
												}
												${
													step.id > furthestStep
														? "cursor-not-allowed opacity-50"
														: ""
												}
												${
													currentStep > step.id
														? "bg-primary border-primary text-white"
														: currentStep === step.id
														? "bg-primary border-primary text-white animate-pulse"
														: step.id > furthestStep
														? "bg-neutral-100 border-neutral-200 text-neutral-400"
														: "bg-background-white border-neutral-300 text-neutral-500"
												}
											`}
											initial={{ scale: 0.8 }}
											animate={{ scale: 1 }}
											transition={{ duration: 0.2 }}
											onClick={() => onStepClick?.(step.id)}
											role={onStepClick ? "button" : undefined}
											tabIndex={onStepClick ? 0 : undefined}
											onKeyDown={(e) => {
												if (onStepClick && (e.key === "Enter" || e.key === " ")) {
													e.preventDefault();
													onStepClick(step.id);
												}
											}}
										>
											{currentStep > step.id ? (
												<Check className="w-5 h-5" />
											) : (
												<span className="text-body-small font-medium">
													{step.id}
												</span>
											)}
										</motion.div>

										{/* Step Label - Below circle on mobile */}
										<div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
											<span
												className={`
													text-xs font-medium select-none text-center
													${
														onStepClick && step.id <= furthestStep
															? "cursor-pointer hover:underline"
															: ""
													}
													${
														step.id > furthestStep
															? "cursor-not-allowed opacity-50"
															: ""
													}
													${
														currentStep >= step.id
															? "text-primary"
															: step.id > furthestStep
															? "text-neutral-400"
															: "text-neutral-500"
													}
												`}
												onClick={() => onStepClick?.(step.id)}
												role={onStepClick ? "button" : undefined}
												tabIndex={onStepClick ? 0 : undefined}
												onKeyDown={(e) => {
													if (
														onStepClick &&
														(e.key === "Enter" || e.key === " ")
													) {
														e.preventDefault();
														onStepClick(step.id);
													}
												}}
											>
												{step.title}
											</span>
										</div>
									</div>

									{/* Connection Line - Same as desktop but horizontal */}
									{index < totalSteps - 1 && (
										<div className="flex-shrink-0 mx-4">
											<div
												className={`
													h-0.5 w-8 transition-colors duration-300 select-none
													${
														currentStep > step.id
															? "bg-primary"
															: "bg-neutral-200"
													}
												`}
											/>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
					
					{/* Progress indicator */}
					<div className="text-center mt-4">
						<p className="text-xs text-neutral-500">
							{Math.round((currentStep / totalSteps) * 100)}% Complete • Step {currentStep} of {totalSteps}
						</p>
					</div>
				</div>

				{/* Progress Percentage Bar */}
				<div className="mt-6 md:mt-8">
					<div className="w-full bg-neutral-100 rounded-full h-1">
						<motion.div
							className="bg-primary h-1 rounded-full"
							initial={{ width: 0 }}
							animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
							transition={{ duration: 0.3, ease: "easeOut" }}
						/>
					</div>

					<div className="flex justify-between mt-2">
						<span className="text-body-small text-neutral-500">
							{Math.round((currentStep / totalSteps) * 100)}% Complete
						</span>
						<span className="text-body-small text-neutral-500">
							{totalSteps - currentStep} step
							{totalSteps - currentStep !== 1 ? "s" : ""} remaining
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
