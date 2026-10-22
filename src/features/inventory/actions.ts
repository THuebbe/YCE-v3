'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/db/supabase-client'
import { unstable_cache } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { getUserById } from '@/lib/db/supabase-client'
import type { 
  Sign, 
  InventoryItem, 
  AddToInventoryRequest, 
  UpdateInventoryRequest,
  AvailabilityCheck,
  BulkAvailabilityResult,
  SignSearchFilters,
  InventoryFilters,
  CustomSignUploadData
} from './types'
import { put, del } from '@vercel/blob'
import { SIGN_IMAGE_MAX_BYTES, SIGN_IMAGE_TYPES } from './limits'

// Helper function to get current tenant context
async function getCurrentTenant() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await getUserById(userId)
  if (!user || !user.agency) {
    throw new Error('User not associated with agency')
  }

  return {
    userId,
    agencyId: user.agency.id,
    agency: user.agency
  }
}

// Platform Sign Library Operations
export const getPlatformSignLibrary = unstable_cache(
  async (filters?: SignSearchFilters): Promise<Sign[]> => {
    try {
      let query = supabase
        .from('sign_library')
        .select('*')
        .eq('is_platform', true)
        .order('name')

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,keywords.cs.{${filters.search}}`)
      }

      if (filters?.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }

      if (filters?.themes && filters.themes.length > 0) {
        query = query.overlaps('themes', filters.themes)
      }

      if (filters?.holidays && filters.holidays.length > 0) {
        query = query.overlaps('holidays', filters.holidays)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching platform signs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Exception in getPlatformSignLibrary:', error)
      return []
    }
  },
  ['platform-signs'],
  { revalidate: 3600, tags: ['signs'] }
)

export async function addSignToInventory({ signId, quantity }: AddToInventoryRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Check if inventory item already exists
    const { data: existingItem } = await supabase
      .from('agency_inventory')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('sign_id', signId)
      .single()

    if (existingItem) {
      // Update existing inventory
      const newQuantity = existingItem.quantity + quantity
      const { error } = await supabase
        .from('agency_inventory')
        .update({
          quantity: newQuantity,
          available_quantity: newQuantity - existingItem.allocated_quantity - existingItem.deployed_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)

      if (error) {
        console.error('Error updating inventory:', error)
        return { success: false, error: 'Failed to update inventory' }
      }
    } else {
      // Create new inventory item
      const { error } = await supabase
        .from('agency_inventory')
        .insert({
          agency_id: agencyId,
          sign_id: signId,
          quantity,
          available_quantity: quantity,
          allocated_quantity: 0,
          deployed_quantity: 0
        })

      if (error) {
        console.error('Error creating inventory:', error)
        return { success: false, error: 'Failed to add to inventory' }
      }
    }

    revalidatePath('/[agency]/(app)/inventory', 'page')
    return { success: true }
  } catch (error) {
    console.error('Exception in addSignToInventory:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function getAgencyInventory(filters?: InventoryFilters): Promise<InventoryItem[]> {
  try {
    const { agencyId } = await getCurrentTenant()

    let query = supabase
      .from('agency_inventory')
      .select(`
        *,
        sign:sign_library(*)
      `)
      .eq('agency_id', agencyId)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (filters?.search) {
      // For inventory search, we need to join with signs and search sign names
      query = query.or(`sign.name.ilike.%${filters.search}%,sign.description.ilike.%${filters.search}%`)
    }

    if (filters?.lowStock) {
      query = query.lte('available_quantity', 5)
    }

    if (filters?.outOfStock) {
      query = query.eq('available_quantity', 0)
    }

    if (filters?.customOnly) {
      query = query.eq('sign.is_platform', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agency inventory:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception in getAgencyInventory:', error)
    return []
  }
}

export async function updateInventoryQuantity({ id, quantity }: UpdateInventoryRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Get current inventory item
    const { data: currentItem, error: fetchError } = await supabase
      .from('agency_inventory')
      .select('*')
      .eq('id', id)
      .eq('agency_id', agencyId)
      .single()

    if (fetchError || !currentItem) {
      return { success: false, error: 'Inventory item not found' }
    }

    // Calculate new available quantity
    const newAvailableQuantity = quantity - currentItem.allocated_quantity - currentItem.deployed_quantity

    if (newAvailableQuantity < 0) {
      return { success: false, error: 'Cannot reduce quantity below allocated/deployed amount' }
    }

    const { error } = await supabase
      .from('agency_inventory')
      .update({
        quantity,
        available_quantity: newAvailableQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('agency_id', agencyId)

    if (error) {
      console.error('Error updating inventory quantity:', error)
      return { success: false, error: 'Failed to update quantity' }
    }

    revalidatePath('/[agency]/(app)/inventory', 'page')
    return { success: true }
  } catch (error) {
    console.error('Exception in updateInventoryQuantity:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function removeFromInventory(inventoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Check if item has allocations
    const { data: item, error: fetchError } = await supabase
      .from('agency_inventory')
      .select('allocated_quantity, deployed_quantity')
      .eq('id', inventoryId)
      .eq('agency_id', agencyId)
      .single()

    if (fetchError || !item) {
      return { success: false, error: 'Inventory item not found' }
    }

    if (item.allocated_quantity > 0 || item.deployed_quantity > 0) {
      return { success: false, error: 'Cannot remove inventory with active allocations' }
    }

    const { error } = await supabase
      .from('agency_inventory')
      .delete()
      .eq('id', inventoryId)
      .eq('agency_id', agencyId)

    if (error) {
      console.error('Error removing inventory:', error)
      return { success: false, error: 'Failed to remove from inventory' }
    }

    revalidatePath('/[agency]/(app)/inventory', 'page')
    return { success: true }
  } catch (error) {
    console.error('Exception in removeFromInventory:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Availability and Hold Operations
export async function checkBulkAvailability(
  items: AvailabilityCheck[],
  startDate: Date,
  endDate: Date
): Promise<BulkAvailabilityResult> {
  try {
    const { agencyId } = await getCurrentTenant()

    const results = await Promise.all(
      items.map(async (item) => {
        // Get allocated quantities for the date range
        const { data: allocatedOrders } = await supabase
          .from('order_signs')
          .select(`
            quantity,
            order:orders!inner(event_date, status)
          `)
          .eq('sign_id', item.signId)
          .gte('order.event_date', startDate.toISOString())
          .lte('order.event_date', endDate.toISOString())
          .not('order.status', 'in', '(cancelled,completed)')

        const allocatedQuantity = allocatedOrders?.reduce((sum, os) => sum + os.quantity, 0) || 0

        // Get inventory quantity
        const { data: inventory } = await supabase
          .from('agency_inventory')
          .select('quantity')
          .eq('agency_id', agencyId)
          .eq('sign_id', item.signId)
          .single()

        const totalQuantity = inventory?.quantity || 0
        const available = totalQuantity - allocatedQuantity

        return {
          signId: item.signId,
          requested: item.quantity,
          available,
          isAvailable: available >= item.quantity
        }
      })
    )

    return {
      allAvailable: results.every(r => r.isAvailable),
      details: results
    }
  } catch (error) {
    console.error('Exception in checkBulkAvailability:', error)
    return {
      allAvailable: false,
      details: items.map(item => ({
        signId: item.signId,
        requested: item.quantity,
        available: 0,
        isAvailable: false
      }))
    }
  }
}

export async function createSoftHold(
  items: { signId: string; quantity: number }[],
  expiresAt: Date,
  orderId?: string,
  sessionId?: string
): Promise<{ success: boolean; holdId?: string; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Create the hold
    const { data: hold, error: holdError } = await supabase
      .from('inventory_holds')
      .insert({
        agency_id: agencyId,
        order_id: orderId,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (holdError || !hold) {
      console.error('Error creating inventory hold:', holdError)
      return { success: false, error: 'Failed to create hold' }
    }

    // Create hold items
    const holdItems = items.map(item => ({
      hold_id: hold.id,
      sign_id: item.signId,
      quantity: item.quantity,
      unit_price: 0 // Will be updated when order is created
    }))

    const { error: itemsError } = await supabase
      .from('inventory_hold_items')
      .insert(holdItems)

    if (itemsError) {
      console.error('Error creating hold items:', itemsError)
      // Clean up the hold if items failed
      await supabase.from('inventory_holds').delete().eq('id', hold.id)
      return { success: false, error: 'Failed to create hold items' }
    }

    return { success: true, holdId: hold.id }
  } catch (error) {
    console.error('Exception in createSoftHold:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Utility functions for filtering
export const getSignCategories = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('sign_library')
        .select('category')
        .not('category', 'is', null)

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      const categories = [...new Set(data?.map(item => item.category).filter(Boolean))]
      return categories.sort()
    } catch (error) {
      console.error('Exception in getSignCategories:', error)
      return []
    }
  },
  ['sign-categories'],
  { revalidate: 3600 }
)

export const getSignThemes = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('sign_library')
        .select('themes')
        .not('themes', 'is', null)

      if (error) {
        console.error('Error fetching themes:', error)
        return []
      }

      const allThemes = data?.flatMap(item => item.themes || []) || []
      const uniqueThemes = [...new Set(allThemes)]
      return uniqueThemes.sort()
    } catch (error) {
      console.error('Exception in getSignThemes:', error)
      return []
    }
  },
  ['sign-themes'],
  { revalidate: 3600 }
)

export const getSignHolidays = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('sign_library')
        .select('holidays')
        .not('holidays', 'is', null)

      if (error) {
        console.error('Error fetching holidays:', error)
        return []
      }

      const allHolidays = data?.flatMap(item => item.holidays || []) || []
      const uniqueHolidays = [...new Set(allHolidays)]
      return uniqueHolidays.sort()
    } catch (error) {
      console.error('Exception in getSignHolidays:', error)
      return []
    }
  },
  ['sign-holidays'],
  { revalidate: 3600 }
)

// Custom Sign Upload Operations
export async function uploadCustomSign(formData: FormData): Promise<{ success: boolean; signId?: string; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Extract form data
    const file = formData.get('image') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const themes = JSON.parse(formData.get('themes') as string || '[]')
    const holidays = JSON.parse(formData.get('holidays') as string || '[]')
    const keywords = JSON.parse(formData.get('keywords') as string || '[]')
    const sizeWidth = parseInt(formData.get('size_width') as string) || null
    const sizeHeight = parseInt(formData.get('size_height') as string) || null
    const dimensions = formData.get('dimensions') ? JSON.parse(formData.get('dimensions') as string) : null

    // Validate required fields
    if (!file || !name || !category) {
      return { success: false, error: 'Missing required fields' }
    }

    const fileError = signImageError(file)
    if (fileError) return { success: false, error: fileError }

    // Vercel Blob, like the order PDFs; one folder per agency
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60)
    const blob = await put(`signs/${agencyId}/${Date.now()}-${safeName}`, file, { access: 'public', contentType: file.type })
    const uploadResult = { url: blob.url, thumbnailUrl: null as string | null }

    // Create sign record in database
    const { data: sign, error: signError } = await supabase
      .from('sign_library')
      .insert({
        name,
        description,
        category,
        themes,
        holidays,
        keywords,
        size_width: sizeWidth,
        size_height: sizeHeight,
        dimensions,
        image_url: uploadResult.url,
        thumbnail_url: uploadResult.thumbnailUrl,
        is_platform: false,
        created_by: agencyId,
        rental_price: 0
      })
      .select()
      .single()

    if (signError) {
      // Clean up uploaded image if sign creation failed
      try {
        await del(uploadResult.url)
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image:', cleanupError)
      }
      
      console.error('Error creating custom sign:', signError)
      return { success: false, error: 'Failed to create sign record' }
    }

    revalidatePath('/[agency]/(app)/inventory', 'page')
    return { success: true, signId: sign.id }
  } catch (error) {
    console.error('Exception in uploadCustomSign:', error)
    return { success: false, error: 'Unexpected error occurred during upload' }
  }
}

export async function updateCustomSign(
  signId: string, 
  updates: Partial<CustomSignUploadData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Verify the sign belongs to this agency
    const { data: existingSign, error: fetchError } = await supabase
      .from('sign_library')
      .select('*')
      .eq('id', signId)
      .eq('created_by', agencyId)
      .eq('is_platform', false)
      .single()

    if (fetchError || !existingSign) {
      return { success: false, error: 'Custom sign not found' }
    }

    const { error } = await supabase
      .from('sign_library')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', signId)
      .eq('created_by', agencyId)

    if (error) {
      console.error('Error updating custom sign:', error)
      return { success: false, error: 'Failed to update sign' }
    }

    revalidatePath('/[agency]/(app)/inventory', 'page')
    return { success: true }
  } catch (error) {
    console.error('Exception in updateCustomSign:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function deleteCustomSign(signId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { agencyId } = await getCurrentTenant()

    // Get the sign details for cleanup
    const { data: sign, error: fetchError } = await supabase
      .from('sign_library')
      .select('image_url, thumbnail_url, created_by')
      .eq('id', signId)
      .eq('created_by', agencyId)
      .eq('is_platform', false)
      .single()

    if (fetchError || !sign) {
      return { success: false, error: 'Custom sign not found' }
    }

    // Check if sign is in any agency inventory
    const { data: inventoryItems } = await supabase
      .from('agency_inventory')
      .select('quantity')
      .eq('sign_id', signId)

    if (inventoryItems && inventoryItems.length > 0) {
      const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
      if (totalQuantity > 0) {
        return { success: false, error: 'Cannot delete sign that is in inventory. Remove from all inventories first.' }
      }
    }

    // Delete the sign record
    const { error: deleteError } = await supabase
      .from('sign_library')
      .delete()
      .eq('id', signId)
      .eq('created_by', agencyId)

    if (deleteError) {
      console.error('Error deleting custom sign:', deleteError)
      return { success: false, error: 'Failed to delete sign' }
    }

    // Clean up the uploaded image (only ours: Vercel Blob URLs)
    try {
      if (sign.image_url && /\.blob\.vercel-storage\.com\//.test(sign.image_url)) await del(sign.image_url)
    } catch (storageError) {
      console.warn('Failed to clean up the sign image:', storageError)
      // Continue - sign record is already deleted
    }

    revalidatePath('/[agency]/(app)/inventory', 'page')
    return { success: true }
  } catch (error) {
    console.error('Exception in deleteCustomSign:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

export async function getCustomSigns(): Promise<Sign[]> {
  try {
    const { agencyId } = await getCurrentTenant()

    const { data, error } = await supabase
      .from('sign_library')
      .select('*')
      .eq('created_by', agencyId)
      .eq('is_platform', false)
      .order('name')

    if (error) {
      console.error('Error fetching custom signs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception in getCustomSigns:', error)
    return []
  }
}
/** Why this file can't be a sign image, or null. Shared limit with the upload form. */
function signImageError(file: File | null): string | null {
  if (!file || typeof file === 'string') return 'Choose an image'
  if (!SIGN_IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG, WebP or GIF image'
  if (file.size > SIGN_IMAGE_MAX_BYTES) return `Images can be up to ${SIGN_IMAGE_MAX_BYTES / 1024 / 1024} MB`
  return null
}
