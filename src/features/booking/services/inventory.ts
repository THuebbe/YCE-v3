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
const MINIMUM_FILL_PERCENTAGE = 0.60;
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
   * Get all signs available to an agency with zone classifications
   */
  async getAvailableSigns(agencyId: string): Promise<Sign[]> {
    // Mock data with zone classifications - in real app, this would query Supabase
    const mockSigns: Sign[] = [
      // Zone 1 & 2: Letter stakes (A-Z)
      ...this.generateLetterStakes(),
      // Zone 1: Number stakes (0-9) 
      ...this.generateNumberStakes(),
      // Zone 1: Ordinal stakes (ST, ND, RD, TH)
      ...this.generateOrdinalStakes(),
      // Zone 3: Decoration signs (hobbies, themes)
      ...this.generateDecorationSigns(),
      // Zone 4: Backdrop elements
      ...this.generateBackdropElements(),
      // Zone 5: Bookend signs
      ...this.generateBookendSigns(),
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

  // Zone-specific sign generators

  /**
   * Generate letter stakes A-Z for zones 1 and 2
   */
  private generateLetterStakes(): Sign[] {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const signs: Sign[] = [];

    for (const letter of letters) {
      signs.push({
        id: `letter-${letter}`,
        name: `Letter ${letter}`,
        category: 'letters',
        theme: 'classic',
        dimensions: { width: 2, height: 2 },
        imageUrl: `/placeholder/letter-${letter.toLowerCase()}.jpg`,
        keywords: [letter.toLowerCase()],
        available: true,
        totalQuantity: 20,
        availableQuantity: 18,
        isPlatformSign: true,
        zone: 'zone1',
        type: 'letter',
        character: letter,
        style: {
          dev: {
            backgroundColor: '#1e40af',
            borderRadius: '4px',
            width: '2rem',
            height: '2rem'
          }
        }
      });
    }

    return signs;
  }

  /**
   * Generate number stakes 0-9 for zone 1
   */
  private generateNumberStakes(): Sign[] {
    const numbers = '0123456789';
    const signs: Sign[] = [];

    for (const number of numbers) {
      signs.push({
        id: `number-${number}`,
        name: `Number ${number}`,
        category: 'numbers',
        theme: 'classic',
        dimensions: { width: 2, height: 2 },
        imageUrl: `/placeholder/number-${number}.jpg`,
        keywords: [number],
        available: true,
        totalQuantity: 15,
        availableQuantity: 12,
        isPlatformSign: true,
        zone: 'zone1',
        type: 'number',
        character: number,
        style: {
          dev: {
            backgroundColor: '#059669',
            borderRadius: '4px',
            width: '2rem',
            height: '2rem'
          }
        }
      });
    }

    return signs;
  }

  /**
   * Generate ordinal stakes (ST, ND, RD, TH) for zone 1
   */
  private generateOrdinalStakes(): Sign[] {
    const ordinals = ['ST', 'ND', 'RD', 'TH'];
    const signs: Sign[] = [];

    for (const ordinal of ordinals) {
      signs.push({
        id: `ordinal-${ordinal}`,
        name: `Ordinal ${ordinal}`,
        category: 'ordinals',
        theme: 'classic',
        dimensions: { width: 1.5, height: 1.5 },
        imageUrl: `/placeholder/ordinal-${ordinal.toLowerCase()}.jpg`,
        keywords: [ordinal.toLowerCase()],
        available: true,
        totalQuantity: 10,
        availableQuantity: 8,
        isPlatformSign: true,
        zone: 'zone1',
        type: 'ordinal',
        character: ordinal,
        isOrdinal: true,
        style: {
          dev: {
            backgroundColor: '#059669',
            borderRadius: '4px',
            width: '1.5rem',
            height: '1.5rem'
          }
        }
      });
    }

    return signs;
  }

  /**
   * Generate decoration signs for zone 3
   */
  private generateDecorationSigns(): Sign[] {
    const decorations = [
      { name: 'Baseball', keywords: ['sports', 'baseball', 'games'], theme: 'sports' },
      { name: 'Soccer Ball', keywords: ['sports', 'soccer', 'football'], theme: 'sports' },
      { name: 'Basketball', keywords: ['sports', 'basketball', 'games'], theme: 'sports' },
      { name: 'Gaming Controller', keywords: ['gaming', 'games', 'play'], theme: 'fun' },
      { name: 'Music Notes', keywords: ['music', 'songs', 'melody'], theme: 'fun' },
      { name: 'Art Palette', keywords: ['art', 'painting', 'creative'], theme: 'fun' },
      { name: 'Crown', keywords: ['princess', 'royal', 'crown'], theme: 'princess' },
      { name: 'Castle', keywords: ['princess', 'castle', 'fairy'], theme: 'princess' },
      { name: 'Superhero Shield', keywords: ['superhero', 'hero', 'shield'], theme: 'superhero' },
      { name: 'Stars', keywords: ['stars', 'bright', 'colorful'], theme: 'colorful' },
      { name: 'Rainbow', keywords: ['rainbow', 'colors', 'bright'], theme: 'colorful' },
      { name: 'Flowers', keywords: ['flowers', 'garden', 'pretty'], theme: 'colorful' }
    ];

    const signs: Sign[] = [];

    for (const decoration of decorations) {
      signs.push({
        id: `decoration-${decoration.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: decoration.name,
        category: 'decorations',
        theme: decoration.theme,
        dimensions: { width: 2, height: 2 },
        imageUrl: `/placeholder/${decoration.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        keywords: decoration.keywords,
        available: true,
        totalQuantity: 8,
        availableQuantity: 6,
        isPlatformSign: true,
        zone: 'zone3',
        type: 'decoration',
        style: {
          dev: {
            backgroundColor: '#7c3aed',
            borderRadius: '50%',
            width: '2rem',
            height: '2rem'
          }
        }
      });
    }

    return signs;
  }

  /**
   * Generate backdrop elements for zone 4
   */
  private generateBackdropElements(): Sign[] {
    const backdrops = [
      { name: 'Balloon Cluster', keywords: ['balloons', 'party', 'celebration'] },
      { name: 'Confetti', keywords: ['confetti', 'party', 'celebration'] },
      { name: 'Streamers', keywords: ['streamers', 'party', 'decoration'] }
    ];

    const signs: Sign[] = [];

    for (const backdrop of backdrops) {
      signs.push({
        id: `backdrop-${backdrop.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: backdrop.name,
        category: 'backdrop',
        theme: 'classic',
        dimensions: { width: 1, height: 1 },
        imageUrl: `/placeholder/${backdrop.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        keywords: backdrop.keywords,
        available: true,
        totalQuantity: 15,
        availableQuantity: 12,
        isPlatformSign: true,
        zone: 'zone4',
        type: 'backdrop',
        style: {
          dev: {
            backgroundColor: '#3b82f6',
            borderRadius: '2px',
            width: '1rem',
            height: '1rem'
          }
        }
      });
    }

    return signs;
  }

  /**
   * Generate bookend signs for zone 5
   */
  private generateBookendSigns(): Sign[] {
    const bookends = [
      { name: 'Left Bookend', position: 'left' },
      { name: 'Right Bookend', position: 'right' }
    ];

    const signs: Sign[] = [];

    for (const bookend of bookends) {
      signs.push({
        id: `bookend-${bookend.position}`,
        name: bookend.name,
        category: 'bookends',
        theme: 'classic',
        dimensions: { width: 1.5, height: 4 },
        imageUrl: `/placeholder/bookend-${bookend.position}.jpg`,
        keywords: ['bookend', bookend.position],
        available: true,
        totalQuantity: 5,
        availableQuantity: 4,
        isPlatformSign: true,
        zone: 'zone5',
        type: 'bookend',
        style: {
          dev: {
            backgroundColor: '#22c55e',
            borderRadius: '4px',
            width: '1.5rem',
            height: '4rem'
          }
        }
      });
    }

    return signs;
  }
}