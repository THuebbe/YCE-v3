'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { contactSchema, ContactFormData } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function ContactInfoStep() {
  const { formData, updateFormData, nextStep } = useWizard();
  const [localData, setLocalData] = useState<ContactFormData>(
    formData.contact || {
      fullName: '',
      email: '',
      phone: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
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

  const isValid = contactSchema.safeParse(localData).success;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-h2 text-neutral-900 mb-4">Contact Information</h1>
        <p className="text-body text-neutral-700">
          Let's start with your contact details so we can deliver your amazing yard display.
        </p>
      </div>

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
            placeholder="(555) 123-4567"
            className={errors.phone ? 'border-error' : ''}
            autoComplete="tel"
          />
          {errors.phone && (
            <p className="text-body-small text-error-red mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={validateAndContinue}
          disabled={!isValid}
          className="w-full md:w-auto px-8"
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