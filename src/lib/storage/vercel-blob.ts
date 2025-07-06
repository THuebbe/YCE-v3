import { put, del, list } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

export interface BlobListResult {
  blobs: {
    url: string;
    downloadUrl: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
    contentType: string;
    contentDisposition: string;
  }[];
  hasMore: boolean;
  cursor?: string;
}

export class VercelBlobService {
  private readonly token: string;
  private readonly baseUrl: string;

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || '';
    this.baseUrl = process.env.BLOB_STORE_URL || '';
    
    if (!this.token) {
      console.warn('BLOB_READ_WRITE_TOKEN environment variable is not set. Document generation will not work.');
      // Don't throw error during construction to allow the app to load
    }
  }

  private ensureTokenExists() {
    if (!this.token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required for document generation');
    }
  }

  /**
   * Upload a document to Vercel Blob storage
   */
  async uploadDocument(
    filename: string,
    data: Buffer | string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    this.ensureTokenExists();
    
    try {
      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFilename = `documents/${timestamp}-${sanitizedFilename}`;

      const blob = await put(uniqueFilename, data, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      });

      return blob.url;
    } catch (error) {
      throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload an image to Vercel Blob storage
   */
  async uploadImage(
    filename: string,
    data: Buffer,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    this.ensureTokenExists();
    
    try {
      const sanitizedFilename = this.sanitizeFilename(filename);
      const timestamp = Date.now();
      const uniqueFilename = `images/${timestamp}-${sanitizedFilename}`;

      const blob = await put(uniqueFilename, data, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
      });

      return blob.url;
    } catch (error) {
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a blob from storage
   */
  async deleteBlob(url: string): Promise<void> {
    this.ensureTokenExists();
    
    try {
      await del(url);
    } catch (error) {
      throw new Error(`Failed to delete blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List blobs in storage
   */
  async listBlobs(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<BlobListResult> {
    this.ensureTokenExists();
    
    try {
      const result = await list(options);
      
      return {
        blobs: result.blobs.map(blob => ({
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          contentType: (blob as any).contentType || 'application/octet-stream',
          contentDisposition: (blob as any).contentDisposition || 'inline'
        })),
        hasMore: result.hasMore,
        cursor: result.cursor
      };
    } catch (error) {
      throw new Error(`Failed to list blobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(pathname: string, expiresIn: number = 3600): Promise<string> {
    try {
      // For Vercel Blob, URLs are already accessible if they're public
      // This method is for potential future use with private blobs
      return `${this.baseUrl}/${pathname}`;
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get blob metadata
   */
  async getBlobMetadata(url: string) {
    try {
      // Extract pathname from URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // List blobs to find the specific one
      const result = await this.listBlobs({ prefix: pathname.substring(1) });
      const blob = result.blobs.find(b => b.pathname === pathname.substring(1));
      
      if (!blob) {
        throw new Error('Blob not found');
      }

      return blob;
    } catch (error) {
      throw new Error(`Failed to get blob metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace unsafe characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace unsafe chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();
  }

  /**
   * Get file extension from content type
   */
  private getExtensionFromContentType(contentType: string): string {
    const extensions: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'text/plain': '.txt',
      'application/json': '.json',
      'text/csv': '.csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-excel': '.xls',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };

    return extensions[contentType] || '';
  }

  /**
   * Generate a unique filename with timestamp
   */
  private generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split('.').pop() || '';
    const nameWithoutExtension = originalFilename.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExtension}-${timestamp}-${randomString}${extension ? '.' + extension : ''}`;
  }
}

// Export a factory function to create instances when needed
export function createBlobService(): VercelBlobService {
  return new VercelBlobService();
}

// Export utility functions
export { put as uploadBlob, del as deleteBlob, list as listBlobs } from '@vercel/blob';