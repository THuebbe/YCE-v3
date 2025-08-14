'use client';

import React from 'react';
import { LayoutCalculation } from '../../types';
import { LetterStake } from './LetterStake';
import { DecorationSign } from './DecorationSign';
import { BackdropElement } from './BackdropElement';
import { BookendSign } from './BookendSign';

interface DisplayGridProps {
  layout: LayoutCalculation;
  className?: string;
}

export function DisplayGrid({ layout, className = '' }: DisplayGridProps) {
  const { zone1, zone2, zone3, zone4, zone5, gridColumns } = layout;
  
  // Mobile detection for responsive behavior
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Calculate responsive sizing - enhanced for larger preview
  const containerWidth = '100%';
  const maxWidth = className?.includes('enhanced-preview') || className?.includes('review-preview') ? '100%' : '600px';
  
  // Dynamic sizing based on container and content with mobile optimization
  const isEnhanced = className?.includes('enhanced-preview') || className?.includes('review-preview');
  const getResponsiveSize = (baseSize: 'large' | 'medium' | 'small') => {
    // Ultra aggressive mobile scaling to prevent overflow
    if (isMobile) {
      // Mobile-specific sizing with much smaller minimums to ensure fit
      if (baseSize === 'large') {
        return isEnhanced ? 'clamp(0.5rem, 3vw, 1rem)' : 'clamp(0.4rem, 2.5vw, 0.8rem)';
      } else if (baseSize === 'medium') {
        return isEnhanced ? 'clamp(0.4rem, 2vw, 0.8rem)' : 'clamp(0.35rem, 1.8vw, 0.6rem)';
      } else {
        return isEnhanced ? 'clamp(0.35rem, 1.8vw, 0.6rem)' : 'clamp(0.3rem, 1.5vw, 0.5rem)';
      }
    } else {
      // Desktop sizing (existing logic)
      if (baseSize === 'large') {
        return isEnhanced ? 'clamp(1.25rem, 3vw, 2rem)' : 'clamp(1rem, 2.5vw, 1.5rem)';
      } else if (baseSize === 'medium') {
        return isEnhanced ? 'clamp(1rem, 2.5vw, 1.25rem)' : 'clamp(0.75rem, 2vw, 1rem)';
      } else {
        return isEnhanced ? 'clamp(0.75rem, 2vw, 1rem)' : 'clamp(0.5rem, 1.5vw, 0.75rem)';
      }
    }
  };
  
  const baseClasses = `
    relative w-full border-2 border-green-200 rounded-lg
    flex items-center justify-center overflow-hidden
    ${isMobile ? 'p-3' : 'p-6'}
    ${isMobile ? 'mobile-preview' : 'desktop-preview'}
    ${className}
  `.trim();
  
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: 'url(/preview-front-lawn.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'bottom',
    backgroundRepeat: 'no-repeat',
  };
  
  const containerStyle: React.CSSProperties = {
    maxWidth,
    // Dynamic aspect ratio: mobile uses 5/4 for better text accommodation, desktop uses 4/2
    aspectRatio: isMobile ? '5/4' : '4/2',
    minHeight: isMobile 
      ? (isEnhanced ? '240px' : '180px') 
      : (isEnhanced ? '280px' : '200px'),
    ...backgroundStyle,
  };
  
  // Calculate positioning for each zone
  const zone2Width = zone2.totalWidth;
  const zone1Width = zone1.totalWidth;
  const availableSpace = Math.max(0, zone1Width - zone2Width);
  const sideSpace = availableSpace / 2;
  
  return (
    <div className={baseClasses} style={containerStyle}>
      {/* Zone 5: Left Bookend */}
      <div className="absolute left-2 bottom-8 transform translate-y-0">
        {zone5.signs.filter(sign => sign.position === 0).map((sign, index) => (
          <BookendSign
            key={`bookend-left-${index}`}
            name={sign.signId}
            style={sign.style}
            position="left"
          />
        ))}
      </div>
      
      {/* Zone 5: Right Bookend */}
      <div className="absolute right-2 bottom-8 transform translate-y-0">
        {zone5.signs.filter(sign => sign.position === 1).map((sign, index) => (
          <BookendSign
            key={`bookend-right-${index}`}
            name={sign.signId}
            style={sign.style}
            position="right"
          />
        ))}
      </div>
      
      {/* Main Display Area */}
      <div className={`flex flex-col items-center justify-end w-full h-full ${isMobile ? 'px-2 pb-4 pt-2' : 'px-6 pb-8 pt-4'}`}>
        {/* Zone 1: Event Message (Top Row) */}
        <div className={`flex items-center justify-center max-w-full overflow-hidden ${isMobile ? 'gap-0 mb-2' : 'gap-1 mb-3'}`}>
          {zone1.signs.map((sign, index) => (
            <div key={`zone1-${index}`} className="flex-shrink-0">
              <LetterStake
                character={sign.character || '?'}
                style={{
                  ...sign.style,
                  dev: {
                    ...sign.style?.dev,
                    width: getResponsiveSize('large'),
                    height: getResponsiveSize('large')
                  }
                }}
                isOrdinal={sign.isOrdinal}
                className="relative z-10"
              />
            </div>
          ))}
        </div>
        
        {/* Zone 2, 3, 4: Bottom Row (Name + Decorations + Backdrop) */}
        <div className="relative flex items-center justify-center w-full max-w-full overflow-hidden">
          {/* Zone 4: Backdrop Elements (Behind everything) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2">
              {zone4.signs.map((sign, index) => (
                <div
                  key={`zone4-${index}`}
                  className="absolute"
                  style={{
                    left: `${(index + 1) * 15}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <BackdropElement
                    name={sign.signId}
                    style={{
                      ...sign.style,
                      dev: {
                        ...sign.style?.dev,
                        width: getResponsiveSize('small'),
                        height: getResponsiveSize('small')
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Zone 3: Left Side Decorations */}
          <div className={`flex items-center ${isMobile ? 'gap-0 mr-0.5' : 'gap-1 mr-2'}`}>
            {zone3.signs.filter(sign => sign.position < zone3.signs.length / 2).map((sign, index) => (
              <DecorationSign
                key={`zone3-left-${index}`}
                name={sign.signId}
                style={{
                  ...sign.style,
                  dev: {
                    ...sign.style?.dev,
                    width: getResponsiveSize('medium'),
                    height: getResponsiveSize('medium')
                  }
                }}
                className="relative z-20 flex-shrink-0"
              />
            ))}
          </div>
          
          {/* Zone 2: Recipient Name (Center) */}
          <div className={`flex items-center justify-center relative z-10 max-w-full overflow-hidden ${isMobile ? 'gap-0' : 'gap-1'}`}>
            {zone2.signs.map((sign, index) => (
              <div key={`zone2-${index}`} className="flex-shrink-0">
                <LetterStake
                  character={sign.character || '?'}
                  style={{
                    ...sign.style,
                    dev: {
                      ...sign.style?.dev,
                      width: getResponsiveSize('large'),
                      height: getResponsiveSize('large')
                    }
                  }}
                  className="bg-opacity-90"
                />
              </div>
            ))}
          </div>
          
          {/* Zone 3: Right Side Decorations */}
          <div className={`flex items-center ${isMobile ? 'gap-0 ml-0.5' : 'gap-1 ml-2'}`}>
            {zone3.signs.filter(sign => sign.position >= zone3.signs.length / 2).map((sign, index) => (
              <DecorationSign
                key={`zone3-right-${index}`}
                name={sign.signId}
                style={{
                  ...sign.style,
                  dev: {
                    ...sign.style?.dev,
                    width: getResponsiveSize('medium'),
                    height: getResponsiveSize('medium')
                  }
                }}
                className="relative z-20 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}