"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import type { InventoryTab } from '../types'

interface InventoryLayoutProps {
  children: React.ReactNode
  activeTab: InventoryTab
  onTabChange: (tab: InventoryTab) => void
}

const tabs = [
  { id: 'library' as InventoryTab, label: 'Sign Library', description: 'Browse platform signs' },
  { id: 'inventory' as InventoryTab, label: 'My Inventory', description: 'Manage your stock' },
  { id: 'bundles' as InventoryTab, label: 'Bundles', description: 'Sign collections' },
  { id: 'custom' as InventoryTab, label: 'Custom Signs', description: 'Upload your own' }
]

export function InventoryLayout({ children, activeTab, onTabChange }: InventoryLayoutProps) {
  return (
    <div className="min-h-screen bg-background-light">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-neutral-400 mt-1">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        {children}
      </div>
    </div>
  )
}

interface InventoryHeaderProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function InventoryHeader({ title, description, action }: InventoryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{title}</h1>
        <p className="mt-2 text-lg text-neutral-600">{description}</p>
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 sm:ml-4">
          {action}
        </div>
      )}
    </div>
  )
}

interface InventoryStatsProps {
  stats: Array<{
    label: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'neutral'
  }>
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-600 truncate">{stat.label}</p>
              <p className="text-2xl font-semibold text-neutral-900">{stat.value}</p>
              {stat.change && (
                <p className={`text-sm ${
                  stat.trend === 'up' ? 'text-success' :
                  stat.trend === 'down' ? 'text-error' :
                  'text-neutral-500'
                }`}>
                  {stat.change}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-16 w-16 text-neutral-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  )
}