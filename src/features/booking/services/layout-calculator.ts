import { LayoutCalculation, DisplayZone, ZoneSign, SignStyle } from '../types';

export interface LayoutInput {
  message: string;
  recipientName: string;
  eventNumber?: number;
  theme?: string;
  hobbies?: string[];
  agencyId: string;
}

export class LayoutCalculatorService {
  
  /**
   * Calculate the complete 5-zone layout for a yard display
   */
  async calculateLayout(input: LayoutInput): Promise<LayoutCalculation> {
    const { message, recipientName, eventNumber, theme, hobbies } = input;
    
    // Calculate Zone 1: Event message + numbers
    const zone1 = this.calculateZone1(message, eventNumber);
    
    // Calculate Zone 2: Recipient name
    const zone2 = this.calculateZone2(recipientName);
    
    // Calculate available space for Zone 3
    const availableSpace = Math.max(0, zone1.totalWidth - zone2.totalWidth);
    const sideSpace = availableSpace / 2;
    
    // Calculate Zone 3: Decorative fill with 75% requirement
    const zone3 = await this.calculateZone3(sideSpace, theme, hobbies);
    
    // Calculate Zone 4: Backdrop elements
    const zone4 = this.calculateZone4(zone3.signs.length);
    
    // Calculate Zone 5: Bookend signs
    const zone5 = this.calculateZone5();
    
    // Calculate overall metrics
    const totalWidth = Math.max(zone1.totalWidth, zone2.totalWidth + zone3.totalWidth);
    const gridColumns = Math.max(zone1.signs.length, zone2.signs.length + zone3.signs.length);
    const meetsMinimumFill = (zone3.fillPercentage || 0) >= 0.6; // 60% minimum
    
    return {
      zone1,
      zone2,
      zone3,
      zone4,
      zone5,
      totalWidth,
      gridColumns,
      meetsMinimumFill
    };
  }
  
  /**
   * Calculate Zone 1: Event message + numbers with ordinals
   */
  private calculateZone1(message: string, eventNumber?: number): DisplayZone {
    const signs: ZoneSign[] = [];
    let position = 0;
    let totalWidth = 0;
    
    // Handle message with potential numbers and ordinals
    const cleanMessage = message.replace(/\s+/g, '').toUpperCase();
    
    // Check for existing numbers in message
    const numberMatch = cleanMessage.match(/(\d+)(ST|ND|RD|TH)?/);
    
    if (numberMatch && !eventNumber) {
      // Number already in message - use as is
      const beforeNumber = cleanMessage.substring(0, numberMatch.index || 0);
      const number = numberMatch[1];
      const ordinal = numberMatch[2] || this.getOrdinalSuffix(parseInt(number));
      const afterNumber = cleanMessage.substring((numberMatch.index || 0) + numberMatch[0].length);
      
      // Add letters before number
      for (const char of beforeNumber) {
        signs.push(this.createLetterSign(char, position++, 2));
        totalWidth += 2;
      }
      
      // Add number digits
      for (const digit of number) {
        signs.push(this.createNumberSign(digit, position++, 2));
        totalWidth += 2;
      }
      
      // Add ordinal suffix
      if (ordinal) {
        signs.push(this.createOrdinalSign(ordinal, position++, 1.5));
        totalWidth += 1.5;
      }
      
      // Add letters after number
      for (const char of afterNumber) {
        signs.push(this.createLetterSign(char, position++, 2));
        totalWidth += 2;
      }
    } else if (eventNumber) {
      // Insert number into message at appropriate position
      const insertionResult = this.insertNumberIntoMessage(cleanMessage, eventNumber);
      
      for (const element of insertionResult.elements) {
        if (element.type === 'letter') {
          signs.push(this.createLetterSign(element.value, position++, 2));
          totalWidth += 2;
        } else if (element.type === 'number') {
          signs.push(this.createNumberSign(element.value, position++, 2));
          totalWidth += 2;
        } else if (element.type === 'ordinal') {
          signs.push(this.createOrdinalSign(element.value, position++, 1.5));
          totalWidth += 1.5;
        }
      }
    } else {
      // Just the message without numbers
      for (const char of cleanMessage) {
        signs.push(this.createLetterSign(char, position++, 2));
        totalWidth += 2;
      }
    }
    
    return {
      zone: 'zone1',
      signs,
      totalWidth
    };
  }
  
