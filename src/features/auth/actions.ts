'use server'

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db/supabase-client'
import { 
  createAgencySchema, 
  checkSubdomainSchema,
  type CreateAgencyResult,
  type SubdomainCheckResult 
} from '@/lib/validation'
// import { hasPermission, Permissions } from '@/lib/auth/roles' // TODO: Implement with Supabase

// Check if a slug is available
export async function checkSubdomainAvailability(slug: string): Promise<SubdomainCheckResult> {
  try {
    // Validate input
    const result = checkSubdomainSchema.safeParse({ slug })
    if (!result.success) {
      return {
        available: false,
        message: result.error.errors[0]?.message || 'Invalid slug'
      }
    }

    // Check if slug already exists using Supabase
    const { data: existingAgency, error } = await supabase
      .from('agencies')
      .select('id')
      .eq('slug', slug)
      .eq('isActive', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which means slug is available
      console.error('Error checking slug availability:', error)
      return {
        available: false,
        message: 'Unable to check slug availability'
      }
    }

    if (existingAgency) {
      return {
        available: false,
        message: 'This slug is already taken'
      }
    }

    return {
      available: true,
      message: 'Slug is available'
    }
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return {
      available: false,
      message: 'Unable to check slug availability'
    }
  }
}

// Create a new agency
export async function createAgency(formData: FormData): Promise<CreateAgencyResult> {
  console.log('🏢 createAgency server action called with:', Object.fromEntries(formData))
  
  try {
    // Get current user
    const user = await currentUser()
    if (!user) {
      return {
        success: false,
        error: 'You must be signed in to create an agency'
      }
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || undefined,
    }

    const validationResult = createAgencySchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0]?.message || 'Invalid form data'
      }
    }

    const { name, slug, description } = validationResult.data

    // Double-check slug availability
    const availabilityCheck = await checkSubdomainAvailability(slug)
    if (!availabilityCheck.available) {
      return {
        success: false,
        error: availabilityCheck.message
      }
    }

    // Generate a unique ID for the agency (simulating cuid())
    const agencyId = `clz${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`
    const now = new Date().toISOString()

    // Create the agency using Supabase
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        id: agencyId,
        name,
        slug,
        description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
        address: {},
        agencyCode: `AG${Date.now()}`,
        businessName: name,
        city: 'Default City', // TODO: Get from form
        email: user.emailAddresses[0]?.emailAddress || '',
        orderCounter: 0,
        phone: '', // TODO: Get from form
        pricingConfig: {
          lateFee: 25,
          basePrice: 95, // Match schema default
          extraDayPrice: 10
        },
        settings: {},
        stripeConnectStatus: 'pending',
        subscriptionStartDate: now,
        subscriptionStatus: 'trial' // Match schema default instead of 'active'
      })
      .select()
      .single()

    if (agencyError) {
      console.error('❌ Error creating agency in Supabase:', agencyError)
      return {
        success: false,
        error: 'Failed to create agency'
      }
    }

    // Update the user to be associated with this agency
    const { error: userError } = await supabase
      .from('users')
      .update({
        agencyId: agency.id,
        role: 'ADMIN',
        updatedAt: new Date().toISOString()
      })
      .eq('id', user.id)

    if (userError) {
      console.error('❌ Error updating user with agency:', userError)
      // Agency was created but user association failed
      return {
        success: false,
        error: 'Agency created but failed to associate user'
      }
    }

    return {
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug
      }
    }
  } catch (error) {
    console.error('❌ Error creating agency:', error)
    return {
      success: false,
      error: `Failed to create agency: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

// Complete onboarding and redirect to dashboard
export async function completeOnboarding(agencySlug: string) {
  // Check if user is authenticated
  const user = await currentUser()
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Redirect to the agency's dashboard using query parameter
  redirect(`/dashboard?agency=${agencySlug}`)
}

// TODO: Implement user role management with Supabase
// Server action to update user role (protected) - DISABLED until Supabase implementation
/*
export async function updateUserRoleAction(
  userId: string,
  newRole: 'SUPER_USER' | 'ADMIN' | 'MANAGER' | 'USER'
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented with Supabase yet' }
}

// Server action to remove user from agency (protected) - DISABLED until Supabase implementation
export async function removeUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented with Supabase yet' }
}
*/