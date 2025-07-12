import { supabaseStorage } from './supabase-client'
import type { SignImageMetadata, UploadResult, StorageUploadOptions } from './types'

// Since we don't have sharp in this setup, we'll use basic file handling
// In a production environment, you'd want to add sharp for image optimization

export class StorageService {
  private static readonly BUCKET_NAME = 'signs'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  static async uploadSignImage(
    file: File,
    agencyId: string,
    options: StorageUploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file)

    // Get image metadata
    const metadata = await this.getImageMetadata(file)

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${agencyId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`

    try {
      // Upload original file
      const { data: uploadData, error: uploadError } = await supabaseStorage.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabaseStorage.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName)

      let thumbnailUrl: string | undefined

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        try {
          thumbnailUrl = await this.generateThumbnail(file, agencyId, metadata)
        } catch (error) {
          console.warn('Thumbnail generation failed:', error)
          // Continue without thumbnail
        }
      }

      return {
        url: urlData.publicUrl,
        thumbnailUrl,
        size: file.size,
        dimensions: metadata,
        key: fileName
      }
    } catch (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async generateThumbnail(
    file: File,
    agencyId: string,
    metadata: SignImageMetadata
  ): Promise<string> {
    // Create a canvas for thumbnail generation
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    // Calculate thumbnail dimensions (maintaining aspect ratio)
    const maxThumbnailSize = 300
    const aspectRatio = metadata.width / metadata.height
    
    let thumbnailWidth: number
    let thumbnailHeight: number
    
    if (aspectRatio > 1) {
      thumbnailWidth = Math.min(maxThumbnailSize, metadata.width)
      thumbnailHeight = thumbnailWidth / aspectRatio
    } else {
      thumbnailHeight = Math.min(maxThumbnailSize, metadata.height)
      thumbnailWidth = thumbnailHeight * aspectRatio
    }

    canvas.width = thumbnailWidth
    canvas.height = thumbnailHeight

    // Load and draw image
    const img = new Image()
    img.src = URL.createObjectURL(file)
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight)

    // Convert canvas to blob
    const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create thumbnail blob')),
        'image/jpeg',
        0.8
      )
    })

    // Generate thumbnail filename
    const timestamp = Date.now()
    const thumbnailFileName = `${agencyId}/thumbnails/${timestamp}-${Math.random().toString(36).substring(2)}.jpg`

    // Upload thumbnail
    const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabaseStorage.storage
      .from(this.BUCKET_NAME)
      .upload(thumbnailFileName, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false
      })

    if (thumbnailUploadError) {
      throw new Error(`Thumbnail upload failed: ${thumbnailUploadError.message}`)
    }

    // Get thumbnail public URL
    const { data: thumbnailUrlData } = supabaseStorage.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(thumbnailFileName)

    // Clean up
    URL.revokeObjectURL(img.src)

    return thumbnailUrlData.publicUrl
  }

  private static async getImageMetadata(file: File): Promise<SignImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: file.type,
          size: file.size,
          hasTransparency: file.type === 'image/png' || file.type === 'image/gif'
        })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Failed to load image metadata'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  private static validateFile(file: File): void {
    if (!file) {
      throw new Error('No file provided')
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File must be a valid image (JPEG, PNG, WebP, or GIF)')
    }
  }

  static async deleteSignImage(key: string): Promise<void> {
    try {
      const { error } = await supabaseStorage.storage
        .from(this.BUCKET_NAME)
        .remove([key])

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`)
      }
    } catch (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  }

  static async listSignImages(agencyId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseStorage.storage
        .from(this.BUCKET_NAME)
        .list(agencyId, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        throw new Error(`Failed to list images: ${error.message}`)
      }

      return data?.map(file => `${agencyId}/${file.name}`) || []
    } catch (error) {
      console.error('Storage list error:', error)
      throw error
    }
  }

  static getPublicUrl(key: string): string {
    const { data } = supabaseStorage.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(key)

    return data.publicUrl
  }

  static isValidImageFile(file: File): boolean {
    return this.ALLOWED_TYPES.includes(file.type) && file.size <= this.MAX_FILE_SIZE
  }

  static getFileValidationError(file: File): string | null {
    if (!file) {
      return 'No file selected'
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return 'File must be a valid image (JPEG, PNG, WebP, or GIF)'
    }

    return null
  }
}