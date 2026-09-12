export interface Sign {
  id: string
  name: string
  description?: string
  category: string
  theme?: string
  size_width?: number
  size_height?: number
  dimensions?: Record<string, any>
  themes: string[]
  holidays: string[]
  keywords: string[]
  image_url: string
  thumbnail_url?: string
  is_platform: boolean
  created_by?: string
  bundle_id?: string
  bundle_position?: number
  rental_price: number
  created_at: string
  updated_at: string
}

export interface Bundle {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  signs?: Sign[]
}

export interface InventoryItem {
  id: string
  agency_id: string
  sign_id: string
  quantity: number
  available_quantity: number
  allocated_quantity: number
  deployed_quantity: number
  created_at: string
  updated_at: string
  sign?: Sign
}

export interface InventoryHold {
  id: string
  agency_id: string
  order_id?: string
  session_id?: string
  is_active: boolean
  expires_at: string
  created_at: string
  items?: InventoryHoldItem[]
}

export interface InventoryHoldItem {
  id: string
  hold_id: string
  sign_id: string
  quantity: number
  unit_price: number
  sign?: Sign
}

export interface SignSearchFilters {
  search?: string
  category?: string[]
  themes?: string[]
  holidays?: string[]
  sizes?: string[]
  is_platform?: boolean
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
  size_width?: number
  size_height?: number
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
  size_width?: number
  size_height?: number
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
  thumbnail_url?: string
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
