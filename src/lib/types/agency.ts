/**
 * Core Agency type definitions
 * 
 * This file provides centralized type definitions for Agency-related interfaces
 * to ensure consistency across the application and prevent duplicate type definitions.
 */

// Core Agency interface that matches the database schema and component usage
export interface Agency {
  // Core identifying information
  id: string
  name: string
  slug: string
  
  // Contact and location information
  contactEmail?: string
  phone?: string
  website?: string
  
  // Address information
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  
  // Business settings
  isActive?: boolean
  domain?: string
  
  // Pricing configuration (for financial management)
  basePrice?: number
  extraDayPrice?: number
  lateFee?: number
  
  // Subscription information
  subscriptionStatus?: string
  subscriptionStartDate?: string
  subscriptionPlanId?: string
  
  // Operational settings
  timezone?: string
  
  // Dates
  createdAt?: string
  updatedAt?: string
  
  // Owner/admin information
  ownerId?: string
}

// Minimal Agency interface for components that only need basic info
export interface MinimalAgency {
  id: string
  name: string
  slug: string
}

// Agency with required financial properties for financial management components
export interface AgencyWithFinancials extends Agency {
  basePrice: number
  extraDayPrice: number
  lateFee: number
}

// Type for agency selection/listing
export interface AgencyListItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  domain?: string
}

// Agency creation input (for forms)
export interface CreateAgencyInput {
  name: string
  slug: string
  contactEmail: string
  phone?: string
  website?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

// Agency update input (for settings forms)
export interface UpdateAgencyInput {
  name?: string
  contactEmail?: string
  phone?: string
  website?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  basePrice?: number
  extraDayPrice?: number
  lateFee?: number
  timezone?: string
}