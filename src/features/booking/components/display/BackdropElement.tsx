'use client';

import React from 'react';
import { SignStyle } from '../../types';

interface BackdropElementProps {
  name: string;
  style: SignStyle;
  className?: string;
}

export function BackdropElement({ name, style, className = '' }: BackdropElementProps) {
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
    width: isDevelopment ? (devStyle?.width || '1rem') : (prodStyle?.width || '1rem'),
    height: isDevelopment ? (devStyle?.height || '1rem') : (prodStyle?.height || '1rem'),
    backgroundColor: isDevelopment ? (devStyle?.backgroundColor || '#3b82f6') : undefined,
    borderRadius: isDevelopment ? (devStyle?.borderRadius || '2px') : undefined,
    backgroundImage: !isDevelopment ? `url(${prodStyle?.imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
  
  return (
    <div 
      className={baseClasses}
      style={containerStyle}
      title={name} // Tooltip for accessibility
    >
      {isDevelopment && (
        <span className="text-xs text-white font-bold">
          {name === 'Balloon Cluster' ? '🎈' : '◆'}
        </span>
      )}
    </div>
  );
}