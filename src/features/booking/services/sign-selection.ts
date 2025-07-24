import { InventoryService } from './inventory';
import { Sign, SignSelectionCriteria, SignAllocation } from '../types';

export class SignSelectionService {
  private inventoryService = new InventoryService();

  /**
   * Select signs for a message based on criteria
   */
  async selectSignsForMessage(criteria: SignSelectionCriteria): Promise<{
    success: boolean;
    selectedSigns: Sign[];
    signAllocations: SignAllocation[];
    totalWidth: number;
    fillPercentage: number;
    alternatives?: Sign[];
    reasons?: string[];
  }> {
    try {
      console.log('🎯 Selecting signs for criteria:', criteria);

      // Get all available signs for the agency
      const availableSigns = await this.inventoryService.getAvailableSigns(criteria.agencyId);
      
      // Score and filter signs based on criteria
      const scoredSigns = this.scoreSignsForCriteria(availableSigns, criteria);
      
      // Select best combination of signs
      const selectedSigns = this.selectOptimalCombination(scoredSigns, criteria);
      
      // Create sign allocations
      const signAllocations: SignAllocation[] = selectedSigns.map(sign => ({
        signId: sign.id,
        quantity: 1,
        holdType: 'soft' as const
      }));

      // Calculate metrics
      const totalWidth = selectedSigns.reduce((sum, sign) => sum + sign.dimensions.width, 0);
      const fillPercentage = totalWidth / (criteria.preferredWidth || 30);
      
      const success = selectedSigns.length > 0 && fillPercentage >= 0.75;

      return {
        success,
        selectedSigns,
        signAllocations,
        totalWidth,
        fillPercentage,
        alternatives: !success ? this.getAlternatives(availableSigns, criteria) : undefined,
        reasons: !success ? this.getSelectionReasons(selectedSigns, criteria) : undefined
      };
    } catch (error) {
      console.error('Error selecting signs for message:', error);
      return {
        success: false,
        selectedSigns: [],
        signAllocations: [],
        totalWidth: 0,
        fillPercentage: 0,
        reasons: ['Error occurred during sign selection']
      };
    }
  }

