'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({});

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

export function RadioGroup({ 
  value, 
  onValueChange, 
  name, 
  className, 
  ...props 
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn('grid gap-2', className)} {...props} />
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function RadioGroupItem({ 
  className, 
  value, 
  id,
  ...props 
}: RadioGroupItemProps) {
  const { value: groupValue, onValueChange, name } = React.useContext(RadioGroupContext);

  return (
    <input
      type="radio"
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-gray-300 text-primary shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      id={id}
      name={name}
      value={value}
      checked={groupValue === value}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    />
  );
}