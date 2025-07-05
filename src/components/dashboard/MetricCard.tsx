'use client'

import { useState, useEffect } from 'react'

interface MetricCardProps {
  title: string
  value: number | string
  icon: string
  trend?: {
    value: number
    isPositive: boolean
  }
  colorScheme?: 'default' | 'success' | 'warning' | 'error'
  isLoading?: boolean
  description?: string
}

export function MetricCard({ 
  title, 
  value, 
  icon, 
  trend,
  colorScheme = 'default',
  isLoading = false,
  description
}: MetricCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const [showValue, setShowValue] = useState(false)

  useEffect(() => {
    if (!isLoading && typeof value === 'number') {
      const timer = setTimeout(() => {
        setShowValue(true)
        // Animate the number counting up
        const increment = Math.ceil(value / 30) // 30 frames for smooth animation
        let current = 0
        const counter = setInterval(() => {
          current += increment
          if (current >= value) {
            setAnimatedValue(value)
            clearInterval(counter)
          } else {
            setAnimatedValue(current)
          }
        }, 20)
        
        return () => clearInterval(counter)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [value, isLoading])

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'success':
        return {
          bg: 'bg-accent-green/10',
          text: 'text-accent-green',
          value: 'text-success-green'
        }
      case 'warning':
        return {
          bg: 'bg-accent-yellow/10',
          text: 'text-accent-yellow',
          value: 'text-warning-orange'
        }
      case 'error':
        return {
          bg: 'bg-error-red/10',
          text: 'text-error-red',
          value: 'text-error-red'
        }
      default:
        return {
          bg: 'bg-primary/10',
          text: 'text-primary',
          value: 'text-neutral-900'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="bg-white rounded-2xl shadow-default hover:shadow-medium transition-shadow duration-200 p-6 border border-neutral-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium tracking-wider uppercase text-neutral-500 mb-2">
            {title}
          </p>
          
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 bg-neutral-100 rounded animate-pulse"></div>
              {description && <div className="h-4 bg-neutral-100 rounded animate-pulse w-2/3"></div>}
            </div>
          ) : (
            <>
              <div className="flex items-baseline space-x-2">
                <h3 className={`text-2xl font-bold leading-none ${colors.value} transition-colors duration-200`}>
                  {typeof value === 'number' && showValue ? animatedValue.toLocaleString() : value}
                </h3>
                {trend && (
                  <span className={`flex items-center text-sm font-medium ${
                    trend.isPositive ? 'text-accent-green' : 'text-error-red'
                  }`}>
                    <span className="mr-1">
                      {trend.isPositive ? '↗' : '↘'}
                    </span>
                    {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
              
              {description && (
                <p className="text-sm text-neutral-500 mt-2">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg} flex-shrink-0`}>
          <span className={`text-xl ${colors.text}`} role="img" aria-label={title}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  )
}