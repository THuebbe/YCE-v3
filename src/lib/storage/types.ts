export interface SignImageMetadata {
  width: number
  height: number
  format: string
  size: number
  hasTransparency?: boolean
}

export interface UploadResult {
  url: string
  thumbnailUrl?: string
  size: number
  dimensions: SignImageMetadata
  key: string
}

export interface StorageUploadOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  generateThumbnail?: boolean
  thumbnailSize?: { width: number; height: number }
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

export interface BulkUploadProgress {
  total: number
  completed: number
  current?: string
  errors?: Array<{ file: string; error: string }>
}