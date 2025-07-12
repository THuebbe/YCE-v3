"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Edit3, Trash2, Save, X, AlertTriangle, Package, Star } from 'lucide-react'
import Image from 'next/image'
import type { InventoryItem } from '../types'

interface InventoryCardProps {
  item: InventoryItem
  onUpdateQuantity?: (id: string, quantity: number) => void
  onEdit?: (item: InventoryItem) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

export function InventoryCard({
  item,
  onUpdateQuantity,
  onEdit,
  onDelete,
  isLoading = false
}: InventoryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditQuantity(item.quantity)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditQuantity(item.quantity)
  }

  const handleSaveEdit = async () => {
    if (onUpdateQuantity && editQuantity !== item.quantity) {
      setIsSaving(true)
      try {
        await onUpdateQuantity(item.id, editQuantity)
        setIsEditing(false)
      } catch (error) {
        console.error('Error updating quantity:', error)
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to remove this item from inventory?')) {
      setIsDeleting(true)
      try {
        await onDelete(item.id)
      } catch (error) {
        console.error('Error deleting inventory item:', error)
        setIsDeleting(false)
      }
    }
  }

  const getStockStatus = () => {
    if (item.availableQuantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-error text-white' }
    } else if (item.availableQuantity <= 5) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-warning text-white' }
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'bg-success text-white' }
    }
  }

  const stockStatus = getStockStatus()
  const sign = item.sign

  if (!sign) {
    return (
      <Card className="p-4">
        <div className="text-center text-neutral-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Sign data not available</p>
        </div>
      </Card>
    )
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
    <Card className={`relative overflow-hidden transition-all duration-200 ${isLoading || isDeleting ? 'opacity-50' : ''}`}>
      {/* Stock Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge className={`text-xs ${stockStatus.color}`}>
          {stockStatus.label}
        </Badge>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] bg-neutral-100">
        <Image
          src={sign.thumbnailUrl || sign.imageUrl}
          alt={sign.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Custom badge */}
        {!sign.isPlatform && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-accent-pink text-white text-xs">
              Custom
            </Badge>
          </div>
        )}

        {/* Bundle badge */}
        {sign.bundleId && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-primary text-white text-xs">
              <Package className="h-3 w-3 mr-1" />
              Bundle
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-neutral-900 text-sm mb-1 line-clamp-2">
              {sign.name}
            </h3>
            <p className="text-xs text-neutral-500 mb-2">{sign.category}</p>
            <p className="text-xs text-neutral-500">{formatDimensions()}</p>
          </div>
        </div>

        {/* Inventory Quantities */}
        <div className="space-y-2 mb-4">
          {/* Total Quantity - Editable */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Total:</span>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 h-8 text-sm text-center"
                  min="0"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-neutral-900">{item.quantity}</span>
                {onUpdateQuantity && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStartEdit}
                    className="h-6 w-6 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Available Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Available:</span>
            <span className={`font-medium ${
              item.availableQuantity === 0 ? 'text-error' :
              item.availableQuantity <= 5 ? 'text-warning' :
              'text-success'
            }`}>
              {item.availableQuantity}
            </span>
          </div>

          {/* Allocated Quantity */}
          {item.allocatedQuantity > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Allocated:</span>
              <span className="font-medium text-info">{item.allocatedQuantity}</span>
            </div>
          )}

          {/* Deployed Quantity */}
          {item.deployedQuantity > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Deployed:</span>
              <span className="font-medium text-neutral-700">{item.deployedQuantity}</span>
            </div>
          )}
        </div>

        {/* Themes */}
        {sign.themes && sign.themes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {sign.themes.slice(0, 3).map((theme) => (
              <Badge key={theme} variant="outline" className="text-xs">
                {theme}
              </Badge>
            ))}
            {sign.themes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{sign.themes.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="text-xs text-neutral-500">
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </div>
          
          <div className="flex items-center space-x-1">
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(item)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
            
            {onDelete && item.allocatedQuantity === 0 && item.deployedQuantity === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-error hover:text-error hover:bg-error/10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Warning for items with allocations */}
        {(item.allocatedQuantity > 0 || item.deployedQuantity > 0) && onDelete && (
          <div className="mt-2 p-2 bg-warning/10 rounded-md">
            <div className="flex items-center text-xs text-warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Cannot remove - has active allocations
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {(isLoading || isDeleting) && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
    </Card>
  )
}