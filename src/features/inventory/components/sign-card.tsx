"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card } from '@/shared/components/ui/card'
import { Plus, Package, Tag, Calendar, Ruler } from 'lucide-react'
import Image from 'next/image'
import type { Sign } from '../types'

interface SignCardProps {
  sign: Sign
  onAddToInventory?: (signId: string, quantity: number) => void
  showAddButton?: boolean
  showCustomBadge?: boolean
  isSelected?: boolean
  onSelect?: (signId: string) => void
  isLoading?: boolean
}

export function SignCard({
  sign,
  onAddToInventory,
  showAddButton = true,
  showCustomBadge = true,
  isSelected = false,
  onSelect,
  isLoading = false
}: SignCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddClick = () => {
    if (onAddToInventory) {
      setShowQuantityModal(true)
    }
  }

  const handleConfirmAdd = async () => {
    if (onAddToInventory && quantity > 0) {
      setIsAdding(true)
      try {
        await onAddToInventory(sign.id, quantity)
        setShowQuantityModal(false)
        setQuantity(1)
      } catch (error) {
        console.error('Failed to add to inventory:', error)
      } finally {
        setIsAdding(false)
      }
    }
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(sign.id)
    }
  }

  const formatPrice = (price: number) => {
    return price > 0 ? `$${price}` : 'Free'
  }

  const formatDimensions = () => {
    if (sign.sizeWidth && sign.sizeHeight) {
      return `${sign.sizeWidth}" × ${sign.sizeHeight}"`
    }
    if (sign.dimensions && typeof sign.dimensions === 'object') {
      const { width, height } = sign.dimensions as any
      if (width && height) {
        return `${width}" × ${height}"`
      }
    }
    return 'Size varies'
  }

  return (
    <>
      <Card
        className={`
          relative overflow-hidden transition-all duration-200 cursor-pointer
          ${isSelected ? 'ring-2 ring-primary' : ''}
          ${isHovered ? 'shadow-lg transform scale-[1.02]' : 'shadow-sm'}
          ${onSelect ? 'hover:shadow-md' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-neutral-100">
          <Image
            src={sign.thumbnailUrl || sign.imageUrl}
            alt={sign.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {!sign.isPlatform && showCustomBadge && (
              <Badge variant="secondary" className="bg-accent-pink text-white text-xs">
                Custom
              </Badge>
            )}
            {sign.bundleId && (
              <Badge variant="secondary" className="bg-primary text-white text-xs">
                <Package className="h-3 w-3 mr-1" />
                Bundle
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-neutral-900 text-xs">
              {formatPrice(sign.rentalPrice)}
            </Badge>
          </div>

          {/* Hover overlay with add button */}
          {showAddButton && isHovered && !showQuantityModal && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddClick()
                }}
                className="shadow-lg"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Inventory
              </Button>
            </div>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-neutral-900 text-sm mb-2 line-clamp-2">
            {sign.name}
          </h3>

          <div className="space-y-2">
            {/* Category */}
            <div className="flex items-center text-xs text-neutral-500">
              <Tag className="h-3 w-3 mr-1" />
              {sign.category}
            </div>

            {/* Dimensions */}
            <div className="flex items-center text-xs text-neutral-500">
              <Ruler className="h-3 w-3 mr-1" />
              {formatDimensions()}
            </div>

            {/* Themes */}
            {sign.themes && sign.themes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sign.themes.slice(0, 2).map((theme) => (
                  <Badge key={theme} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
                {sign.themes.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{sign.themes.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Holidays */}
            {sign.holidays && sign.holidays.length > 0 && (
              <div className="flex items-center text-xs text-neutral-500">
                <Calendar className="h-3 w-3 mr-1" />
                {sign.holidays.slice(0, 2).join(', ')}
                {sign.holidays.length > 2 && ` +${sign.holidays.length - 2}`}
              </div>
            )}
          </div>

          {/* Description */}
          {sign.description && (
            <p className="text-xs text-neutral-600 mt-2 line-clamp-2">
              {sign.description}
            </p>
          )}
        </div>
      </Card>

      {/* Quantity Modal */}
      {showQuantityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Add to Inventory
            </h3>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden">
                <Image
                  src={sign.thumbnailUrl || sign.imageUrl}
                  alt={sign.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-900">{sign.name}</h4>
                <p className="text-sm text-neutral-500">{sign.category}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-neutral-300 rounded px-2 py-1"
                  min="1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowQuantityModal(false)}
                className="flex-1"
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAdd}
                className="flex-1"
                disabled={isAdding}
              >
                {isAdding ? 'Adding...' : 'Add to Inventory'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}