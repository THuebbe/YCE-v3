export interface Sign {
  id: string
  name: string
  description?: string
  category: string
  theme?: string
  sizeWidth?: number
  sizeHeight?: number
  dimensions?: Record<string, any>
  themes: string[]
  holidays: string[]
  keywords: string[]
  imageUrl: string
  thumbnailUrl?: string
  isPlatform: boolean
  createdBy?: string
  bundleId?: string
  bundlePosition?: number
  rentalPrice: number
  createdAt: string
  updatedAt: string
}

export interface Bundle {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  signs?: Sign[]
}

export interface InventoryItem {
  id: string
  agencyId: string
  signId: string
  quantity: number
  availableQuantity: number
  allocatedQuantity: number
  deployedQuantity: number
  createdAt: string
  updatedAt: string
  sign?: Sign
}

export interface InventoryHold {
  id: string
  agencyId: string
  orderId?: string
  sessionId?: string
  isActive: boolean
  expiresAt: string
  createdAt: string
  items?: InventoryHoldItem[]
}

export interface InventoryHoldItem {
  id: string
  holdId: string
  signId: string
  quantity: number
  unitPrice: number
  sign?: Sign
}

export interface SignSearchFilters {
  search?: string
  category?: string[]
  themes?: string[]
  holidays?: string[]
  sizes?: string[]
  isPlatform?: boolean
  bundleOnly?: boolean
}

export interface InventoryFilters {
  search?: string
  category?: string[]
  lowStock?: boolean
  outOfStock?: boolean
  customOnly?: boolean
}

export interface AddToInventoryRequest {
  signId: string
  quantity: number
}

export interface UpdateInventoryRequest {
  id: string
  quantity: number
}

export interface CreateBundleRequest {
  name: string
  description?: string
  signIds: string[]
  bundlePositions: number[]
}

export interface UploadCustomSignRequest {
  name: string
  description?: string
  category: string
  themes: string[]
  holidays: string[]
  keywords: string[]
  sizeWidth?: number
  sizeHeight?: number
  dimensions?: Record<string, any>
  imageFile: File
}

export interface CustomSignUploadData {
  name: string
  description?: string
  category: string
  themes: string[]
  holidays: string[]
  keywords: string[]
  sizeWidth?: number
  sizeHeight?: number
  dimensions?: Record<string, any>
}

export interface AvailabilityCheck {
  signId: string
  quantity: number
  startDate: Date
  endDate: Date
}

export interface AvailabilityResult {
  signId: string
  requested: number
  available: number
  isAvailable: boolean
}

export interface BulkAvailabilityResult {
  allAvailable: boolean
  details: AvailabilityResult[]
}

export interface SignImageMetadata {
  width: number
  height: number
  format: string
  size: number
}

export interface UploadResult {
  url: string
  thumbnailUrl?: string
  size: number
  dimensions: SignImageMetadata
}

// UI Component Props Types
export interface SignCardProps {
  sign: Sign
  onAddToInventory?: (signId: string, quantity: number) => void
  showAddButton?: boolean
  showCustomBadge?: boolean
  isSelected?: boolean
  onSelect?: (signId: string) => void
}

export interface InventoryCardProps {
  item: InventoryItem
  onUpdateQuantity?: (id: string, quantity: number) => void
  onEdit?: (item: InventoryItem) => void
  onDelete?: (id: string) => void
}

export interface FilterSidebarProps {
  filters: SignSearchFilters | InventoryFilters
  onFiltersChange: (filters: SignSearchFilters | InventoryFilters) => void
  availableCategories: string[]
  availableThemes: string[]
  availableHolidays: string[]
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
}

export type InventoryTab = 'library' | 'inventory' | 'bundles' | 'custom'

export interface InventoryLayoutProps {
  activeTab: InventoryTab
  onTabChange: (tab: InventoryTab) => void
  children: React.ReactNode
}