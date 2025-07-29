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
  
  // Calculate responsive sizing
  const containerWidth = '100%';
  const maxWidth = '600px'; // Reasonable max width for preview
  
  const baseClasses = `
    relative w-full bg-green-50 border-2 border-green-200 rounded-lg p-4
    flex items-center justify-center
    ${className}
  `.trim();
  
  const containerStyle: React.CSSProperties = {
    maxWidth,
    aspectRatio: '5/2', // Wide aspect ratio for yard display
  };
  
  // Calculate positioning for each zone
  const zone2Width = zone2.totalWidth;
  const zone1Width = zone1.totalWidth;
  const availableSpace = Math.max(0, zone1Width - zone2Width);
  const sideSpace = availableSpace / 2;
  
  return (
    <div className={baseClasses} style={containerStyle}>
      {/* Zone 5: Left Bookend */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
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
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
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
      <div className="flex flex-col items-center justify-center w-full h-full px-8">
        {/* Zone 1: Event Message (Top Row) */}
        <div className="flex items-center justify-center gap-1 mb-2">
          {zone1.signs.map((sign, index) => (
            <LetterStake
              key={`zone1-${index}`}
              character={sign.character || '?'}
              style={sign.style}
              isOrdinal={sign.isOrdinal}
              className="relative z-10"
            />
          ))}
        </div>
        
        {/* Zone 2, 3, 4: Bottom Row (Name + Decorations + Backdrop) */}
        <div className="relative flex items-center justify-center w-full">
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
                    style={sign.style}
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
                style={sign.style}
                className="relative z-20"
              />
            ))}
          </div>
          
          {/* Zone 2: Recipient Name (Center) */}
          <div className="flex items-center justify-center gap-1 relative z-10">
            {zone2.signs.map((sign, index) => (
              <LetterStake
                key={`zone2-${index}`}
                character={sign.character || '?'}
                style={sign.style}
                className="bg-opacity-90"
              />
            ))}
          </div>
          
          {/* Zone 3: Right Side Decorations */}
          <div className="flex items-center gap-1 ml-2">
            {zone3.signs.filter(sign => sign.position >= zone3.signs.length / 2).map((sign, index) => (
              <DecorationSign
                key={`zone3-right-${index}`}
                name={sign.signId}
                style={sign.style}
                className="relative z-20"
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Zone 3 Fill Percentage Indicator (Development only) */}
      {zone3.fillPercentage !== undefined && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            Zone 3 Fill: {Math.round(zone3.fillPercentage * 100)}%
            {zone3.fillPercentage >= 0.6 ? ' ✅' : ' ⚠️'}
          </div>
        </div>
      )}
    </div>
  );
}