'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { Button } from '@/shared/components/ui/button';
import { Edit, Calendar, MapPin, CreditCard, Palette, User } from 'lucide-react';

export function ReviewStep() {
  const { formData, nextStep, prevStep, goToStep } = useWizard();

  const calculateTotal = () => {
    const basePrice = 95;
    const extraDayPrice = 10;
    const extraDays = (formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0);
    return basePrice + (extraDays * extraDayPrice);
  };

  const handlePlaceOrder = () => {
    // Here we would typically:
    // 1. Process payment
    // 2. Create order in database
    // 3. Send confirmation email
    // For now, just move to confirmation
    nextStep();
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods = {
      card: 'Credit/Debit Card',
      apple_pay: 'Apple Pay',
      paypal: 'PayPal',
      venmo: 'Venmo'
    };
    return methods[method as keyof typeof methods] || method;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-h2 text-neutral-900 mb-4">Review Your Order</h1>
        <p className="text-body text-neutral-700">
          Please review all details before placing your order. You can edit any section by clicking the edit button.
        </p>
      </div>

      <div className="space-y-6">
        {/* Contact Information */}
        <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-h5 text-neutral-900">Contact Information</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(1)}
              className="text-primary hover:text-primary-hover"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-small">
            <div>
              <span className="text-neutral-600">Name:</span>
              <p className="text-neutral-900 font-medium">{formData.contact?.fullName}</p>
            </div>
            <div>
              <span className="text-neutral-600">Email:</span>
              <p className="text-neutral-900 font-medium">{formData.contact?.email}</p>
            </div>
            <div>
              <span className="text-neutral-600">Phone:</span>
              <p className="text-neutral-900 font-medium">{formData.contact?.phone}</p>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-h5 text-neutral-900">Event Details</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(2)}
              className="text-primary hover:text-primary-hover"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-small">
            <div>
              <span className="text-neutral-600">Event Date:</span>
              <p className="text-neutral-900 font-medium">
                {formData.event?.eventDate ? new Date(formData.event.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-neutral-600">Time Window:</span>
              <p className="text-neutral-900 font-medium capitalize">
                {formData.event?.timeWindow?.replace('_', ' ')}
              </p>
            </div>
            <div className="md:col-span-2">
              <span className="text-neutral-600">Delivery Address:</span>
              <p className="text-neutral-900 font-medium">
                {formData.event?.deliveryAddress.street}<br />
                {formData.event?.deliveryAddress.city}, {formData.event?.deliveryAddress.state} {formData.event?.deliveryAddress.zipCode}
              </p>
            </div>
            {formData.event?.deliveryNotes && (
              <div className="md:col-span-2">
                <span className="text-neutral-600">Delivery Notes:</span>
                <p className="text-neutral-900 font-medium">{formData.event.deliveryNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Display Customization */}
        <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-h5 text-neutral-900">Display Customization</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(3)}
              className="text-primary hover:text-primary-hover"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          
          {/* Display Preview */}
          <div className="mb-4">
            <div className="aspect-[5/3] bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-h4 font-bold text-neutral-800 mb-2">
                  {formData.display?.eventMessage || 'Your Message Here'}
                </div>
                {formData.display?.eventNumber && (
                  <div className="text-6xl font-bold text-primary mb-2">
                    {formData.display.eventNumber}
                  </div>
                )}
                <div className="text-h5 text-neutral-700">
                  {formData.display?.recipientName || 'Recipient Name'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-small">
            <div>
              <span className="text-neutral-600">Message:</span>
              <p className="text-neutral-900 font-medium">
                {formData.display?.eventMessage}
                {formData.display?.eventMessage === 'Custom Message' && formData.display?.customMessage && 
                  ` (${formData.display.customMessage})`
                }
              </p>
            </div>
            <div>
              <span className="text-neutral-600">Recipient:</span>
              <p className="text-neutral-900 font-medium">{formData.display?.recipientName}</p>
            </div>
            {formData.display?.eventNumber && (
              <div>
                <span className="text-neutral-600">Number:</span>
                <p className="text-neutral-900 font-medium">{formData.display.eventNumber}</p>
              </div>
            )}
            <div>
              <span className="text-neutral-600">Message Style:</span>
              <p className="text-neutral-900 font-medium">{formData.display?.messageStyle}</p>
            </div>
            <div>
              <span className="text-neutral-600">Name Style:</span>
              <p className="text-neutral-900 font-medium">{formData.display?.nameStyle}</p>
            </div>
            {formData.display?.characterTheme && (
              <div>
                <span className="text-neutral-600">Theme:</span>
                <p className="text-neutral-900 font-medium">{formData.display.characterTheme}</p>
              </div>
            )}
            {formData.display?.hobbies && formData.display.hobbies.length > 0 && (
              <div className="md:col-span-2">
                <span className="text-neutral-600">Hobbies/Interests:</span>
                <p className="text-neutral-900 font-medium">{formData.display.hobbies.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-h5 text-neutral-900">Payment Method</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(4)}
              className="text-primary hover:text-primary-hover"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="text-body-small">
            <span className="text-neutral-600">Payment Method:</span>
            <p className="text-neutral-900 font-medium">
              {getPaymentMethodDisplay(formData.payment?.paymentMethod || '')}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
          <h3 className="text-h5 text-neutral-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body">Base Package</span>
              <span className="text-body">$95.00</span>
            </div>
            
            {((formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0)) > 0 && (
              <>
                {formData.display?.extraDaysBefore && formData.display.extraDaysBefore > 0 && (
                  <div className="flex justify-between text-body-small">
                    <span className="text-neutral-600">Extra Days Before ({formData.display.extraDaysBefore})</span>
                    <span className="text-neutral-900">${formData.display.extraDaysBefore * 10}.00</span>
                  </div>
                )}
                {formData.display?.extraDaysAfter && formData.display.extraDaysAfter > 0 && (
                  <div className="flex justify-between text-body-small">
                    <span className="text-neutral-600">Extra Days After ({formData.display.extraDaysAfter})</span>
                    <span className="text-neutral-900">${formData.display.extraDaysAfter * 10}.00</span>
                  </div>
                )}
              </>
            )}
            
            <div className="border-t pt-3 flex justify-between text-h4 font-bold">
              <span>Total</span>
              <span className="text-primary">${calculateTotal()}.00</span>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary focus:ring-2"
              defaultChecked
            />
            <div className="text-body-small text-neutral-700">
              I agree to the{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              I understand that my display will be installed during the selected time window and removed the day after my event unless extra days are purchased.
            </div>
          </label>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4 justify-between">
        <Button
          onClick={prevStep}
          variant="secondary"
          className="w-full md:w-auto px-8"
        >
          Back to Payment
        </Button>
        <Button
          onClick={handlePlaceOrder}
          className="w-full md:w-auto px-8 bg-primary hover:bg-primary-hover"
        >
          Place Order - ${calculateTotal()}.00
        </Button>
      </div>
    </motion.div>
  );
}