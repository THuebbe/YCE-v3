'use client';

import React from 'react';
import { SignStyle } from '../../types';

interface LetterStakeProps {
  character: string;
  style: SignStyle;
  isOrdinal?: boolean;
  className?: string;
}

export function LetterStake({ character, style, isOrdinal = false, className = '' }: LetterStakeProps) {
  // Use dev styling by default, with production override capability
  const devStyle = style.dev;
  const prodStyle = style.prod;
  
  // Determine if we're in development mode (using colored shapes) or production (using images)
  const isDevelopment = !prodStyle?.imageUrl;
  
  const baseClasses = `
    flex items-center justify-center font-bold text-white
    ${isDevelopment ? 'text-white' : ''}
    ${className}
  `.trim();
  
  const containerStyle: React.CSSProperties = {
    width: isDevelopment ? (devStyle?.width || '2rem') : (prodStyle?.width || '2rem'),
    height: isDevelopment ? (devStyle?.height || '2rem') : (prodStyle?.height || '2rem'),
    backgroundColor: isDevelopment ? (devStyle?.backgroundColor || '#1e40af') : undefined,
    borderRadius: isDevelopment ? (devStyle?.borderRadius || '4px') : undefined,
    backgroundImage: !isDevelopment ? `url(${prodStyle?.imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
  
  const fontSize = isOrdinal ? '0.75rem' : '1.25rem';
  
  return (
    <div 
      className={baseClasses}
      style={containerStyle}
    >
      {isDevelopment && (
        <span 
          style={{ 
            fontSize,
            lineHeight: isOrdinal ? '1' : '1.2',
            marginTop: isOrdinal ? '-0.25rem' : '0'
          }}
        >
          {character}
        </span>
      )}
    </div>
  );
}