  /**
   * Calculate Zone 2: Recipient name(s)
   */
  private calculateZone2(recipientName: string): DisplayZone {
    const signs: ZoneSign[] = [];
    let position = 0;
    let totalWidth = 0;
    
    const cleanName = recipientName.replace(/\s+/g, '').toUpperCase();
    
    for (const char of cleanName) {
      signs.push(this.createLetterSign(char, position++, 2, 'zone2'));
      totalWidth += 2;
    }
    
    return {
      zone: 'zone2',
      signs,
      totalWidth
    };
  }
  
  /**
   * Calculate Zone 3: Decorative fill with 75% requirement
   */
  private async calculateZone3(availableSpacePerSide: number, theme?: string, hobbies?: string[]): Promise<DisplayZone> {
    const signs: ZoneSign[] = [];
    let totalWidth = 0;
    let position = 0;
    
    // Minimum 60% fill requirement for each side
    const minFillWidth = availableSpacePerSide * 0.6;
    const targetFillWidth = availableSpacePerSide * 0.9; // Aim for 90% but accept 60%
    
    // Add decorations for each side
    for (let side = 0; side < 2; side++) {
      let sideWidth = 0;
      let sidePosition = side === 0 ? position : position + 10; // Offset right side positions
      
      // Add hobby-based decorations
      if (hobbies && hobbies.length > 0) {
        for (const hobby of hobbies.slice(0, 2)) { // Max 2 hobbies per side
          if (sideWidth < targetFillWidth) {
            signs.push(this.createDecorationSign(hobby, sidePosition++, 2));
            sideWidth += 2;
            totalWidth += 2;
          }
        }
      }
      
      // Add theme-based decorations to fill remaining space
      while (sideWidth < minFillWidth) {
        const decorationType = this.getThemeDecoration(theme);
        signs.push(this.createDecorationSign(decorationType, sidePosition++, 2));
        sideWidth += 2;
        totalWidth += 2;
        
        // Prevent infinite loop
        if (sidePosition > position + 20) break;
      }
      
      position = sidePosition + 1;
    }
    
    const fillPercentage = totalWidth / (availableSpacePerSide * 2);
    
    return {
      zone: 'zone3',
      signs,
      totalWidth,
      fillPercentage
    };
  }
  
  /**
   * Calculate Zone 4: Backdrop elements
   */
  private calculateZone4(decorationCount: number): DisplayZone {
    const signs: ZoneSign[] = [];
    let totalWidth = 0;
    
    // Add backdrop elements based on decoration density
    const backdropCount = Math.ceil(decorationCount / 3); // One backdrop per 3 decorations
    
    for (let i = 0; i < backdropCount; i++) {
      signs.push(this.createBackdropSign('Balloon Cluster', i, 1));
      totalWidth += 1;
    }
    
    return {
      zone: 'zone4',
      signs,
      totalWidth
    };
  }
  
  /**
   * Calculate Zone 5: Bookend signs
   */
  private calculateZone5(): DisplayZone {
    const signs: ZoneSign[] = [
      this.createBookendSign('Left Bookend', 0, 1.5),
      this.createBookendSign('Right Bookend', 1, 1.5)
    ];
    
    return {
      zone: 'zone5',
      signs,
      totalWidth: 3 // 1.5 + 1.5
    };
  }
  
  // Helper methods for creating different sign types
  
  private createLetterSign(char: string, position: number, width: number, zone: 'zone1' | 'zone2' = 'zone1'): ZoneSign {
    return {
      signId: `letter-${char}-${position}`,
      zone,
      type: 'letter',
      position,
      character: char,
      style: {
        dev: {
          backgroundColor: zone === 'zone1' ? '#1e40af' : '#dc2626', // Blue for zone1, red for zone2
          borderRadius: '4px',
          width: `${width}rem`,
          height: '2rem'
        }
      }
    };
  }
  
  private createNumberSign(digit: string, position: number, width: number): ZoneSign {
    return {
      signId: `number-${digit}-${position}`,
      zone: 'zone1',
      type: 'number',
      position,
      character: digit,
      style: {
        dev: {
          backgroundColor: '#059669', // Green for numbers
          borderRadius: '4px',
          width: `${width}rem`,
          height: '2rem'
        }
      }
    };
  }
  
  private createOrdinalSign(ordinal: string, position: number, width: number): ZoneSign {
    return {
      signId: `ordinal-${ordinal}-${position}`,
      zone: 'zone1',
      type: 'ordinal',
      position,
      character: ordinal,
      isOrdinal: true,
      style: {
        dev: {
          backgroundColor: '#059669', // Green for ordinals
          borderRadius: '4px',
          width: `${width}rem`,
          height: '1.5rem'
        }
      }
    };
  }
  
