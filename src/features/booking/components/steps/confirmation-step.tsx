'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { Button } from '@/shared/components/ui/button';
import { Check, Calendar, MapPin, Mail, Phone, Download, Home } from 'lucide-react';

export function ConfirmationStep() {
  const { formData } = useWizard();
  const [orderNumber] = useState(() => 
    `YCE${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(-2).toUpperCase()}`
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const calculateTotal = () => {
    const basePrice = 95;
    const extraDayPrice = 10;
    const extraDays = (formData.display?.extraDaysBefore || 0) + (formData.display?.extraDaysAfter || 0);
    return basePrice + (extraDays * extraDayPrice);
  };

  const getDeliveryDate = () => {
    if (!formData.event?.eventDate) return 'Date not set';
    
    const eventDate = new Date(formData.event.eventDate);
    const deliveryDate = new Date(eventDate);
    deliveryDate.setDate(eventDate.getDate() - (formData.display?.extraDaysBefore || 0));
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRemovalDate = () => {
    if (!formData.event?.eventDate) return 'Date not set';
    
    const eventDate = new Date(formData.event.eventDate);
    const removalDate = new Date(eventDate);
    removalDate.setDate(eventDate.getDate() + 1 + (formData.display?.extraDaysAfter || 0));
    
    return removalDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                rotate: 0,
              }}
              animate={{
                y: window.innerHeight + 10,
                rotate: 360,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Success Animation */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-success-green rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-h1 text-neutral-900 mb-4"
        >
          Order Confirmed!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-body-large text-neutral-700 mb-6"
        >
          Thank you for choosing YardCard Elite! Your amazing yard display is on its way.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-4 inline-block"
        >
          <p className="text-body-small text-neutral-600 mb-1">Order Number</p>
          <p className="text-h4 font-bold text-primary font-mono">{orderNumber}</p>
        </motion.div>
      </div>

      {/* Order Details */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Order Summary */}
        <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
          <h3 className="text-h5 text-neutral-900 mb-4 flex items-center">
            <Check className="w-5 h-5 text-success-green mr-2" />
            Order Summary
          </h3>
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
            
            <div className="border-t pt-3 flex justify-between text-h5 font-bold">
              <span>Total Paid</span>
              <span className="text-success-green">${calculateTotal()}.00</span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg mt-4">
              <p className="text-body-small text-neutral-700">
                <strong>Message:</strong> {formData.display?.eventMessage}
              </p>
              <p className="text-body-small text-neutral-700">
                <strong>Recipient:</strong> {formData.display?.recipientName}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
          <h3 className="text-h5 text-neutral-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 text-primary mr-2" />
            Contact Information
          </h3>
          <div className="space-y-3 text-body-small">
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-neutral-500 mr-3" />
              <span>{formData.contact?.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-neutral-500 mr-3" />
              <span>{formData.contact?.phone}</span>
            </div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 text-neutral-500 mr-3 mt-0.5" />
              <div>
                <p>{formData.event?.deliveryAddress.street}</p>
                <p>
                  {formData.event?.deliveryAddress.city}, {formData.event?.deliveryAddress.state} {formData.event?.deliveryAddress.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* What Happens Next */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
      >
        <h3 className="text-h5 text-neutral-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 text-blue-600 mr-2" />
          What Happens Next
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-body-small font-bold">
              1
            </div>
            <div>
              <h4 className="text-body font-medium text-neutral-900 mb-1">Confirmation Email</h4>
              <p className="text-body-small text-neutral-700">
                You'll receive a confirmation email within 5 minutes with your order details and display preview.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-body-small font-bold">
              2
            </div>
            <div>
              <h4 className="text-body font-medium text-neutral-900 mb-1">Display Installation</h4>
              <p className="text-body-small text-neutral-700">
                Your display will be installed on <strong>{getDeliveryDate()}</strong> during the{' '}
                <strong>{formData.event?.timeWindow?.replace('_', ' ')}</strong> time window.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-body-small font-bold">
              3
            </div>
            <div>
              <h4 className="text-body font-medium text-neutral-900 mb-1">Display Removal</h4>
              <p className="text-body-small text-neutral-700">
                Your display will be removed on <strong>{getRemovalDate()}</strong>. 
                No need to be present for removal.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col md:flex-row gap-4 justify-center"
      >
        <Button
          variant="secondary"
          className="px-8"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Order Summary
        </Button>
        
        <Button
          className="px-8"
          onClick={() => window.location.href = '/'}
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </Button>
      </motion.div>

      {/* Support Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-8 p-4 bg-neutral-50 rounded-lg"
      >
        <p className="text-body-small text-neutral-600 mb-2">
          Questions about your order? Need to make changes?
        </p>
        <p className="text-body-small text-neutral-700">
          Contact us at{' '}
          <a href="mailto:support@yardcardelite.com" className="text-primary hover:underline">
            support@yardcardelite.com
          </a>
          {' '}or{' '}
          <a href="tel:+1234567890" className="text-primary hover:underline">
            (123) 456-7890
          </a>
        </p>
        <p className="text-body-small text-neutral-500 mt-2">
          Reference your order number: <span className="font-mono">{orderNumber}</span>
        </p>
      </motion.div>
    </motion.div>
  );
}