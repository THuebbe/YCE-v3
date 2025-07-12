"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { InventoryCard } from './inventory-card'
import { EmptyState, InventoryStats } from './inventory-layout'
import { Search, Filter, Download, AlertTriangle, Package, Plus } from 'lucide-react'
import { useToast } from '@/shared/components/feedback/toast'
import { getAgencyInventory, updateInventoryQuantity, removeFromInventory } from '../actions'
import type { InventoryItem, InventoryFilters } from '../types'

interface MyInventoryListProps {
  initialInventory?: InventoryItem[]
}

export function MyInventoryList({ initialInventory = [] }: MyInventoryListProps) {
  const { toast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(initialInventory)
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: [],
    lowStock: false,
    outOfStock: false,
    customOnly: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      if (initialInventory.length === 0) {
        setIsLoading(true)
        try {
          const inventoryData = await getAgencyInventory()
          setInventory(inventoryData)
        } catch (error) {
          console.error('Error loading inventory:', error)
          toast({ variant: 'error', title: 'Failed to load inventory' })
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadInventory()
  }, [initialInventory.length])

  // Apply filters
  const applyFilters = useMemo(() => {
    let filtered = [...inventory]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item => 
        item.sign?.name.toLowerCase().includes(searchLower) ||
        item.sign?.description?.toLowerCase().includes(searchLower) ||
        item.sign?.category.toLowerCase().includes(searchLower) ||
        item.sign?.themes.some(theme => theme.toLowerCase().includes(searchLower)) ||
        item.sign?.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(item => 
        item.sign && filters.category!.includes(item.sign.category)
      )
    }

    // Stock status filters
    if (filters.lowStock) {
      filtered = filtered.filter(item => item.availableQuantity <= 5 && item.availableQuantity > 0)
    }

    if (filters.outOfStock) {
      filtered = filtered.filter(item => item.availableQuantity === 0)
    }

    // Custom signs only
    if (filters.customOnly) {
      filtered = filtered.filter(item => item.sign && !item.sign.isPlatform)
    }

    return filtered
  }, [inventory, filters])

  useEffect(() => {
    setFilteredInventory(applyFilters)
  }, [applyFilters])

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = inventory.length
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0)
    const availableQuantity = inventory.reduce((sum, item) => sum + item.availableQuantity, 0)
    const lowStockItems = inventory.filter(item => item.availableQuantity <= 5 && item.availableQuantity > 0).length
    const outOfStockItems = inventory.filter(item => item.availableQuantity === 0).length

    return [
      {
        label: 'Total Items',
        value: totalItems,
        change: totalItems > 0 ? 'Across all categories' : 'Add signs to get started'
      },
      {
        label: 'Total Quantity',
        value: totalQuantity,
        change: availableQuantity > 0 ? `${availableQuantity} available` : 'All allocated/deployed'
      },
      {
        label: 'Low Stock',
        value: lowStockItems,
        change: lowStockItems > 0 ? 'Need restocking' : 'All items well stocked',
        trend: lowStockItems > 0 ? 'down' as const : 'neutral' as const
      },
      {
        label: 'Out of Stock',
        value: outOfStockItems,
        change: outOfStockItems > 0 ? 'Unavailable for orders' : 'All items available',
        trend: outOfStockItems > 0 ? 'down' as const : 'up' as const
      }
    ]
  }, [inventory])

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(id))
    
    try {
      const result = await updateInventoryQuantity({ id, quantity })
      
      if (result.success) {
        // Update local state optimistically
        setInventory(prev => prev.map(item => 
          item.id === id 
            ? { 
                ...item, 
                quantity,
                availableQuantity: quantity - item.allocatedQuantity - item.deployedQuantity,
                updatedAt: new Date().toISOString()
              }
            : item
        ))
        toast({ variant: 'success', title: 'Quantity updated successfully' })
      } else {
        toast({ variant: 'error', title: result.error || 'Failed to update quantity' })
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast({ variant: 'error', title: 'Failed to update quantity' })
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (id: string) => {
    setUpdatingItems(prev => new Set(prev).add(id))
    
    try {
      const result = await removeFromInventory(id)
      
      if (result.success) {
        setInventory(prev => prev.filter(item => item.id !== id))
        toast({ variant: 'success', title: 'Item removed from inventory' })
      } else {
        toast({ variant: 'error', title: result.error || 'Failed to remove item' })
        setUpdatingItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast({ variant: 'error', title: 'Failed to remove item' })
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const availableCategories = useMemo(() => {
    const categories = inventory
      .map(item => item.sign?.category)
      .filter(Boolean) as string[]
    return [...new Set(categories)].sort()
  }, [inventory])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded mb-2"></div>
              <div className="h-8 bg-neutral-200 rounded mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Search skeleton */}
        <div className="h-12 bg-neutral-200 rounded-lg animate-pulse"></div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <InventoryStats stats={stats} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <Input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search inventory..."
              className="pl-10 h-12"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          <Button
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      {showFilters && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Categories</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.category?.includes(category) || false}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...(filters.category || []), category]
                          : (filters.category || []).filter(c => c !== category)
                        setFilters(prev => ({ ...prev, category: newCategories }))
                      }}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Stock Status</label>
              <div className="space-y-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.lowStock || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.checked }))}
                    className="rounded border-neutral-300 text-warning focus:ring-warning"
                  />
                  <span className="text-sm text-neutral-700">Low Stock (≤5)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.outOfStock || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, outOfStock: e.target.checked }))}
                    className="rounded border-neutral-300 text-error focus:ring-error"
                  />
                  <span className="text-sm text-neutral-700">Out of Stock</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Type</label>
              <div className="space-y-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.customOnly || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, customOnly: e.target.checked }))}
                    className="rounded border-neutral-300 text-accent-pink focus:ring-accent-pink"
                  />
                  <span className="text-sm text-neutral-700">Custom Signs Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {filteredInventory.length === inventory.length ? (
            <>Showing all {inventory.length} items</>
          ) : (
            <>Showing {filteredInventory.length} of {inventory.length} items</>
          )}
        </p>
      </div>

      {/* Inventory Grid */}
      {filteredInventory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInventory.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onDelete={handleRemoveItem}
              isLoading={updatingItems.has(item.id)}
            />
          ))}
        </div>
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Your inventory is empty"
          description="Start building your inventory by browsing the platform sign library and adding signs you want to track."
          action={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Browse Sign Library
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Search className="h-16 w-16" />}
          title="No items match your filters"
          description="Try adjusting your search terms or filters to find what you're looking for."
          action={
            <Button
              variant="secondary"
              onClick={() => setFilters({
                search: '',
                category: [],
                lowStock: false,
                outOfStock: false,
                customOnly: false
              })}
            >
              Clear all filters
            </Button>
          }
        />
      )}
    </div>
  )
}