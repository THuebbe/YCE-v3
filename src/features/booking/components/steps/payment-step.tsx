'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { paymentSchema, PaymentFormData } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { CreditCard, Smartphone, DollarSign } from 'lucide-react';

export function PaymentStep() {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const [localData, setLocalData] = useState<PaymentFormData>(
    formData.payment || {
      paymentMethod: 'card',
      billingAddress: {
        zipCode: '',
      },
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setLocalData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setLocalData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAndContinue = () => {
    const result = paymentSchema.safeParse(localData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path.join('.');
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    updateFormData({ payment: localData });
    nextStep();
  };

  const calculateTotal = () => {
    const basePrice = 95;
    const extraDayPrice = 10;
    const extraDays = (formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0);
    return basePrice + (extraDays * extraDayPrice);
  };

  const isValid = paymentSchema.safeParse(localData).success;

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: Smartphone,
      description: 'Pay with Touch ID or Face ID'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: DollarSign,
      description: 'Pay with your PayPal account'
    },
    {
      id: 'venmo',
      name: 'Venmo',
      icon: DollarSign,
      description: 'Pay with Venmo'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-h2 text-neutral-900 mb-4">Payment Information</h1>
        <p className="text-body text-neutral-700">
          Secure payment processing to complete your yard display order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="text-label text-neutral-700 mb-4 block">
              Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`
                      flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors
                      ${
                        localData.paymentMethod === method.id
                          ? 'border-primary bg-secondary-pale'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={localData.paymentMethod === method.id}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="sr-only"
                    />
                    <Icon className="w-6 h-6 text-neutral-600 mr-4" />
                    <div className="flex-1">
                      <div className="text-body font-medium text-neutral-900">
                        {method.name}
                      </div>
                      <div className="text-body-small text-neutral-600">
                        {method.description}
                      </div>
                    </div>
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${
                          localData.paymentMethod === method.id
                            ? 'border-primary'
                            : 'border-neutral-300'
                        }
                      `}
                    >
                      {localData.paymentMethod === method.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p className="text-body-small text-error-red mt-2">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Credit Card Form */}
          {localData.paymentMethod === 'card' && (
            <div className="bg-neutral-50 p-6 rounded-lg space-y-4">
              <h3 className="text-h5 text-neutral-900 mb-4">Card Information</h3>
              
              {/* Card Number */}
              <div>
                <label htmlFor="cardNumber" className="text-label text-neutral-700 mb-2 block">
                  Card Number
                </label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="font-mono"
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="text-label text-neutral-700 mb-2 block">
                    Expiry Date
                  </label>
                  <Input
                    id="expiry"
                    type="text"
                    placeholder="MM/YY"
                    className="font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="cvv" className="text-label text-neutral-700 mb-2 block">
                    CVV
                  </label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Billing ZIP */}
              <div>
                <label htmlFor="billingZip" className="text-label text-neutral-700 mb-2 block">
                  Billing ZIP Code
                </label>
                <Input
                  id="billingZip"
                  type="text"
                  value={localData.billingAddress?.zipCode || ''}
                  onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                  placeholder="12345"
                  className={errors['billingAddress.zipCode'] ? 'border-error' : ''}
                />
                {errors['billingAddress.zipCode'] && (
                  <p className="text-body-small text-error-red mt-1">{errors['billingAddress.zipCode']}</p>
                )}
              </div>

              {/* Stripe Integration Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-body-small text-blue-800">
                  <strong>Note:</strong> Stripe Elements integration will be implemented in the next phase.
                  This form currently shows the UI structure.
                </p>
              </div>
            </div>
          )}

          {/* Alternative Payment Methods */}
          {localData.paymentMethod !== 'card' && (
            <div className="bg-neutral-50 p-6 rounded-lg text-center">
              <p className="text-body text-neutral-700 mb-4">
                You'll be redirected to {paymentMethods.find(m => m.id === localData.paymentMethod)?.name} to complete your payment.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-body-small text-blue-800">
                  <strong>Note:</strong> {paymentMethods.find(m => m.id === localData.paymentMethod)?.name} integration 
                  will be implemented in the next phase.
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-body-small font-medium text-green-800 mb-1">
                  Secure Payment Processing
                </h4>
                <p className="text-body-small text-green-700">
                  Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
            <h3 className="text-h5 text-neutral-900 mb-4">Order Summary</h3>
            
            {/* Event Details */}
            <div className="space-y-3 mb-4 pb-4 border-b border-neutral-200">
              <div className="flex justify-between text-body-small">
                <span className="text-neutral-600">Event Date:</span>
                <span className="text-neutral-900">
                  {formData.event?.eventDate ? new Date(formData.event.eventDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-body-small">
                <span className="text-neutral-600">Message:</span>
                <span className="text-neutral-900">
                  {formData.display?.eventMessage || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-body-small">
                <span className="text-neutral-600">Recipient:</span>
                <span className="text-neutral-900">
                  {formData.display?.recipientName || 'Not set'}
                </span>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body">Base Package</span>
                <span className="text-body">$95.00</span>
              </div>
              
              {((formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0)) > 0 && (
                <div className="flex justify-between text-body-small">
                  <span className="text-neutral-600">
                    Extra Days ({(formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0)})
                  </span>
                  <span className="text-neutral-900">
                    ${((formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0)) * 10}.00
                  </span>
                </div>
              )}
              
              <div className="border-t pt-3 flex justify-between text-h5 font-semibold">
                <span>Total</span>
                <span className="text-primary">${calculateTotal()}.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4 justify-between">
        <Button
          onClick={prevStep}
          variant="secondary"
          className="w-full md:w-auto px-8"
        >
          Back
        </Button>
        <Button
          onClick={validateAndContinue}
          disabled={!isValid}
          className="w-full md:w-auto px-8"
        >
          Review Order
        </Button>
      </div>
    </motion.div>
  );
}