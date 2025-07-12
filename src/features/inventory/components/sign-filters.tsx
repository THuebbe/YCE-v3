"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { SignSearchFilters } from '../types'

interface SignFiltersProps {
  filters: SignSearchFilters
  onFiltersChange: (filters: SignSearchFilters) => void
  availableCategories: string[]
  availableThemes: string[]
  availableHolidays: string[]
  isLoading?: boolean
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

function FilterSection({ title, children, defaultExpanded = true }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-b border-neutral-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  )
}

interface CheckboxGroupProps {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  emptyMessage?: string
}

function CheckboxGroup({ options, selected, onChange, emptyMessage = "No options available" }: CheckboxGroupProps) {
  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic">{emptyMessage}</p>
    )
  }

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option} className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => handleToggle(option)}
            className="rounded border-neutral-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-neutral-700">{option}</span>
        </label>
      ))}
    </div>
  )
}

export function SignFilters({
  filters,
  onFiltersChange,
  availableCategories,
  availableThemes,
  availableHolidays,
  isLoading = false
}: SignFiltersProps) {
  const activeFilterCount = [
    ...(filters.category || []),
    ...(filters.themes || []),
    ...(filters.holidays || []),
    ...(filters.sizes || [])
  ].length + (filters.bundleOnly ? 1 : 0)

  const handleClearAll = () => {
    onFiltersChange({
      search: filters.search,
      category: [],
      themes: [],
      holidays: [],
      sizes: [],
      bundleOnly: false
    })
  }

  const handleRemoveFilter = (type: string, value?: string) => {
    const newFilters = { ...filters }
    
    if (type === 'category' && value) {
      newFilters.category = filters.category?.filter(c => c !== value) || []
    } else if (type === 'themes' && value) {
      newFilters.themes = filters.themes?.filter(t => t !== value) || []
    } else if (type === 'holidays' && value) {
      newFilters.holidays = filters.holidays?.filter(h => h !== value) || []
    } else if (type === 'sizes' && value) {
      newFilters.sizes = filters.sizes?.filter(s => s !== value) || []
    } else if (type === 'bundleOnly') {
      newFilters.bundleOnly = false
    }
    
    onFiltersChange(newFilters)
  }

  const sizeOptions = ['Small (2-3 ft)', 'Medium (3-4 ft)', 'Large (4+ ft)', 'Extra Large (5+ ft)']

  if (isLoading) {
    return (
      <div className="w-64 p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-neutral-200 rounded mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-neutral-200 rounded"></div>
                  <div className="h-4 bg-neutral-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border border-neutral-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-900">Filters</h2>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Active Filters ({activeFilterCount})</h3>
          <div className="flex flex-wrap gap-1">
            {filters.category?.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
                <button
                  onClick={() => handleRemoveFilter('category', category)}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.themes?.map((theme) => (
              <Badge key={theme} variant="secondary" className="text-xs">
                {theme}
                <button
                  onClick={() => handleRemoveFilter('themes', theme)}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.holidays?.map((holiday) => (
              <Badge key={holiday} variant="secondary" className="text-xs">
                {holiday}
                <button
                  onClick={() => handleRemoveFilter('holidays', holiday)}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.sizes?.map((size) => (
              <Badge key={size} variant="secondary" className="text-xs">
                {size}
                <button
                  onClick={() => handleRemoveFilter('sizes', size)}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.bundleOnly && (
              <Badge variant="secondary" className="text-xs">
                Bundles Only
                <button
                  onClick={() => handleRemoveFilter('bundleOnly')}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-4">
        <FilterSection title="Size">
          <CheckboxGroup
            options={sizeOptions}
            selected={filters.sizes || []}
            onChange={(sizes) => onFiltersChange({ ...filters, sizes })}
          />
        </FilterSection>

        <FilterSection title="Category">
          <CheckboxGroup
            options={availableCategories}
            selected={filters.category || []}
            onChange={(category) => onFiltersChange({ ...filters, category })}
            emptyMessage="Loading categories..."
          />
        </FilterSection>

        <FilterSection title="Themes">
          <CheckboxGroup
            options={availableThemes}
            selected={filters.themes || []}
            onChange={(themes) => onFiltersChange({ ...filters, themes })}
            emptyMessage="Loading themes..."
          />
        </FilterSection>

        <FilterSection title="Holidays">
          <CheckboxGroup
            options={availableHolidays}
            selected={filters.holidays || []}
            onChange={(holidays) => onFiltersChange({ ...filters, holidays })}
            emptyMessage="Loading holidays..."
          />
        </FilterSection>

        <FilterSection title="Type">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.bundleOnly || false}
                onChange={(e) => onFiltersChange({ ...filters, bundleOnly: e.target.checked })}
                className="rounded border-neutral-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-neutral-700">Bundles Only</span>
            </label>
          </div>
        </FilterSection>
      </div>
    </div>
  )
}