'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { createPaymentSchema, PaymentFormData } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CreditCard, Smartphone, DollarSign } from 'lucide-react';

// Payment method components
import { CreditCardForm } from '../payment-methods/CreditCardForm';
import { PayPalForm } from '../payment-methods/PayPalForm';
import { ApplePayForm } from '../payment-methods/ApplePayForm';
import { VenmoPaymentForm } from '@/components/payments/VenmoPaymentForm';

export function PaymentStep() {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    prevStep, 
    paymentMethods 
  } = useWizard();
  
  const [localData, setLocalData] = useState<PaymentFormData>(
    formData.payment || {
      paymentMethod: 'card',
      billingAddress: {
        zipCode: '',
      },
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPaymentFields, setSelectedPaymentFields] = useState<Record<string, any>>({});

  // Update default payment method when available methods load
  useEffect(() => {
    if (paymentMethods.defaultPaymentMethod && 
        !paymentMethods.isLoading && 
        paymentMethods.availablePaymentMethods.length > 0) {
      
      const defaultExists = paymentMethods.availablePaymentMethods.find(
        m => m.id === paymentMethods.defaultPaymentMethod
      );
      
      if (defaultExists && localData.paymentMethod !== paymentMethods.defaultPaymentMethod) {
        setLocalData(prev => ({
          ...prev,
          paymentMethod: paymentMethods.defaultPaymentMethod as any
        }));
      }
    }
  }, [paymentMethods, localData.paymentMethod]);

  const handlePaymentMethodChange = (methodId: string) => {
    setLocalData(prev => ({ 
      ...prev, 
      paymentMethod: methodId as any 
    }));
    
    // Clear method-specific errors and fields
    setErrors({});
    setSelectedPaymentFields({});
  };

  const handlePaymentFieldChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      
      if (parent === 'billingAddress') {
        setLocalData(prev => ({
          ...prev,
          billingAddress: {
            zipCode: child === 'zipCode' ? value : (prev.billingAddress?.zipCode || ''),
          },
        }));
      } else {
        setSelectedPaymentFields(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: value,
          },
        }));
      }
    } else {
      setSelectedPaymentFields(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('✅ Payment successful:', paymentData);
    
    // Store payment result in form data
    const updatedData = {
      ...localData,
      paymentMethodId: paymentData.paymentId,
      ...selectedPaymentFields,
    };
    
    updateFormData({ payment: updatedData });
    nextStep();
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);
    setErrors({ payment: error });
  };

  const validateAndContinue = () => {
    // Create dynamic schema based on available payment methods
    const availableMethodIds = paymentMethods.availablePaymentMethods.map(m => m.id);
    const schema = createPaymentSchema(availableMethodIds);
    
    const result = schema.safeParse(localData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path.join('.');
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // For credit card, additional validation needed
    if (localData.paymentMethod === 'card') {
      if (!selectedPaymentFields.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: 'Card number is required' }));
        return;
      }
      if (!selectedPaymentFields.expiryDate) {
        setErrors(prev => ({ ...prev, expiryDate: 'Expiry date is required' }));
        return;
      }
      if (!selectedPaymentFields.cvv) {
        setErrors(prev => ({ ...prev, cvv: 'CVV is required' }));
        return;
      }
    }

    // For methods that require redirect (PayPal, Apple Pay), 
    // the payment processing happens in their respective components
    if (['paypal', 'apple_pay', 'venmo'].includes(localData.paymentMethod)) {
      // These methods handle their own success/error flows
      return;
    }

    // For credit card, proceed to next step (payment processing will happen later)
    updateFormData({ 
      payment: { 
        ...localData, 
        ...selectedPaymentFields 
      } 
    });
    nextStep();
  };

  const calculateTotal = () => {
    const basePrice = 95;
    const extraDayPrice = 10;
    const extraDays = (formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0);
    return basePrice + (extraDays * extraDayPrice);
  };

  const selectedMethod = paymentMethods.availablePaymentMethods.find(
    m => m.id === localData.paymentMethod
  );

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard': return CreditCard;
      case 'Smartphone': return Smartphone;
      case 'DollarSign': return DollarSign;
      default: return CreditCard;
    }
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) return null;
    
    const totalAmount = calculateTotal();

    switch (localData.paymentMethod) {
      case 'card':
        return (
          <CreditCardForm
            paymentMethod={selectedMethod}
            onFieldChange={handlePaymentFieldChange}
            formData={localData}
            errors={errors}
          />
        );
      
      case 'paypal':
        return (
          <PayPalForm
            paymentMethod={selectedMethod}
            amount={totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        );
      
      case 'apple_pay':
        return (
          <ApplePayForm
            paymentMethod={selectedMethod}
            amount={totalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        );
      
      case 'venmo':
        return (
          <VenmoPaymentForm
            amount={totalAmount}
            description="YardCard Elite yard display rental"
            onSuccess={(transactionId) => handlePaymentSuccess({ 
              paymentId: transactionId, 
              paymentMethod: 'venmo',
              amount: totalAmount,
              status: 'completed' 
            })}
            onError={handlePaymentError}
          />
        );
      
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Payment form not available for this method
          </div>
        );
    }
  };

  // Loading state
  if (paymentMethods.isLoading) {
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
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading available payment methods...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (paymentMethods.error) {
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
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {paymentMethods.error}. Using fallback payment options.
            </AlertDescription>
          </Alert>
        </div>
      </motion.div>
    );
  }

  // No payment methods available
  if (paymentMethods.availablePaymentMethods.length === 0) {
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
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No payment methods are currently available. Please contact support.
            </AlertDescription>
          </Alert>
        </div>
      </motion.div>
    );
  }

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
          Select your preferred payment method to complete your yard display order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-neutral-200 rounded-lg p-6 shadow-default hover:shadow-medium transition-shadow duration-standard space-y-6">
            
            {/* Payment Method Selection */}
            <div>
              <label className="text-label text-neutral-700 mb-4 block">
                Payment Method
              </label>
              <div className="space-y-3">
                {paymentMethods.availablePaymentMethods.map((method) => {
                  const IconComponent = getIconComponent(method.icon);
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
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        className="sr-only"
                      />
                      <IconComponent className="w-6 h-6 text-neutral-600 mr-4" />
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

            {/* Payment Form - Only show after method selection */}
            {localData.paymentMethod && (
              <div>
                {renderPaymentForm()}
              </div>
            )}

            {/* General Payment Error */}
            {errors.payment && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.payment}</AlertDescription>
              </Alert>
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
        </div>

        {/* Right Side - Order Summary */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-neutral-200 rounded-lg p-6 shadow-default hover:shadow-medium transition-shadow duration-standard">
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
          className="w-full md:w-auto px-8 shadow-button hover:shadow-medium active:scale-98 transition-all duration-standard"
        >
          Back
        </Button>
        
        {/* Only show continue button for credit cards or when no payment method selected */}
        {(localData.paymentMethod === 'card' || !localData.paymentMethod) && (
          <Button
            onClick={validateAndContinue}
            disabled={!localData.paymentMethod}
            className="w-full md:w-auto px-8 shadow-button hover:shadow-medium active:scale-98 transition-all duration-standard"
          >
            Review Order
          </Button>
        )}
      </div>
    </motion.div>
  );
}