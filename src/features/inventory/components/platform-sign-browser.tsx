"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/shared/components/ui/button'
import { SignSearchBar } from './sign-search-bar'
import { SignFilters } from './sign-filters'
import { SignCard } from './sign-card'
import { EmptyState } from './inventory-layout'
import { Package, AlertCircle, Search } from 'lucide-react'
import { useToast } from '@/shared/components/feedback/toast'
import { addSignToInventory, getPlatformSignLibrary, getSignCategories, getSignThemes, getSignHolidays } from '../actions'
import type { Sign, SignSearchFilters } from '../types'

interface PlatformSignBrowserProps {
  initialSigns?: Sign[]
}

export function PlatformSignBrowser({ initialSigns = [] }: PlatformSignBrowserProps) {
  const { toast } = useToast()
  const [signs, setSigns] = useState<Sign[]>(initialSigns)
  const [filteredSigns, setFilteredSigns] = useState<Sign[]>(initialSigns)
  const [filters, setFilters] = useState<SignSearchFilters>({
    search: '',
    category: [],
    themes: [],
    holidays: [],
    sizes: [],
    bundleOnly: false
  })
  const [categories, setCategories] = useState<string[]>([])
  const [themes, setThemes] = useState<string[]>([])
  const [holidays, setHolidays] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingToInventory, setIsAddingToInventory] = useState<string | null>(null)

  // Load filter options and signs
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [signsData, categoriesData, themesData, holidaysData] = await Promise.all([
          getPlatformSignLibrary(),
          getSignCategories(),
          getSignThemes(),
          getSignHolidays()
        ])

        setSigns(signsData)
        setCategories(categoriesData)
        setThemes(themesData)
        setHolidays(holidaysData)
      } catch (error) {
        console.error('Error loading platform data:', error)
        toast({ variant: 'error', title: 'Failed to load sign library' })
      } finally {
        setIsLoading(false)
      }
    }

    if (initialSigns.length === 0) {
      loadData()
    } else {
      // Load just the filter options if we have initial signs
      Promise.all([
        getSignCategories(),
        getSignThemes(),
        getSignHolidays()
      ]).then(([categoriesData, themesData, holidaysData]) => {
        setCategories(categoriesData)
        setThemes(themesData)
        setHolidays(holidaysData)
      })
    }
  }, [initialSigns.length])

  // Filter signs based on current filters
  const applyFilters = useMemo(() => {
    let filtered = [...signs]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(sign => 
        sign.name.toLowerCase().includes(searchLower) ||
        sign.description?.toLowerCase().includes(searchLower) ||
        sign.category.toLowerCase().includes(searchLower) ||
        sign.themes.some(theme => theme.toLowerCase().includes(searchLower)) ||
        sign.holidays.some(holiday => holiday.toLowerCase().includes(searchLower)) ||
        sign.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(sign => filters.category!.includes(sign.category))
    }

    // Themes filter
    if (filters.themes && filters.themes.length > 0) {
      filtered = filtered.filter(sign => 
        filters.themes!.some(theme => sign.themes.includes(theme))
      )
    }

    // Holidays filter
    if (filters.holidays && filters.holidays.length > 0) {
      filtered = filtered.filter(sign => 
        filters.holidays!.some(holiday => sign.holidays.includes(holiday))
      )
    }

    // Size filter
    if (filters.sizes && filters.sizes.length > 0) {
      filtered = filtered.filter(sign => {
        const width = sign.sizeWidth || 0
        const height = sign.sizeHeight || 0
        const maxDimension = Math.max(width, height)
        
        return filters.sizes!.some(size => {
          if (size.includes('Small') && maxDimension <= 36) return true
          if (size.includes('Medium') && maxDimension > 36 && maxDimension <= 48) return true
          if (size.includes('Large') && maxDimension > 48 && maxDimension <= 60) return true
          if (size.includes('Extra Large') && maxDimension > 60) return true
          return false
        })
      })
    }

    // Bundle filter
    if (filters.bundleOnly) {
      filtered = filtered.filter(sign => sign.bundleId)
    }

    return filtered
  }, [signs, filters])

  useEffect(() => {
    setFilteredSigns(applyFilters)
  }, [applyFilters])

  const handleAddToInventory = async (signId: string, quantity: number) => {
    setIsAddingToInventory(signId)
    try {
      const result = await addSignToInventory({ signId, quantity })
      
      if (result.success) {
        toast({ variant: 'success', title: `Added ${quantity} sign${quantity > 1 ? 's' : ''} to inventory` })
      } else {
        toast({ variant: 'error', title: result.error || 'Failed to add to inventory' })
      }
    } catch (error) {
      console.error('Error adding to inventory:', error)
      toast({ variant: 'error', title: 'Failed to add to inventory' })
    } finally {
      setIsAddingToInventory(null)
    }
  }

  const handleFiltersChange = (newFilters: SignSearchFilters) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex gap-6">
        {/* Filter sidebar skeleton */}
        <div className="w-64">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
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
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1">
          <div className="mb-6">
            <div className="h-12 bg-neutral-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-neutral-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded"></div>
                  <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Filters Sidebar */}
      <div className="flex-shrink-0">
        <SignFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={categories}
          availableThemes={themes}
          availableHolidays={holidays}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Search Bar */}
        <div className="mb-6">
          <SignSearchBar
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search by name, category, theme, or keywords..."
          />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-600">
            {filteredSigns.length === signs.length ? (
              <>Showing all {signs.length} signs</>
            ) : (
              <>Showing {filteredSigns.length} of {signs.length} signs</>
            )}
          </p>
          
          {filters.bundleOnly && (
            <div className="flex items-center text-sm text-neutral-600">
              <Package className="h-4 w-4 mr-1" />
              Bundle view active
            </div>
          )}
        </div>

        {/* Signs Grid */}
        {filteredSigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSigns.map((sign) => (
              <SignCard
                key={sign.id}
                sign={sign}
                onAddToInventory={handleAddToInventory}
                showAddButton={true}
                showCustomBadge={true}
                isLoading={isAddingToInventory === sign.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="h-16 w-16" />}
            title="No signs found"
            description={
              filters.search || (filters.category && filters.category.length > 0) || 
              (filters.themes && filters.themes.length > 0) || (filters.holidays && filters.holidays.length > 0) ?
              "No signs match your search criteria. Try adjusting your filters or search terms." :
              "No signs available in the platform library."
            }
            action={
              (filters.search || (filters.category && filters.category.length > 0) || 
               (filters.themes && filters.themes.length > 0) || (filters.holidays && filters.holidays.length > 0)) && (
                <Button
                  variant="secondary"
                  onClick={() => setFilters({
                    search: '',
                    category: [],
                    themes: [],
                    holidays: [],
                    sizes: [],
                    bundleOnly: false
                  })}
                >
                  Clear all filters
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}