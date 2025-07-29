'use client';

import React from 'react';
import { SignStyle } from '../../types';

interface BookendSignProps {
  name: string;
  style: SignStyle;
  position: 'left' | 'right';
  className?: string;
}

export function BookendSign({ name, style, position, className = '' }: BookendSignProps) {
  // Use dev styling by default, with production override capability
  const devStyle = style.dev;
  const prodStyle = style.prod;
  
  // Determine if we're in development mode (using colored shapes) or production (using images)
  const isDevelopment = !prodStyle?.imageUrl;
  
  const baseClasses = `
    flex items-center justify-center
    ${className}
  `.trim();
  
  const containerStyle: React.CSSProperties = {
    width: isDevelopment ? (devStyle?.width || '1.5rem') : (prodStyle?.width || '1.5rem'),
    height: isDevelopment ? (devStyle?.height || '4rem') : (prodStyle?.height || '4rem'), // Spans both rows
    backgroundColor: isDevelopment ? (devStyle?.backgroundColor || '#22c55e') : undefined,
    borderRadius: isDevelopment ? (devStyle?.borderRadius || '4px') : undefined,
    backgroundImage: !isDevelopment ? `url(${prodStyle?.imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: 0.7, // Slightly transparent to show it's a backdrop element
  };
  
  return (
    <div 
      className={baseClasses}
      style={containerStyle}
      title={`${name} (${position} bookend)`} // Tooltip for accessibility
    >
      {isDevelopment && (
        <span className="text-xs text-white font-bold transform -rotate-90">
          {position === 'left' ? '◀' : '▶'}
        </span>
      )}
    </div>
  );
}