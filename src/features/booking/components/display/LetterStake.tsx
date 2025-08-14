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
  // Mobile detection for responsive behavior
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
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
  
  // Ultra aggressive mobile font sizing to prevent overflow
  const getFontSize = () => {
    if (isMobile) {
      // Ultra aggressive mobile scaling based on container size
      const containerWidth = typeof devStyle?.width === 'string' 
        ? parseFloat(devStyle.width.replace('rem', '')) 
        : 2; // fallback to 2rem
      
      if (isOrdinal) {
        return `${Math.max(0.25, containerWidth * 0.2)}rem`; // Even more aggressive scaling
      } else {
        return `${Math.max(0.35, containerWidth * 0.3)}rem`; // Even more aggressive scaling
      }
    } else {
      // Desktop sizing (existing logic)
      return isOrdinal ? '0.75rem' : '1.25rem';
    }
  };
  
  const fontSize = getFontSize();
  
  return (
    <div 
      className={baseClasses}
      style={containerStyle}
    >
      {isDevelopment && (
        <span 
          style={{ 
            fontSize,
            lineHeight: isMobile ? (isOrdinal ? '0.9' : '1') : (isOrdinal ? '1' : '1.2'),
            marginTop: isMobile ? '0' : (isOrdinal ? '-0.25rem' : '0'),
            fontWeight: isMobile ? '800' : 'bold' // Bolder text on mobile for clarity
          }}
        >
          {character}
        </span>
      )}
    </div>
  );
}