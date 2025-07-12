"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Upload, X, Image as ImageIcon, AlertCircle, Check, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/shared/components/feedback/toast'
import { uploadCustomSign, getSignCategories, getSignThemes, getSignHolidays } from '../actions'
import { StorageService } from '@/lib/storage/supabase'
import type { CustomSignUploadData } from '../types'

interface CustomSignUploadFormProps {
  onSuccess?: (signId: string) => void
  onCancel?: () => void
}

export function CustomSignUploadForm({ onSuccess, onCancel }: CustomSignUploadFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CustomSignUploadData>({
    name: '',
    description: '',
    category: '',
    themes: [],
    holidays: [],
    keywords: []
  })
  
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Form options
  const [categories, setCategories] = useState<string[]>([])
  const [themes, setThemes] = useState<string[]>([])
  const [holidays, setHolidays] = useState<string[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  
  // UI state
  const [keywordInput, setKeywordInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load form options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoriesData, themesData, holidaysData] = await Promise.all([
          getSignCategories(),
          getSignThemes(),
          getSignHolidays()
        ])
        setCategories(categoriesData)
        setThemes(themesData)
        setHolidays(holidaysData)
      } catch (error) {
        console.error('Error loading form options:', error)
        toast({ variant: 'error', title: 'Failed to load form options' })
      } finally {
        setIsLoadingOptions(false)
      }
    }
    loadOptions()
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    return StorageService.getFileValidationError(file)
  }, [])

  const handleFileSelect = useCallback((selectedFile: File) => {
    const error = validateFile(selectedFile)
    if (error) {
      setErrors(prev => ({ ...prev, file: error }))
      return
    }

    setFile(selectedFile)
    setErrors(prev => ({ ...prev, file: '' }))

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }, [validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData((prev: CustomSignUploadData) => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData((prev: CustomSignUploadData) => ({
      ...prev,
      keywords: prev.keywords.filter((k: string) => k !== keyword)
    }))
  }

  const toggleTheme = (theme: string) => {
    setFormData((prev: CustomSignUploadData) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t: string) => t !== theme)
        : [...prev.themes, theme]
    }))
  }

  const toggleHoliday = (holiday: string) => {
    setFormData((prev: CustomSignUploadData) => ({
      ...prev,
      holidays: prev.holidays.includes(holiday)
        ? prev.holidays.filter((h: string) => h !== holiday)
        : [...prev.holidays, holiday]
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!file) {
      newErrors.file = 'Please select an image file'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Sign name is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const submitFormData = new FormData()
      submitFormData.append('image', file!)
      submitFormData.append('name', formData.name)
      submitFormData.append('description', formData.description || '')
      submitFormData.append('category', formData.category)
      submitFormData.append('themes', JSON.stringify(formData.themes))
      submitFormData.append('holidays', JSON.stringify(formData.holidays))
      submitFormData.append('keywords', JSON.stringify(formData.keywords))
      
      if (formData.sizeWidth) {
        submitFormData.append('sizeWidth', formData.sizeWidth.toString())
      }
      if (formData.sizeHeight) {
        submitFormData.append('sizeHeight', formData.sizeHeight.toString())
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await uploadCustomSign(submitFormData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        toast({ variant: 'success', title: 'Custom sign uploaded successfully!' })
        if (onSuccess && result.signId) {
          onSuccess(result.signId)
        }
      } else {
        toast({ variant: 'error', title: result.error || 'Failed to upload custom sign' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({ variant: 'error', title: 'Failed to upload custom sign' })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Upload Sign Image</h3>
        
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-neutral-300'}
            ${file ? 'border-success bg-success/5' : ''}
            ${errors.file ? 'border-error bg-error/5' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="space-y-4">
              <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-neutral-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-center text-success">
                <Check className="h-5 w-5 mr-2" />
                <span className="text-sm">{file?.name}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 text-neutral-400">
                <ImageIcon className="h-12 w-12" />
              </div>
              <div>
                <p className="text-lg font-medium text-neutral-900">
                  Drop your image here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary-dark"
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  Supports JPEG, PNG, WebP, GIF up to 10MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {errors.file && (
          <div className="mt-2 flex items-center text-error text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.file}
          </div>
        )}
      </Card>

      {/* Sign Details */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Sign Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sign Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev: CustomSignUploadData) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter sign name"
              className={errors.name ? 'border-error' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-error">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev: CustomSignUploadData) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter sign description"
              rows={3}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category *
            </label>
            {isLoadingOptions ? (
              <div className="h-10 bg-neutral-200 animate-pulse rounded-lg"></div>
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev: CustomSignUploadData) => ({ ...prev, category: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.category ? 'border-error' : 'border-neutral-300'
                }`}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="custom">Custom Category</option>
              </select>
            )}
            {errors.category && (
              <p className="mt-1 text-sm text-error">{errors.category}</p>
            )}
          </div>

          {/* Custom Category Input */}
          {formData.category === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Custom Category
              </label>
              <Input
                type="text"
                placeholder="Enter custom category"
                onChange={(e) => setFormData((prev: CustomSignUploadData) => ({ ...prev, category: e.target.value }))}
              />
            </div>
          )}

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Width (inches)
            </label>
            <Input
              type="number"
              value={formData.sizeWidth || ''}
              onChange={(e) => setFormData((prev: CustomSignUploadData) => ({ ...prev, sizeWidth: parseInt(e.target.value) || undefined }))}
              placeholder="24"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Height (inches)
            </label>
            <Input
              type="number"
              value={formData.sizeHeight || ''}
              onChange={(e) => setFormData((prev: CustomSignUploadData) => ({ ...prev, sizeHeight: parseInt(e.target.value) || undefined }))}
              placeholder="18"
              min="1"
            />
          </div>
        </div>
      </Card>

      {/* Themes */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Themes</h3>
        {isLoadingOptions ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-8 bg-neutral-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {themes.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => toggleTheme(theme)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-colors text-left
                  ${formData.themes.includes(theme)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary'
                  }
                `}
              >
                {theme}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Holidays */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Holidays</h3>
        {isLoadingOptions ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-neutral-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {holidays.map((holiday) => (
              <button
                key={holiday}
                type="button"
                onClick={() => toggleHoliday(holiday)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-colors text-left
                  ${formData.holidays.includes(holiday)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary'
                  }
                `}
              >
                {holiday}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Keywords */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Keywords</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Add keywords for better searchability"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addKeyword}
              variant="secondary"
              disabled={!keywordInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {formData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((keyword: string) => (
                <Badge key={keyword} variant="secondary" className="text-sm">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-error"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">Uploading...</span>
              <span className="text-sm text-neutral-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isUploading || !file}
          className="min-w-32"
        >
          {isUploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Sign
            </>
          )}
        </Button>
      </div>
    </form>
  )
}