'use client';

import React, { useState } from 'react';
import { useWizard } from '../../context/wizard-context';
import { contactSchema, ContactFormData } from '../../types';
import { Input } from '@/shared/components/ui/input';
import { Field, StepIntro, StepMotion, StepNav, StepSection } from '../step-kit';

export function ContactInfoStep({ custom }: { custom?: string }) {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
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

  const isValid = contactSchema.safeParse(localData).success;

  // Keep what's been typed when going back to the display
  const goBack = () => {
    updateFormData({ contact: localData });
    prevStep();
  };

  const fields = [
    { id: 'fullName', label: 'Your name', type: 'text', autoComplete: 'name', inputMode: undefined },
    { id: 'email', label: 'Email', type: 'email', autoComplete: 'email', inputMode: 'email' },
    { id: 'phone', label: 'Mobile phone', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  ] as const;

  return (
    <StepMotion custom={custom}>
      <StepIntro>Where should we send your confirmation, and how can the setup crew reach you on the day?</StepIntro>

      <StepSection>
        {fields.map(f => (
          <Field key={f.id} id={f.id} label={f.label} error={errors[f.id] || undefined}>
            <Input
              id={f.id}
              type={f.type}
              inputMode={f.inputMode}
              value={localData[f.id]}
              onChange={(e) => handleInputChange(f.id, e.target.value)}
              className={errors[f.id] ? 'border-danger' : ''}
              autoComplete={f.autoComplete}
            />
          </Field>
        ))}
        <p className="text-fine text-fg-muted">
          Used only for this booking and shared with the sign company you&apos;re booking with.{' '}
          <a href="/privacy" target="_blank" rel="noopener" className="font-bold text-action-text underline underline-offset-4">Privacy Policy</a>
        </p>
      </StepSection>

      <StepNav onBack={goBack} onNext={validateAndContinue} nextDisabled={!isValid} />
    </StepMotion>
  );
}
