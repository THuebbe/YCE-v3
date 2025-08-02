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
import { LetterStake } from '../display/LetterStake';
import { LayoutCalculation } from '../../types';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EventMessageConfig {
  message: string;
  supportsNumber: boolean;
  numberLabel?: string;
  numberPlaceholder?: string;
  numberType?: 'age' | 'year' | 'milestone' | 'general';
}

const eventMessages: EventMessageConfig[] = [
  {
    message: 'Happy Birthday',
    supportsNumber: true,
    numberLabel: 'Age',
    numberPlaceholder: 'e.g., 25 for 25th birthday',
    numberType: 'age'
  },
  {
    message: 'Happy Anniversary',
    supportsNumber: true,
    numberLabel: 'Anniversary Year',
    numberPlaceholder: 'e.g., 25 for 25th anniversary',
    numberType: 'milestone'
  },
  {
    message: 'Graduation',
    supportsNumber: true,
    numberLabel: 'Graduation Year',
    numberPlaceholder: 'e.g., 2024',
    numberType: 'year'
  },
  {
    message: 'Congratulations',
    supportsNumber: true,
    numberLabel: 'Year/Number (Optional)',
    numberPlaceholder: 'e.g., 2024 or milestone number',
    numberType: 'general'
  },
  {
    message: 'Welcome Home',
    supportsNumber: false
  },
  {
    message: 'Get Well Soon',
    supportsNumber: false
  },
  {
    message: 'Custom Message',
    supportsNumber: true,
    numberLabel: 'Number (Optional)',
    numberPlaceholder: 'Enter any number if applicable',
    numberType: 'general'
  }
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
      messageStyle: 'Classic',
      recipientName: '',
      nameStyle: 'Classic',
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
    
    // Auto-generation removed - users now manually generate layout with button
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
    console.log('🔄 validateAndContinue called');
    console.log('📊 localData:', localData);
    console.log('🔒 holdId:', holdId);
    
    const result = displaySchema.safeParse({ ...localData, holdId });
    console.log('✅ Validation result:', result);
    
    if (!result.success) {
      console.log('❌ Validation failed:', result.error.errors);
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    console.log('✅ Validation passed, updating form data and calling nextStep');
    updateFormData({ display: { ...localData, holdId: holdId || undefined } });
    console.log('🚀 About to call nextStep()');
    nextStep();
    console.log('🎯 nextStep() called');
  };
  
  // Auto-generation removed - users now manually generate layout with button

  const calculateTotal = () => {
    const basePrice = 95;
    const extraDayPrice = 10;
    const extraDays = localData.extraDaysBefore + localData.extraDaysAfter;
    return basePrice + (extraDays * extraDayPrice);
  };

  const isValid = displaySchema.safeParse(localData).success;
  console.log('🎛️ Button state - isValid:', isValid, 'localData:', localData);

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

      {/* Row 1: Preview (span 2 cols) + Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Preview - Spans 2 columns */}
        <div className="lg:col-span-2">
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
                <div className="aspect-[4/2] bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center mb-2">
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
              <div className="mb-4">
                <DisplayGrid layout={layoutCalculation} className="enhanced-preview" />
              </div>
            ) : (
              <div 
                className="aspect-[4/2] border-2 border-dashed border-neutral-300 rounded-lg relative overflow-hidden mb-4"
                style={{
                  backgroundImage: 'url(/preview-front-lawn.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'bottom',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {/* Static Placeholder Display */}
                <div className="flex flex-col items-center justify-end w-full h-full px-6 pb-8 pt-4">
                  {/* Top Row: "YOUR MESSAGE" */}
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {['Y', 'O', 'U', 'R', ' ', 'M', 'E', 'S', 'S', 'A', 'G', 'E'].map((char, index) => (
                      char === ' ' ? (
                        <div key={index} className="w-2"></div>
                      ) : (
                        <LetterStake
                          key={index}
                          character={char}
                          style={{
                            dev: {
                              width: '1.5rem',
                              height: '1.5rem'
                            }
                          }}
                          className="relative z-10"
                        />
                      )
                    ))}
                  </div>
                  
                  {/* Bottom Row: "HERE" */}
                  <div className="flex items-center justify-center gap-1">
                    {['H', 'E', 'R', 'E'].map((char, index) => (
                      <LetterStake
                        key={index}
                        character={char}
                        style={{
                          dev: {
                            width: '1.5rem',
                            height: '1.5rem'
                          }
                        }}
                        className="relative z-10"
                      />
                    ))}
                  </div>
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
        </div>

        {/* Pricing - Right column */}
        <div className="lg:col-span-1">
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

      {/* Row 2: Form Fields (span 2 cols) + Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Form Fields - Spans 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Message */}
            <div>
              <label htmlFor="eventMessage" className="text-label text-neutral-700 mb-2 block">
                Event Message
              </label>
              <select
                id="eventMessage"
                value={localData.eventMessage}
                onChange={(e) => handleInputChange('eventMessage', e.target.value)}
                className={`
                  w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none
                  ${
                    errors.eventMessage
                      ? 'border-error focus:border-error'
                      : 'border-neutral-300 focus:border-primary'
                  }
                `}
              >
                <option value="">Select an event message</option>
                {eventMessages.map((messageConfig) => (
                  <option key={messageConfig.message} value={messageConfig.message}>
                    {messageConfig.message}
                  </option>
                ))}
              </select>
              {localData.eventMessage === 'Custom Message' && (
                <div className="mt-3">
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
            
            {/* Event Number - Conditional based on selected message */}
            {(() => {
              const selectedMessageConfig = eventMessages.find(config => config.message === localData.eventMessage);
              const showNumberField = selectedMessageConfig?.supportsNumber || localData.eventMessage === 'Custom Message';
              
              if (!showNumberField) return <div></div>; // Empty div to maintain grid
              
              return (
                <div>
                  <label htmlFor="eventNumber" className="text-label text-neutral-700 mb-2 block">
                    {selectedMessageConfig?.numberLabel || 'Number (Optional)'}
                  </label>
                  <Input
                    id="eventNumber"
                    type="number"
                    value={localData.eventNumber || ''}
                    onChange={(e) => handleInputChange('eventNumber', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={selectedMessageConfig?.numberPlaceholder || 'Enter a number'}
                    min={selectedMessageConfig?.numberType === 'year' ? 1900 : 1}
                    max={selectedMessageConfig?.numberType === 'year' ? 2030 : 100}
                  />
                </div>
              );
            })()
            }
          </div>

          {/* Recipient Name - Full Width */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-label text-neutral-700 mb-3 block">
                Message Style
              </label>
              <div className="space-y-2">
                {['Classic', 'Bold', 'Script', 'Fun'].map((style) => (
                  <label
                    key={style}
                    className={`
                      flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm
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
                    <span className="text-body-small font-medium">{style}</span>
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
                      flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm
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
                    <span className="text-body-small font-medium">{style}</span>
                  </label>
                ))}
              </div>
              {errors.nameStyle && (
                <p className="text-body-small text-error-red mt-1">{errors.nameStyle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Options - Right column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Character Theme */}
          <div>
            <label htmlFor="characterTheme" className="text-label text-neutral-700 mb-2 block">
              Character Theme (Optional)
            </label>
            <select
              id="characterTheme"
              value={localData.characterTheme || ''}
              onChange={(e) => handleInputChange('characterTheme', e.target.value || '')}
              className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">No theme</option>
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          {/* Hobbies/Interests */}
          <div>
            <label className="text-label text-neutral-700 mb-3 block">
              Hobbies/Interests (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {hobbies.map((hobby) => (
                <label
                  key={hobby}
                  className={`
                    flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm
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
          onClick={() => {
            console.log('🖱️ Continue button clicked! isValid:', isValid);
            if (!isValid) {
              console.log('⚠️ Button is disabled, but click still fired');
              return;
            }
            validateAndContinue();
          }}
          disabled={!isValid}
          className="w-full md:w-auto px-8"
        >
          Continue to Payment
        </Button>
      </div>
    </motion.div>
  );
}