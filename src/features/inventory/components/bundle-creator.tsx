"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { SignCard } from './sign-card'
import { EmptyState } from './inventory-layout'
import { Package, Search, Check, X, AlertCircle, Grid, List } from 'lucide-react'
import { useToast } from '@/shared/components/feedback/toast'
import { getPlatformSignLibrary, createBundle, getBundles } from '../actions'
import type { Sign, Bundle, CreateBundleRequest } from '../types'

interface BundleCreatorProps {
  onSuccess?: (bundleId: string) => void
  onCancel?: () => void
}

export function BundleCreator({ onSuccess, onCancel }: BundleCreatorProps) {
  const { toast } = useToast()
  const [bundleData, setBundleData] = useState({
    name: '',
    description: ''
  })
  
  const [selectedSigns, setSelectedSigns] = useState<Sign[]>([])
  const [availableSigns, setAvailableSigns] = useState<Sign[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Bundle validation
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Load available signs
  useEffect(() => {
    const loadSigns = async () => {
      setIsLoading(true)
      try {
        const signs = await getPlatformSignLibrary()
        setAvailableSigns(signs)
      } catch (error) {
        console.error('Error loading signs:', error)
        toast({ variant: 'error', title: 'Failed to load available signs' })
      } finally {
        setIsLoading(false)
      }
    }

    loadSigns()
  }, [])

  // Filter available signs based on search and already selected
  const filteredSigns = availableSigns.filter(sign => {
    const matchesSearch = !searchTerm || 
      sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const notAlreadySelected = !selectedSigns.find(selected => selected.id === sign.id)
    
    return matchesSearch && notAlreadySelected
  })

  // Bundle validation logic
  const validateBundle = () => {
    const errors: string[] = []

    if (!bundleData.name.trim()) {
      errors.push('Bundle name is required')
    }

    if (selectedSigns.length < 2) {
      errors.push('A bundle must contain at least 2 signs')
    }

    if (selectedSigns.length > 10) {
      errors.push('A bundle cannot contain more than 10 signs')
    }

    // Calculate bundle "fullness" based on dimensions
    const totalArea = selectedSigns.reduce((sum, sign) => {
      const width = sign.sizeWidth || 24 // Default width
      const height = sign.sizeHeight || 18 // Default height
      return sum + (width * height)
    }, 0)

    // Assume a "full" yard display is roughly 2000 square inches
    const fullnessPercentage = (totalArea / 2000) * 100

    if (fullnessPercentage < 75) {
      errors.push(`Bundle is only ${Math.round(fullnessPercentage)}% full. Consider adding more signs to reach 75% minimum.`)
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  useEffect(() => {
    validateBundle()
  }, [bundleData.name, selectedSigns])

  const handleSelectSign = (sign: Sign) => {
    setSelectedSigns(prev => [...prev, sign])
  }

  const handleRemoveSign = (signId: string) => {
    setSelectedSigns(prev => prev.filter(sign => sign.id !== signId))
  }

  const handleCreateBundle = async () => {
    if (!validateBundle()) {
      toast({ variant: 'error', title: 'Please fix validation errors before creating the bundle' })
      return
    }

    setIsCreating(true)
    try {
      const request: CreateBundleRequest = {
        name: bundleData.name,
        description: bundleData.description,
        signIds: selectedSigns.map(sign => sign.id),
        bundlePositions: selectedSigns.map((_, index) => index + 1)
      }

      const result = await createBundle(request)

      if (result.success) {
        toast({ variant: 'success', title: 'Bundle created successfully!' })
        if (onSuccess) {
          onSuccess('new-bundle-id') // In real implementation, this would come from the result
        }
      } else {
        toast({ variant: 'error', title: result.error || 'Failed to create bundle' })
      }
    } catch (error) {
      console.error('Error creating bundle:', error)
      toast({ variant: 'error', title: 'Failed to create bundle' })
    } finally {
      setIsCreating(false)
    }
  }

  const calculateBundleStats = () => {
    const totalArea = selectedSigns.reduce((sum, sign) => {
      const width = sign.sizeWidth || 24
      const height = sign.sizeHeight || 18
      return sum + (width * height)
    }, 0)
    
    const fullnessPercentage = Math.round((totalArea / 2000) * 100)
    const categories = [...new Set(selectedSigns.map(sign => sign.category))]
    const themes = [...new Set(selectedSigns.flatMap(sign => sign.themes))]

    return {
      totalArea,
      fullnessPercentage,
      categories,
      themes,
      signCount: selectedSigns.length
    }
  }

  const stats = calculateBundleStats()

  return (
    <div className="space-y-6">
      {/* Bundle Details */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Bundle Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bundle Name *
            </label>
            <Input
              type="text"
              value={bundleData.name}
              onChange={(e) => setBundleData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter bundle name (e.g., Birthday Celebration Pack)"
              className={validationErrors.some(e => e.includes('name')) ? 'border-error' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={bundleData.description}
              onChange={(e) => setBundleData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this bundle and when it's most effective"
              rows={3}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* Bundle Stats & Validation */}
      {selectedSigns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Bundle Preview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{stats.signCount}</div>
              <div className="text-sm text-neutral-600">Signs</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                stats.fullnessPercentage >= 75 ? 'text-success' : 'text-warning'
              }`}>
                {stats.fullnessPercentage}%
              </div>
              <div className="text-sm text-neutral-600">Full</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{stats.categories.length}</div>
              <div className="text-sm text-neutral-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{stats.themes.length}</div>
              <div className="text-sm text-neutral-600">Themes</div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-error mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-error mb-1">Bundle Validation Issues</h4>
                  <ul className="text-sm text-error space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Fullness Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Bundle Fullness</span>
              <span className={`text-sm font-medium ${
                stats.fullnessPercentage >= 75 ? 'text-success' : 'text-warning'
              }`}>
                {stats.fullnessPercentage >= 75 ? 'Optimal' : 'Needs more signs'}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.fullnessPercentage >= 75 ? 'bg-success' : 'bg-warning'
                }`}
                style={{ width: `${Math.min(stats.fullnessPercentage, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Selected Signs */}
      {selectedSigns.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-900">
              Selected Signs ({selectedSigns.length})
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedSigns([])}
            >
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedSigns.map((sign, index) => (
              <div key={sign.id} className="relative">
                <SignCard
                  sign={sign}
                  showAddButton={false}
                  showCustomBadge={false}
                />
                <div className="absolute top-2 left-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <button
                  onClick={() => handleRemoveSign(sign.id)}
                  className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-error-dark"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Signs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-neutral-900">Available Signs</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search signs..."
                className="pl-10 w-64"
              />
            </div>
            <div className="flex rounded-md overflow-hidden border border-neutral-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-neutral-200 animate-pulse rounded-lg h-64"></div>
            ))}
          </div>
        ) : filteredSigns.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          }>
            {filteredSigns.map((sign) => (
              viewMode === 'grid' ? (
                <div key={sign.id} className="relative">
                  <SignCard
                    sign={sign}
                    showAddButton={false}
                    showCustomBadge={true}
                    onSelect={() => handleSelectSign(sign)}
                  />
                  <button
                    onClick={() => handleSelectSign(sign)}
                    className="absolute top-2 right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-dark shadow-lg"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div key={sign.id} className="flex items-center space-x-4 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                  <div className="relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden">
                    <img
                      src={sign.thumbnailUrl || sign.imageUrl}
                      alt={sign.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 truncate">{sign.name}</h4>
                    <p className="text-xs text-neutral-500">{sign.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {sign.themes.slice(0, 2).map(theme => (
                        <Badge key={theme} variant="outline" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectSign(sign)}
                    className="flex-shrink-0"
                  >
                    Add
                  </Button>
                </div>
              )
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="h-16 w-16" />}
            title="No signs found"
            description={searchTerm ? "No signs match your search criteria." : "No available signs to add to bundle."}
            action={searchTerm ? (
              <Button variant="secondary" onClick={() => setSearchTerm('')}>
                Clear search
              </Button>
            ) : undefined}
          />
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleCreateBundle}
          disabled={isCreating || validationErrors.length > 0}
          className="min-w-32"
        >
          {isCreating ? (
            <>
              <Package className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Create Bundle
            </>
          )}
        </Button>
      </div>
    </div>
  )
}