  /**
   * Score signs based on how well they match the criteria
   */
  private scoreSignsForCriteria(signs: Sign[], criteria: SignSelectionCriteria): Array<Sign & { score: number }> {
    return signs.map(sign => {
      let score = 0;

      // Message keyword matching (highest priority)
      const messageWords = criteria.message.toLowerCase().split(' ');
      const matchingKeywords = sign.keywords.filter(keyword => 
        messageWords.some(word => 
          word.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(word)
        )
      );
      score += matchingKeywords.length * 10;

      // Exact message match bonus
      if (sign.keywords.some(keyword => 
        criteria.message.toLowerCase().includes(keyword.toLowerCase())
      )) {
        score += 20;
      }

      // Theme matching
      if (criteria.theme && sign.theme === criteria.theme) {
        score += 15;
      }

      // Category matching for event type
      if (criteria.eventType) {
        if (sign.category === criteria.eventType.toLowerCase()) {
          score += 12;
        }
      }

      // Hobby matching
      if (criteria.hobbies && criteria.hobbies.length > 0) {
        const hobbyMatches = criteria.hobbies.filter(hobby =>
          sign.keywords.some(keyword => 
            keyword.toLowerCase().includes(hobby.toLowerCase()) ||
            hobby.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        score += hobbyMatches.length * 8;
      }

      // Availability bonus
      if (sign.available && sign.availableQuantity > 0) {
        score += 5;
      }

      // Platform sign slight preference (more reliable inventory)
      if (sign.isPlatformSign) {
        score += 2;
      }

      return { ...sign, score };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Select optimal combination of signs
   */
  private selectOptimalCombination(
    scoredSigns: Array<Sign & { score: number }>, 
    criteria: SignSelectionCriteria
  ): Sign[] {
    const maxSigns = criteria.maxSigns || 8;
    const targetWidth = criteria.preferredWidth || 30;
    const selected: Sign[] = [];
    let currentWidth = 0;

    // First pass: select core message signs
    const messageSigns = scoredSigns.filter(sign => sign.score >= 10);
    for (const sign of messageSigns) {
      if (selected.length >= maxSigns || currentWidth >= targetWidth) break;
      if (sign.available && sign.availableQuantity > 0) {
        selected.push(sign);
        currentWidth += sign.dimensions.width;
      }
    }

    // Second pass: add numbers if message suggests an age/year
    const numbers = this.extractNumbers(criteria.message);
    if (numbers.length > 0) {
      const numberSigns = scoredSigns.filter(sign => 
        sign.category === 'numbers' && 
        numbers.some(num => sign.keywords.includes(num.toString()))
      );
      
      for (const numberSign of numberSigns) {
        if (selected.length >= maxSigns || currentWidth >= targetWidth) break;
        if (numberSign.available && numberSign.availableQuantity > 0 && !selected.includes(numberSign)) {
          selected.push(numberSign);
          currentWidth += numberSign.dimensions.width;
        }
      }
    }

    // Third pass: fill remaining space with complementary signs
    const remainingSigns = scoredSigns.filter(sign => 
      !selected.includes(sign) && 
      sign.available && 
      sign.availableQuantity > 0 &&
      sign.score > 0
    );

    for (const sign of remainingSigns) {
      if (selected.length >= maxSigns) break;
      
      const wouldFitWidth = currentWidth + sign.dimensions.width <= targetWidth + 5; // 5ft buffer
      if (wouldFitWidth) {
        selected.push(sign);
        currentWidth += sign.dimensions.width;
      }
    }

    console.log('🎯 Selected signs:', selected.map(s => ({ name: s.name, score: (s as any).score })));
    return selected;
  }

  /**
   * Extract numbers from message text
   */
  private extractNumbers(message: string): number[] {
    const numbers: number[] = [];
    const words = message.toLowerCase().split(' ');
    
    // Check for numeric digits
    words.forEach(word => {
      const num = parseInt(word.replace(/\D/g, ''));
      if (!isNaN(num) && num > 0 && num <= 100) {
        numbers.push(num);
      }
    });

    // Check for written numbers
    const writtenNumbers: Record<string, number> = {
      'one': 1, 'first': 1,
      'two': 2, 'second': 2,
      'three': 3, 'third': 3,
      'four': 4, 'fourth': 4,
      'five': 5, 'fifth': 5,
      'six': 6, 'sixth': 6,
      'seven': 7, 'seventh': 7,
      'eight': 8, 'eighth': 8,
      'nine': 9, 'ninth': 9,
      'ten': 10, 'tenth': 10,
      'eleven': 11, 'eleventh': 11,
      'twelve': 12, 'twelfth': 12,
      'thirteen': 13, 'thirteenth': 13,
      'fourteen': 14, 'fourteenth': 14,
      'fifteen': 15, 'fifteenth': 15,
      'sixteen': 16, 'sixteenth': 16,
      'seventeen': 17, 'seventeenth': 17,
      'eighteen': 18, 'eighteenth': 18,
      'nineteen': 19, 'nineteenth': 19,
      'twenty': 20, 'twentieth': 20,
      'twenty-one': 21, 'twenty-first': 21,
      'thirty': 30, 'thirtieth': 30,
      'forty': 40, 'fortieth': 40,
      'fifty': 50, 'fiftieth': 50,
      'sixty': 60, 'sixtieth': 60,
      'seventy': 70, 'seventieth': 70,
      'eighty': 80, 'eightieth': 80,
      'ninety': 90, 'ninetieth': 90
    };

    words.forEach(word => {
      if (writtenNumbers[word]) {
        numbers.push(writtenNumbers[word]);
      }
    });

    return [...new Set(numbers)]; // Remove duplicates
  }

  /**
   * Get alternative suggestions when selection fails
   */
  private getAlternatives(signs: Sign[], criteria: SignSelectionCriteria): Sign[] {
    const alternatives = signs
      .filter(sign => sign.available && sign.availableQuantity > 0)
      .slice(0, 5);
    
    return alternatives;
  }

  /**
   * Get reasons why selection might have failed
   */
  private getSelectionReasons(selectedSigns: Sign[], criteria: SignSelectionCriteria): string[] {
    const reasons: string[] = [];
    
    if (selectedSigns.length === 0) {
      reasons.push('No matching signs found for your message');
    }
    
    const totalWidth = selectedSigns.reduce((sum, sign) => sum + sign.dimensions.width, 0);
    if (totalWidth < (criteria.preferredWidth || 30) * 0.75) {
      reasons.push('Not enough signs to fill the minimum yard space');
    }
    
    const hasMessageMatch = selectedSigns.some(sign => 
      sign.keywords.some(keyword => 
        criteria.message.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (!hasMessageMatch) {
      reasons.push('No signs directly match your message - consider a shorter or different message');
    }
    
    return reasons;
  }

  /**
   * Get suggestions for improving message
   */
  async getSuggestedMessages(agencyId: string): Promise<string[]> {
    const signs = await this.inventoryService.getAvailableSigns(agencyId);
    const availableKeywords = new Set<string>();
    
    signs.forEach(sign => {
      if (sign.available && sign.availableQuantity > 0) {
        sign.keywords.forEach(keyword => availableKeywords.add(keyword));
      }
    });

    // Generate suggested messages based on available keywords
    const suggestions = [
      'Happy Birthday',
      'Congratulations',
      'Welcome Home',
      'Get Well Soon',
      'Happy Anniversary',
      'Graduation Day',
      'Welcome Baby',
      'Good Luck'
    ];

    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().split(' ').some(word => 
        Array.from(availableKeywords).some(keyword => 
          keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())
        )
      )
    );
  }
}