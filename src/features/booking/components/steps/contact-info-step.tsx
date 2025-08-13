'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { contactSchema, ContactFormData } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function ContactInfoStep({ custom }: { custom?: string }) {
  console.log('🔍 ContactInfoStep: Component rendering', { custom });
  const { formData, updateFormData, nextStep } = useWizard();
  const [localData, setLocalData] = useState<ContactFormData>(
    formData.contact || {
      fullName: '',
      email: '',
      phone: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    let digits = phone.replace(/\D/g, '');
    
    // If it starts with "1" and has 11 digits, remove the "1" (US country code)
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    
    // Always limit to 10 digits max (after removing country code)
    const limitedDigits = digits.slice(0, 10);
    
    // Format as (###) ###-####
    if (limitedDigits.length >= 10) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6, 10)}`;
    } else if (limitedDigits.length >= 6) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (limitedDigits.length >= 3) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length > 0) {
      return `(${limitedDigits}`;
    }
    return limitedDigits;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    // Auto-format phone number
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    
    setLocalData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAndContinue = () => {
    const result = contactSchema.safeParse(localData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    updateFormData({ contact: localData });
    nextStep();
  };

  const validationResult = contactSchema.safeParse(localData);
  const isValid = validationResult.success;
  
  // Debug mobile detection and animation values
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  console.log('🔍 ContactInfoStep: Animation setup', { 
    isMobile, 
    custom, 
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'undefined' 
  });

  return (
    <motion.div
      initial={
        isMobile
          ? { x: custom === 'backward' ? -50 : 50, opacity: 0.8 } // Mobile: smaller slide with opacity
          : { opacity: 0, x: 20 } // Desktop: fade with slight slide
      }
      animate={
        isMobile
          ? { x: 0, opacity: 1 } // Mobile: slide to center with full opacity
          : { opacity: 1, x: 0 } // Desktop: fade in
      }
      exit={
        isMobile
          ? { x: custom === 'backward' ? 50 : -50, opacity: 0.8 } // Mobile: smaller slide out
          : { opacity: 0, x: -20 } // Desktop: fade out
      }
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className="max-w-2xl mx-auto px-4 py-8 min-h-[400px]"
      style={{ 
        // Ensure content is always positioned within viewport
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'transform, opacity' // Optimize for animations
      }}
    >
      <div className="text-center mb-8">
        <h1 className="text-h2 text-neutral-900 mb-4">Contact Information</h1>
        <p className="text-body text-neutral-700">
          Let's start with your contact details so we can deliver your amazing yard display.
        </p>
      </div>

      {/* Form Card Container */}
      <div className="bg-white border-2 border-neutral-200 rounded-lg p-6 shadow-default hover:shadow-medium transition-shadow duration-standard">
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="text-label text-neutral-700 mb-2 block">
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              value={localData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={errors.fullName ? 'border-error' : ''}
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="text-body-small text-error-red mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="text-label text-neutral-700 mb-2 block">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={localData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className={errors.email ? 'border-error' : ''}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-body-small text-error-red mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="text-label text-neutral-700 mb-2 block">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={localData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-error' : ''}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="text-body-small text-error-red mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={validateAndContinue}
          disabled={!isValid}
          className="w-full md:w-auto px-8 shadow-button hover:shadow-medium active:scale-98 transition-all duration-standard"
        >
          Continue
        </Button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 text-center">
        <p className="text-body-small text-neutral-500">
          Your information is kept secure and will be retained for 3 years for order history.
        </p>
      </div>
    </motion.div>
  );
}