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
  
  // Calculate responsive sizing - enhanced for larger preview
  const containerWidth = '100%';
  const maxWidth = className?.includes('enhanced-preview') ? '100%' : '600px';
  
  const baseClasses = `
    relative w-full border-2 border-green-200 rounded-lg p-6
    flex items-center justify-center overflow-hidden
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
    aspectRatio: '4/2', // Better aspect ratio for new layout
    minHeight: className?.includes('enhanced-preview') ? '280px' : '200px',
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
      <div className="flex flex-col items-center justify-end w-full h-full px-6 pb-8 pt-4">
        {/* Zone 1: Event Message (Top Row) */}
        <div className="flex items-center justify-center gap-1 mb-3 max-w-full overflow-hidden">
          {zone1.signs.map((sign, index) => (
            <div key={`zone1-${index}`} className="flex-shrink-0">
              <LetterStake
                character={sign.character || '?'}
                style={{
                  ...sign.style,
                  dev: {
                    ...sign.style?.dev,
                    width: className?.includes('enhanced-preview') ? '2rem' : '1.5rem',
                    height: className?.includes('enhanced-preview') ? '2rem' : '1.5rem'
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
                        width: className?.includes('enhanced-preview') ? '1rem' : '0.75rem',
                        height: className?.includes('enhanced-preview') ? '1rem' : '0.75rem'
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Zone 3: Left Side Decorations */}
          <div className="flex items-center gap-1 mr-2">
            {zone3.signs.filter(sign => sign.position < zone3.signs.length / 2).map((sign, index) => (
              <DecorationSign
                key={`zone3-left-${index}`}
                name={sign.signId}
                style={{
                  ...sign.style,
                  dev: {
                    ...sign.style?.dev,
                    width: className?.includes('enhanced-preview') ? '1.25rem' : '1rem',
                    height: className?.includes('enhanced-preview') ? '1.25rem' : '1rem'
                  }
                }}
                className="relative z-20 flex-shrink-0"
              />
            ))}
          </div>
          
          {/* Zone 2: Recipient Name (Center) */}
          <div className="flex items-center justify-center gap-1 relative z-10 max-w-full overflow-hidden">
            {zone2.signs.map((sign, index) => (
              <div key={`zone2-${index}`} className="flex-shrink-0">
                <LetterStake
                  character={sign.character || '?'}
                  style={{
                    ...sign.style,
                    dev: {
                      ...sign.style?.dev,
                      width: className?.includes('enhanced-preview') ? '2rem' : '1.5rem',
                      height: className?.includes('enhanced-preview') ? '2rem' : '1.5rem'
                    }
                  }}
                  className="bg-opacity-90"
                />
              </div>
            ))}
          </div>
          
          {/* Zone 3: Right Side Decorations */}
          <div className="flex items-center gap-1 ml-2">
            {zone3.signs.filter(sign => sign.position >= zone3.signs.length / 2).map((sign, index) => (
              <DecorationSign
                key={`zone3-right-${index}`}
                name={sign.signId}
                style={{
                  ...sign.style,
                  dev: {
                    ...sign.style?.dev,
                    width: className?.includes('enhanced-preview') ? '1.25rem' : '1rem',
                    height: className?.includes('enhanced-preview') ? '1.25rem' : '1rem'
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