  private createDecorationSign(name: string, position: number, width: number): ZoneSign {
    return {
      signId: `decoration-${name}-${position}`,
      zone: 'zone3',
      type: 'decoration',
      position,
      style: {
        dev: {
          backgroundColor: '#7c3aed', // Purple for decorations
          borderRadius: '50%',
          width: `${width}rem`,
          height: `${width}rem`
        }
      }
    };
  }
  
  private createBackdropSign(name: string, position: number, width: number): ZoneSign {
    return {
      signId: `backdrop-${name}-${position}`,
      zone: 'zone4',
      type: 'backdrop',
      position,
      style: {
        dev: {
          backgroundColor: '#3b82f6', // Blue for backdrop
          borderRadius: '2px',
          width: `${width}rem`,
          height: `${width}rem`
        }
      }
    };
  }
  
  private createBookendSign(name: string, position: number, width: number): ZoneSign {
    return {
      signId: `bookend-${name}-${position}`,
      zone: 'zone5',
      type: 'bookend',
      position,
      style: {
        dev: {
          backgroundColor: '#22c55e', // Green for bookends
          borderRadius: '4px',
          width: `${width}rem`,
          height: '4rem'
        }
      }
    };
  }
  
  // Utility methods
  
  /**
   * Insert number into message at the appropriate position
   * Examples: "HAPPYBIRTHDAY" + 40 -> "HAPPY40THBIRTHDAY"
   *          "HAPPYANNIVERSARY" + 25 -> "HAPPY25THANNIVERSARY"
   */
  private insertNumberIntoMessage(message: string, eventNumber: number): {
    elements: Array<{type: 'letter' | 'number' | 'ordinal', value: string}>
  } {
    const elements: Array<{type: 'letter' | 'number' | 'ordinal', value: string}> = [];
    const numberStr = eventNumber.toString();
    const ordinal = this.getOrdinalSuffix(eventNumber);
    
    // Define insertion patterns for specific messages
    const insertionPatterns: Record<string, string> = {
      'HAPPYBIRTHDAY': 'HAPPY',
      'HAPPYANNIVERSARY': 'HAPPY',
      'CONGRATULATIONS': 'CONGRATULATIONS',
      'GRADUATION': '' // Insert at beginning
    };
    
    // Find pattern match
    let insertionPoint = -1;
    let prefix = '';
    
    for (const [pattern, prefixMatch] of Object.entries(insertionPatterns)) {
      if (message.startsWith(pattern)) {
        insertionPoint = prefixMatch.length;
        prefix = prefixMatch;
        break;
      }
    }
    
    // If no specific pattern found, default behavior (append number)
    if (insertionPoint === -1) {
      // Add all message letters first
      for (const char of message) {
        elements.push({type: 'letter', value: char});
      }
      
      // Then add number and ordinal
      for (const digit of numberStr) {
        elements.push({type: 'number', value: digit});
      }
      
      if (ordinal) {
        elements.push({type: 'ordinal', value: ordinal});
      }
    } else {
      // Insert number at specific position
      const beforeNumber = message.substring(0, insertionPoint);
      const afterNumber = message.substring(insertionPoint);
      
      // Add letters before number
      for (const char of beforeNumber) {
        elements.push({type: 'letter', value: char});
      }
      
      // Add number digits
      for (const digit of numberStr) {
        elements.push({type: 'number', value: digit});
      }
      
      // Add ordinal suffix
      if (ordinal) {
        elements.push({type: 'ordinal', value: ordinal});
      }
      
      // Add letters after number
      for (const char of afterNumber) {
        elements.push({type: 'letter', value: char});
      }
    }
    
    return { elements };
  }
  
  private getOrdinalSuffix(number: number): string {
    const remainder = number % 100;
    if (remainder >= 11 && remainder <= 13) return 'TH';
    
    switch (number % 10) {
      case 1: return 'ST';
      case 2: return 'ND';
      case 3: return 'RD';
      default: return 'TH';
    }
  }
  
  private getThemeDecoration(theme?: string): string {
    const themeDecorations: Record<string, string[]> = {
      'colorful': ['Stars', 'Rainbow', 'Flowers'],
      'sports': ['Soccer Ball', 'Basketball', 'Baseball'],
      'princess': ['Crown', 'Castle', 'Wand'],
      'superhero': ['Shield', 'Cape', 'Mask'],
      'classic': ['Balloon', 'Gift', 'Bow']
    };
    
    const decorations = themeDecorations[theme?.toLowerCase() || 'classic'] || themeDecorations.classic;
    return decorations[Math.floor(Math.random() * decorations.length)];
  }
}