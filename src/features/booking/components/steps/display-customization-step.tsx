'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWizard } from '../../context/wizard-context';
import { displaySchema, DisplayFormData, Sign } from '../../types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { InventoryService } from '../../services/inventory';
import { SignSelectionService } from '../../services/sign-selection';
import { LayoutCalculatorService } from '../../services/layout-calculator';
import { DisplayGrid } from '../display/DisplayGrid';
import { LayoutCalculation } from '../../types';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const eventMessages = [
  'Happy Birthday',
  'Congratulations',
  'Welcome Home',
  'Get Well Soon',
  'Graduation',
  'Happy Anniversary',
  'Custom Message'
];

const themes = [
  'Classic',
  'Colorful',
  'Sports',
  'Princess',
  'Superhero',
  'Animals',
  'Holiday'
];

const hobbies = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Dance',
  'Music',
  'Art',
  'Reading',
  'Gaming'
];

export function DisplayCustomizationStep() {
  const { formData, updateFormData, nextStep, prevStep } = useWizard();
  const [localData, setLocalData] = useState<DisplayFormData>(
    formData.display || {
      eventMessage: '',
      customMessage: '',
      eventNumber: undefined,
      messageStyle: '',
      recipientName: '',
      nameStyle: '',
      characterTheme: '',
      hobbies: [],
      extraDaysBefore: 0,
      extraDaysAfter: 0,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [layoutCalculation, setLayoutCalculation] = useState<LayoutCalculation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  
  const inventoryService = new InventoryService();
  const signSelectionService = new SignSelectionService();
  const layoutCalculatorService = new LayoutCalculatorService();

  const handleInputChange = (field: keyof DisplayFormData, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Trigger new layout calculation when key fields change
    if (['eventMessage', 'customMessage', 'eventNumber', 'characterTheme', 'hobbies', 'recipientName'].includes(field)) {
      // Debounce the layout update
      setTimeout(() => {
        generateLayoutPreview();
      }, 500);
    }
  };

  const handleHobbyToggle = (hobby: string) => {
    const currentHobbies = localData.hobbies || [];
    const newHobbies = currentHobbies.includes(hobby)
      ? currentHobbies.filter(h => h !== hobby)
      : [...currentHobbies, hobby];
    
    handleInputChange('hobbies', newHobbies);
  };

  const generateLayoutPreview = async () => {
    if (!localData.eventMessage || !localData.recipientName) {
      return;
    }
    
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      const message = localData.eventMessage === 'Custom Message' 
        ? (localData.customMessage || '') 
        : localData.eventMessage;
      
      if (!message.trim()) {
        setPreviewLoading(false);
        return;
      }
      
      const layoutResult = await layoutCalculatorService.calculateLayout({
        message: message,
        recipientName: localData.recipientName,
        eventNumber: localData.eventNumber,
        theme: localData.characterTheme,
        hobbies: localData.hobbies,
        agencyId: 'yardcard-elite-west-branch' // TODO: Get from route params
      });
      
      if (layoutResult.meetsMinimumFill) {
        setLayoutCalculation(layoutResult);
        
        // Create soft hold on all selected signs
        const allSignAllocations = [
          ...layoutResult.zone1.signs.map(sign => ({ signId: sign.signId, quantity: 1, holdType: 'soft' as const })),
          ...layoutResult.zone2.signs.map(sign => ({ signId: sign.signId, quantity: 1, holdType: 'soft' as const })),
          ...layoutResult.zone3.signs.map(sign => ({ signId: sign.signId, quantity: 1, holdType: 'soft' as const })),
          ...layoutResult.zone4.signs.map(sign => ({ signId: sign.signId, quantity: 1, holdType: 'soft' as const })),
          ...layoutResult.zone5.signs.map(sign => ({ signId: sign.signId, quantity: 1, holdType: 'soft' as const }))
        ];
        
        if (allSignAllocations.length > 0) {
          const holdResult = await inventoryService.createSoftHold(
            allSignAllocations,
            'yardcard-elite-west-branch',
            'session_' + Date.now().toString()
          );
          
          if (holdResult.success) {
            setHoldId(holdResult.holdId!);
          }
        }
      } else {
        setPreviewError(`Zone 3 fill requirement not met (${Math.round((layoutResult.zone3.fillPercentage || 0) * 100)}% < 60% minimum)`);
        setLayoutCalculation(layoutResult); // Still show the layout for debugging
      }
    } catch (error) {
      console.error('Error generating layout preview:', error);
      setPreviewError('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };
  
  const validateAndContinue = () => {
    const result = displaySchema.safeParse({ ...localData, holdId });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    updateFormData({ display: { ...localData, holdId: holdId || undefined } });
    nextStep();
  };
  
  // Generate initial layout preview
  useEffect(() => {
    if (localData.eventMessage && localData.recipientName) {
      generateLayoutPreview();
    }
  }, []);

  const calculateTotal = () => {
    const basePrice = 95;
    const extraDayPrice = 10;
    const extraDays = localData.extraDaysBefore + localData.extraDaysAfter;
    return basePrice + (extraDays * extraDayPrice);
  };

  const isValid = displaySchema.safeParse(localData).success;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-h2 text-neutral-900 mb-4">Customize Your Display</h1>
        <p className="text-body text-neutral-700">
          Design your perfect yard display with our collection of signs and themes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Customization Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Message */}
          <div>
            <label className="text-label text-neutral-700 mb-3 block">
              Event Message
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eventMessages.map((message) => (
                <button
                  key={message}
                  onClick={() => handleInputChange('eventMessage', message)}
                  className={`
                    p-3 text-center border-2 rounded-lg transition-colors
                    ${
                      localData.eventMessage === message
                        ? 'border-primary bg-secondary-pale text-primary'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }
                  `}
                >
                  <span className="text-body-small font-medium">{message}</span>
                </button>
              ))}
            </div>
            {localData.eventMessage === 'Custom Message' && (
              <div className="mt-4">
                <Input
                  value={localData.customMessage || ''}
                  onChange={(e) => handleInputChange('customMessage', e.target.value)}
                  placeholder="Enter your custom message"
                  className={errors.customMessage ? 'border-error' : ''}
                />
              </div>
            )}
            {errors.eventMessage && (
              <p className="text-body-small text-error-red mt-1">{errors.eventMessage}</p>
            )}
          </div>

          {/* Event Number */}
          <div>
            <label htmlFor="eventNumber" className="text-label text-neutral-700 mb-2 block">
              Age/Number (Optional)
            </label>
            <Input
              id="eventNumber"
              type="number"
              value={localData.eventNumber || ''}
              onChange={(e) => handleInputChange('eventNumber', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 25 for 25th birthday"
              min={1}
              max={100}
            />
          </div>

          {/* Recipient Name */}
          <div>
            <label htmlFor="recipientName" className="text-label text-neutral-700 mb-2 block">
              Recipient Name
            </label>
            <Input
              id="recipientName"
              type="text"
              value={localData.recipientName}
              onChange={(e) => handleInputChange('recipientName', e.target.value)}
              placeholder="Who is this celebration for?"
              className={errors.recipientName ? 'border-error' : ''}
            />
            {errors.recipientName && (
              <p className="text-body-small text-error-red mt-1">{errors.recipientName}</p>
            )}
          </div>

          {/* Message & Name Styles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-label text-neutral-700 mb-3 block">
                Message Style
              </label>
              <div className="space-y-2">
                {['Classic', 'Bold', 'Script', 'Fun'].map((style) => (
                  <label
                    key={style}
                    className={`
                      flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors
                      ${
                        localData.messageStyle === style
                          ? 'border-primary bg-secondary-pale'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="messageStyle"
                      value={style}
                      checked={localData.messageStyle === style}
                      onChange={(e) => handleInputChange('messageStyle', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-body font-medium">{style}</span>
                  </label>
                ))}
              </div>
              {errors.messageStyle && (
                <p className="text-body-small text-error-red mt-1">{errors.messageStyle}</p>
              )}
            </div>

            <div>
              <label className="text-label text-neutral-700 mb-3 block">
                Name Style
              </label>
              <div className="space-y-2">
                {['Classic', 'Bold', 'Script', 'Fun'].map((style) => (
                  <label
                    key={style}
                    className={`
                      flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors
                      ${
                        localData.nameStyle === style
                          ? 'border-primary bg-secondary-pale'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="nameStyle"
                      value={style}
                      checked={localData.nameStyle === style}
                      onChange={(e) => handleInputChange('nameStyle', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-body font-medium">{style}</span>
                  </label>
                ))}
              </div>
              {errors.nameStyle && (
                <p className="text-body-small text-error-red mt-1">{errors.nameStyle}</p>
              )}
            </div>
          </div>

          {/* Character Theme */}
          <div>
            <label className="text-label text-neutral-700 mb-3 block">
              Character Theme (Optional)
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleInputChange('characterTheme', 
                    localData.characterTheme === theme ? '' : theme
                  )}
                  className={`
                    p-3 text-center border-2 rounded-lg transition-colors
                    ${
                      localData.characterTheme === theme
                        ? 'border-primary bg-secondary-pale text-primary'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }
                  `}
                >
                  <span className="text-body-small font-medium">{theme}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hobbies/Interests */}
          <div>
            <label className="text-label text-neutral-700 mb-3 block">
              Hobbies/Interests (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {hobbies.map((hobby) => (
                <label
                  key={hobby}
                  className={`
                    flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors
                    ${
                      localData.hobbies?.includes(hobby)
                        ? 'border-primary bg-secondary-pale text-primary'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={localData.hobbies?.includes(hobby) || false}
                    onChange={() => handleHobbyToggle(hobby)}
                    className="sr-only"
                  />
                  <span className="text-body-small font-medium">{hobby}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Preview & Pricing */}
        <div className="space-y-6">
          {/* Preview Area */}
          <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
            <h3 className="text-h5 text-neutral-900 mb-4 flex items-center">
              Preview
              {previewLoading && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin text-primary" />
              )}
            </h3>
            
            {previewError ? (
              <div className="mb-4">
                <div className="aspect-[5/2] bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center mb-2">
                  <div className="text-center p-4">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-body-small text-red-700">{previewError}</p>
                  </div>
                </div>
                {layoutCalculation && (
                  <div className="text-xs text-neutral-500 text-center">
                    Showing debug layout - Zone 3 fill: {Math.round((layoutCalculation.zone3.fillPercentage || 0) * 100)}%
                  </div>
                )}
              </div>
            ) : null}
            
            {layoutCalculation ? (
              <div className="space-y-4 mb-4">
                <DisplayGrid layout={layoutCalculation} />
                
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-body-small font-medium">5-Zone Layout Generated</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Zone 1: {layoutCalculation.zone1.signs.length} message signs</div>
                    <div>Zone 2: {layoutCalculation.zone2.signs.length} name signs</div>
                    <div>Zone 3: {layoutCalculation.zone3.signs.length} decorations ({Math.round((layoutCalculation.zone3.fillPercentage || 0) * 100)}% fill)</div>
                    <div>Zone 4: {layoutCalculation.zone4.signs.length} backdrop elements</div>
                    <div>Zone 5: {layoutCalculation.zone5.signs.length} bookends</div>
                    <div className="col-span-2 font-medium">
                      Total: {layoutCalculation.zone1.signs.length + layoutCalculation.zone2.signs.length + layoutCalculation.zone3.signs.length + layoutCalculation.zone4.signs.length + layoutCalculation.zone5.signs.length} signs, {Math.round(layoutCalculation.totalWidth)} ft wide
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[5/3] bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center p-4">
                  <div className="text-h4 font-bold text-neutral-400 mb-2">
                    {localData.eventMessage || 'Your Message Here'}
                  </div>
                  {localData.eventNumber && (
                    <div className="text-6xl font-bold text-neutral-300 mb-2">
                      {localData.eventNumber}
                    </div>
                  )}
                  <div className="text-h5 text-neutral-400">
                    {localData.recipientName || 'Recipient Name'}
                  </div>
                  <p className="text-body-small text-neutral-500 mt-2">
                    Fill in the details above to see your preview
                  </p>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full mb-2" 
              onClick={generateLayoutPreview}
              disabled={previewLoading || !localData.eventMessage || !localData.recipientName}
            >
              {previewLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {layoutCalculation ? 'Regenerate Layout' : 'Generate Layout'}
            </Button>
            
            {layoutCalculation && layoutCalculation.meetsMinimumFill && (
              <p className="text-body-small text-green-700 text-center flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                All signs reserved for 1 hour
              </p>
            )}
          </div>

          {/* Pricing Panel */}
          <div className="bg-white border-2 border-neutral-200 rounded-lg p-6">
            <h3 className="text-h5 text-neutral-900 mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body">Base Package</span>
                <span className="text-body font-medium">$95</span>
              </div>
              
              {/* Extra Days Controls */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-small">Extra Days Before</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleInputChange('extraDaysBefore', Math.max(0, localData.extraDaysBefore - 1))}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      disabled={localData.extraDaysBefore <= 0}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{localData.extraDaysBefore}</span>
                    <button
                      onClick={() => handleInputChange('extraDaysBefore', Math.min(7, localData.extraDaysBefore + 1))}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      disabled={localData.extraDaysBefore >= 7}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-body-small">Extra Days After</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleInputChange('extraDaysAfter', Math.max(0, localData.extraDaysAfter - 1))}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      disabled={localData.extraDaysAfter <= 0}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{localData.extraDaysAfter}</span>
                    <button
                      onClick={() => handleInputChange('extraDaysAfter', Math.min(7, localData.extraDaysAfter + 1))}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center"
                      disabled={localData.extraDaysAfter >= 7}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {(localData.extraDaysBefore + localData.extraDaysAfter) > 0 && (
                  <div className="flex justify-between mt-2 text-body-small">
                    <span>Extra Days ({localData.extraDaysBefore + localData.extraDaysAfter} × $10)</span>
                    <span>${(localData.extraDaysBefore + localData.extraDaysAfter) * 10}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-3 flex justify-between text-h5 font-semibold">
                <span>Total</span>
                <span className="text-primary">${calculateTotal()}</span>
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
          Continue to Payment
        </Button>
      </div>
    </motion.div>
  );
}