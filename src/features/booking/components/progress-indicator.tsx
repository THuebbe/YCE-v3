'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: Array<{
    id: number;
    name: string;
    title: string;
  }>;
}

const defaultSteps = [
  { id: 1, name: 'contact', title: 'Contact' },
  { id: 2, name: 'event', title: 'Event Details' },
  { id: 3, name: 'customize', title: 'Customize' },
  { id: 4, name: 'payment', title: 'Payment' },
  { id: 5, name: 'review', title: 'Review' },
  { id: 6, name: 'confirm', title: 'Confirm' },
];

export function ProgressIndicator({
  currentStep,
  totalSteps,
  steps = defaultSteps,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full bg-background-white border-b border-neutral-200 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Desktop Progress Bar */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.slice(0, totalSteps).map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="relative flex items-center">
                  <motion.div
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center
                      transition-colors duration-200
                      ${
                        currentStep > step.id
                          ? 'bg-primary border-primary text-white'
                          : currentStep === step.id
                          ? 'bg-primary border-primary text-white animate-pulse'
                          : 'bg-background-white border-neutral-300 text-neutral-500'
                      }
                    `}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-body-small font-medium">{step.id}</span>
                    )}
                  </motion.div>
                  
                  {/* Step Label */}
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span
                      className={`
                        text-body-small font-medium
                        ${
                          currentStep >= step.id 
                            ? 'text-primary' 
                            : 'text-neutral-500'
                        }
                      `}
                    >
                      {step.title}
                    </span>
                  </div>
                </div>

                {/* Connection Line */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`
                        h-0.5 transition-colors duration-300
                        ${
                          currentStep > step.id 
                            ? 'bg-primary' 
                            : 'bg-neutral-200'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="md:hidden">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {steps.slice(0, totalSteps).map((step) => (
              <motion.div
                key={step.id}
                className={`
                  w-3 h-3 rounded-full transition-colors duration-200
                  ${
                    currentStep > step.id
                      ? 'bg-primary'
                      : currentStep === step.id
                      ? 'bg-primary animate-pulse'
                      : 'bg-neutral-200'
                  }
                `}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
          
          {/* Current Step Info */}
          <div className="text-center">
            <p className="text-label text-neutral-500">
              STEP {currentStep} OF {totalSteps}
            </p>
            <h2 className="text-h4 text-neutral-900 mt-1">
              {steps.find(s => s.id === currentStep)?.title || 'Step'}
            </h2>
          </div>
        </div>

        {/* Progress Percentage Bar */}
        <div className="mt-6 md:mt-8">
          <div className="w-full bg-neutral-100 rounded-full h-1">
            <motion.div
              className="bg-primary h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          
          <div className="flex justify-between mt-2">
            <span className="text-body-small text-neutral-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
            <span className="text-body-small text-neutral-500">
              {totalSteps - currentStep} step{totalSteps - currentStep !== 1 ? 's' : ''} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}