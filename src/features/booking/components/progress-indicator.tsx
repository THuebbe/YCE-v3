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
					<div className="relative overflow-hidden">
						{/* Horizontal scrolling container */}
						<motion.div 
							className="flex items-center gap-4 px-4"
							animate={
								!isDragging && isSnappingBack
									? {
											// Snap-back animation: slide halfway toward locked step, then back
											x: [
												`calc(50vw - ${currentStep * 120 + (currentStep - 1) * 16}px)`, // Current position
												`calc(50vw - ${currentStep * 120 + (currentStep - 1) * 16}px + ${snapBackDirection === 'left' ? '-60px' : '60px'})`, // Halfway toward locked step
												`calc(50vw - ${currentStep * 120 + (currentStep - 1) * 16}px)` // Back to current
											]
										}
									: !isDragging
									? { 
											x: `calc(50vw - ${currentStep * 120 + (currentStep - 1) * 16}px)` // Center current step
										}
									: {}
							}
							transition={
								isSnappingBack
									? {
											duration: 0.6,
											times: [0, 0.4, 1],
											ease: ["easeOut", "easeInOut"]
										}
									: { 
											type: "spring",
											stiffness: 300,
											damping: 30,
											duration: 0.6
										}
							}
							drag="x"
							dragConstraints={{ left: -120, right: 120 }}
							dragElastic={0.1}
							onDragStart={() => setIsDragging(true)}
							onDragEnd={(event, info) => {
								setIsDragging(false);
								
								// Enhanced swipe navigation with snap-back for locked steps
								if (Math.abs(info.offset.x) > 50) {
									if (info.offset.x > 0 && currentStep > 1) {
										// Swipe right - go to previous step (always allowed)
										onStepClick?.(currentStep - 1);
									} else if (info.offset.x < 0 && currentStep < furthestStep) {
										// Swipe left - go to next step (only if unlocked)
										onStepClick?.(currentStep + 1);
									} else if (info.offset.x < 0 && currentStep >= furthestStep) {
										// Swipe left toward locked step - trigger snap-back
										setSnapBackDirection('left');
										setIsSnappingBack(true);
									}
								}
							}}
							onAnimationComplete={() => {
								if (isSnappingBack) {
									setIsSnappingBack(false);
									setSnapBackDirection(null);
								}
							}}
						>
							{steps.slice(0, totalSteps).map((step, index) => (
								<motion.div
									key={step.id}
									className={`
										flex-shrink-0 w-28 h-16 rounded-lg border-2 flex flex-col items-center justify-center
										transition-all duration-300 select-none relative
										${onStepClick && step.id <= furthestStep ? "cursor-pointer" : ""}
										${step.id > furthestStep ? "cursor-not-allowed opacity-50" : ""}
										${
											currentStep === step.id
												? "bg-primary border-primary text-white shadow-medium scale-110"
												: currentStep > step.id
												? "bg-green-50 border-green-200 text-green-700"
												: step.id > furthestStep
												? "bg-neutral-50 border-neutral-200 text-neutral-400"
												: "bg-white border-neutral-300 text-neutral-600 hover:border-primary hover:shadow-default"
										}
									`}
									initial={{ scale: 0.9, opacity: 0 }}
									animate={{ 
										scale: currentStep === step.id ? 1.1 : 1,
										opacity: 1,
										// Add shake animation for locked step during snap-back
										x: isSnappingBack && step.id === currentStep + 1 && step.id > furthestStep
											? [0, -2, 2, -2, 2, 0]
											: 0
									}}
									transition={{ 
										duration: 0.3,
										x: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
									}}
									onClick={() => onStepClick?.(step.id)}
									role={onStepClick ? "button" : undefined}
									tabIndex={onStepClick && step.id <= furthestStep ? 0 : undefined}
									onKeyDown={(e) => {
										if (onStepClick && step.id <= furthestStep && (e.key === "Enter" || e.key === " ")) {
											e.preventDefault();
											onStepClick(step.id);
										}
									}}
								>
									{/* Step Circle */}
									<div className={`
										w-6 h-6 rounded-full border flex items-center justify-center mb-1
										${
											currentStep === step.id
												? "bg-white border-white text-primary"
												: currentStep > step.id
												? "bg-green-500 border-green-500 text-white"
												: "border-current"
										}
									`}>
										{currentStep > step.id ? (
											<Check className="w-3 h-3" />
										) : (
											<span className="text-xs font-bold">{step.id}</span>
										)}
									</div>
									
									{/* Step Title */}
									<span className="text-xs font-medium text-center leading-tight">
										{step.title}
									</span>
									
									{/* Current step indicator */}
									{currentStep === step.id && (
										<motion.div
											className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{ delay: 0.2 }}
										/>
									)}
								</motion.div>
							))}
						</motion.div>
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
