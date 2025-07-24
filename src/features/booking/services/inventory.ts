// import { createClient } from '@/lib/db/supabase-client';
import {
  Sign,
  InventoryHold,
  SignAllocation,
  InventoryAvailability,
  BulkAvailabilityResult,
  SignSelectionCriteria
} from '../types';

const HOLD_DURATION_HOURS = 1;
const MINIMUM_FILL_PERCENTAGE = 0.75;
const YARD_WIDTH_FEET = 30; // Standard yard width

export class InventoryService {
  // private supabase = createClient();

  /**
   * Create a soft hold on specified signs
   */
  async createSoftHold(
    signAllocations: SignAllocation[],
    agencyId: string,
    sessionId: string,
    customerId?: string
  ): Promise<{ success: boolean; holdId?: string; error?: string }> {
    try {
      const expiresAt = new Date(Date.now() + HOLD_DURATION_HOURS * 60 * 60 * 1000);
      
      const holdData: InventoryHold = {
        id: `hold_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        sessionId,
        agencyId,
        signAllocations,
        expiresAt,
        createdAt: new Date(),
        status: 'active',
        customerId,
      };

      // First check if signs are available
      const availabilityCheck = await this.checkBulkAvailability(
        signAllocations.map(sa => sa.signId),
        agencyId
      );

      if (!availabilityCheck.success) {
        return {
          success: false,
          error: 'One or more signs are not available'
        };
      }

      // Store the hold (in a real app, this would be in Supabase)
      // For now, we'll use localStorage as a mock
      const existingHolds = this.getStoredHolds();
      existingHolds.push(holdData);
      const serializedHolds = existingHolds.map(hold => ({
        ...hold,
        expiresAt: hold.expiresAt.toISOString(),
        createdAt: hold.createdAt.toISOString()
      }));
      localStorage.setItem('inventory_holds', JSON.stringify(serializedHolds));

      console.log('🔒 Created soft hold:', holdData.id, 'for signs:', signAllocations);

      return {
        success: true,
        holdId: holdData.id
      };
    } catch (error) {
      console.error('Error creating soft hold:', error);
      return {
        success: false,
        error: 'Failed to create inventory hold'
      };
    }
  }

  /**
   * Check availability of multiple signs
   */
  async checkBulkAvailability(
    signIds: string[],
    agencyId: string
  ): Promise<BulkAvailabilityResult> {
    try {
      const signs = await this.getSignsByIds(signIds, agencyId);
      const availability: InventoryAvailability[] = [];
      let totalWidth = 0;
      let availableSigns = 0;

      for (const signId of signIds) {
        const sign = signs.find(s => s.id === signId);
        if (!sign) {
          availability.push({
            signId,
            available: false,
            availableQuantity: 0,
            maxQuantity: 0,
            reasons: ['Sign not found']
          });
          continue;
        }

        // Calculate availability considering current holds
        const heldQuantity = this.getHeldQuantity(signId, agencyId);
        const availableQuantity = Math.max(0, sign.availableQuantity - heldQuantity);
        const isAvailable = availableQuantity > 0 && sign.available;

        availability.push({
          signId,
          available: isAvailable,
          availableQuantity,
          maxQuantity: sign.totalQuantity,
          reasons: !isAvailable ? ['Currently unavailable'] : undefined
        });

        if (isAvailable) {
          totalWidth += sign.dimensions.width;
          availableSigns++;
        }
      }

      const fillPercentage = totalWidth / YARD_WIDTH_FEET;
      const meetsMinimumFill = fillPercentage >= MINIMUM_FILL_PERCENTAGE;
      const allAvailable = availability.every(a => a.available);

      return {
        success: allAvailable,
        availability,
        totalSigns: availableSigns,
        totalWidth,
        fillPercentage,
        meetsMinimumFill,
        alternatives: !allAvailable ? await this.getSimilarSigns(signIds, agencyId) : undefined
      };
    } catch (error) {
      console.error('Error checking bulk availability:', error);
      return {
        success: false,
        availability: [],
        totalSigns: 0,
        totalWidth: 0,
        fillPercentage: 0,
        meetsMinimumFill: false
      };
    }
  }

  /**
   * Release a hold (convert to order or expire)
   */
  async releaseHold(holdId: string, convertToOrder = false): Promise<boolean> {
    try {
      const holds = this.getStoredHolds();
      const holdIndex = holds.findIndex(h => h.id === holdId);
      
      if (holdIndex === -1) {
        console.warn('Hold not found:', holdId);
        return false;
      }

      if (convertToOrder) {
        holds[holdIndex].status = 'converted';
      } else {
        holds.splice(holdIndex, 1);
      }

      const serializedHolds = holds.map(hold => ({
        ...hold,
        expiresAt: hold.expiresAt.toISOString(),
        createdAt: hold.createdAt.toISOString()
      }));
      localStorage.setItem('inventory_holds', JSON.stringify(serializedHolds));
      console.log('🔓 Released hold:', holdId, convertToOrder ? '(converted to order)' : '(expired)');
      
      return true;
    } catch (error) {
      console.error('Error releasing hold:', error);
      return false;
    }
  }

  /**
   * Clean up expired holds
   */
  async cleanupExpiredHolds(): Promise<number> {
    try {
      const holds = this.getStoredHolds();
      const now = new Date();
      const activeHolds = holds.filter(hold => {
        const isExpired = new Date(hold.expiresAt) <= now;
        if (isExpired && hold.status === 'active') {
          console.log('🧹 Cleaning up expired hold:', hold.id);
        }
        return !isExpired || hold.status !== 'active';
      });

      const cleanedCount = holds.length - activeHolds.length;
      const serializedActiveHolds = activeHolds.map(hold => ({
        ...hold,
        expiresAt: hold.expiresAt.toISOString(),
        createdAt: hold.createdAt.toISOString()
      }));
      localStorage.setItem('inventory_holds', JSON.stringify(serializedActiveHolds));
      
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired holds:', error);
      return 0;
    }
  }

  /**
   * Get all signs available to an agency
   */
  async getAvailableSigns(agencyId: string): Promise<Sign[]> {
    // Mock data - in real app, this would query Supabase
    const mockSigns: Sign[] = [
      {
        id: 'sign_1',
        name: 'Happy Birthday',
        category: 'birthday',
        theme: 'classic',
        dimensions: { width: 4, height: 2 },
        imageUrl: '/placeholder/happy-birthday.jpg',
        keywords: ['happy', 'birthday', 'celebration', 'party'],
        available: true,
        totalQuantity: 10,
        availableQuantity: 8,
        isPlatformSign: true
      },
      {
        id: 'sign_2',
        name: 'Congratulations',
        category: 'celebration',
        theme: 'classic',
        dimensions: { width: 5, height: 2 },
        imageUrl: '/placeholder/congratulations.jpg',
        keywords: ['congratulations', 'congrats', 'achievement', 'success'],
        available: true,
        totalQuantity: 8,
        availableQuantity: 6,
        isPlatformSign: true
      },
      {
        id: 'sign_3',
        name: 'Welcome Home',
        category: 'welcome',
        theme: 'classic',
        dimensions: { width: 4, height: 2 },
        imageUrl: '/placeholder/welcome-home.jpg',
        keywords: ['welcome', 'home', 'return', 'family'],
        available: true,
        totalQuantity: 5,
        availableQuantity: 3,
        isPlatformSign: true
      },
      {
        id: 'sign_4',
        name: 'Number 1',
        category: 'numbers',
        theme: 'classic',
        dimensions: { width: 2, height: 3 },
        imageUrl: '/placeholder/number-1.jpg',
        keywords: ['1', 'one', 'first', 'number'],
        available: true,
        totalQuantity: 15,
        availableQuantity: 12,
        isPlatformSign: true
      },
      {
        id: 'sign_5',
        name: 'Number 8',
        category: 'numbers',
        theme: 'classic',
        dimensions: { width: 2, height: 3 },
        imageUrl: '/placeholder/number-8.jpg',
        keywords: ['8', 'eight', 'number'],
        available: true,
        totalQuantity: 12,
        availableQuantity: 10,
        isPlatformSign: true
      }
    ];

    return mockSigns;
  }

  /**
   * Get signs by IDs
   */
  private async getSignsByIds(signIds: string[], agencyId: string): Promise<Sign[]> {
    const allSigns = await this.getAvailableSigns(agencyId);
    return allSigns.filter(sign => signIds.includes(sign.id));
  }

  /**
   * Calculate quantity of a sign currently held
   */
  private getHeldQuantity(signId: string, agencyId: string): number {
    const holds = this.getStoredHolds();
    const activeHolds = holds.filter(hold => 
      hold.status === 'active' && 
      hold.agencyId === agencyId &&
      new Date(hold.expiresAt) > new Date()
    );

    return activeHolds.reduce((total, hold) => {
      const allocation = hold.signAllocations.find(sa => sa.signId === signId);
      return total + (allocation?.quantity || 0);
    }, 0);
  }

  /**
   * Get similar signs as alternatives
   */
  private async getSimilarSigns(signIds: string[], agencyId: string): Promise<Sign[]> {
    const allSigns = await this.getAvailableSigns(agencyId);
    const requestedSigns = await this.getSignsByIds(signIds, agencyId);
    
    // Find signs with similar categories or keywords
    const alternatives = allSigns.filter(sign => {
      if (signIds.includes(sign.id)) return false;
      
      return requestedSigns.some(requestedSign => 
        sign.category === requestedSign.category ||
        sign.keywords.some(keyword => 
          requestedSign.keywords.includes(keyword)
        )
      );
    });

    return alternatives.slice(0, 5); // Return up to 5 alternatives
  }

  /**
   * Get stored holds from localStorage (mock implementation)
   */
  private getStoredHolds(): InventoryHold[] {
    try {
      const stored = localStorage.getItem('inventory_holds');
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((hold: any) => ({
        ...hold,
        expiresAt: new Date(hold.expiresAt),
        createdAt: new Date(hold.createdAt)
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get hold by ID
   */
  async getHold(holdId: string): Promise<InventoryHold | null> {
    const holds = this.getStoredHolds();
    return holds.find(h => h.id === holdId) || null;
  }

  /**
   * Extend hold expiry time
   */
  async extendHold(holdId: string, additionalHours = 1): Promise<boolean> {
    try {
      const holds = this.getStoredHolds();
      const hold = holds.find(h => h.id === holdId);
      
      if (!hold) return false;
      
      const newExpiry = new Date(hold.expiresAt);
      newExpiry.setHours(newExpiry.getHours() + additionalHours);
      hold.expiresAt = newExpiry;
      
      const serializedHolds = holds.map(hold => ({
        ...hold,
        expiresAt: hold.expiresAt.toISOString(),
        createdAt: hold.createdAt.toISOString()
      }));
      localStorage.setItem('inventory_holds', JSON.stringify(serializedHolds));
      return true;
    } catch (error) {
      console.error('Error extending hold:', error);
      return false;
    }
  }
}