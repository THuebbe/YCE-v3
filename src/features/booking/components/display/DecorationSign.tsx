'use client';

import React from 'react';
import { SignStyle } from '../../types';

interface DecorationSignProps {
  name: string;
  style: SignStyle;
  className?: string;
}

export function DecorationSign({ name, style, className = '' }: DecorationSignProps) {
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
    width: isDevelopment ? (devStyle?.width || '2rem') : (prodStyle?.width || '2rem'),
    height: isDevelopment ? (devStyle?.height || '2rem') : (prodStyle?.height || '2rem'),
    backgroundColor: isDevelopment ? (devStyle?.backgroundColor || '#7c3aed') : undefined,
    borderRadius: isDevelopment ? (devStyle?.borderRadius || '50%') : undefined,
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
        <span className="text-xs text-white font-medium">
          {name.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}