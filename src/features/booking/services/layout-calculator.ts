import { LayoutCalculation, DisplayZone, ZoneSign, SignStyle } from '../types';
import { loadManifest, indexManifest, resolveAsset, assetUrl, SignAsset } from './sign-assets';

// Decoration display names that resolve to a real manifest shape asset.
// Everything else (Baseball, Crown, Confetti, ...) has no generated art and
// stays on the dev colored-circle fallback - this is the full set we have.
const DECORATION_SHAPE_KEYS: Record<string, string> = {
  'Stars': 'star',
  'Heart': 'heart',
};

export interface LayoutInput {
  message: string;
  recipientName: string;
  eventNumber?: number;
  theme?: string;
  hobbies?: string[];
  agencyId: string;
  /** Letter/number style, e.g. "classic". Defaults to the manifest's first. */
  style?: string;
  /** Colorway for the message (zone1) and decorations, e.g. "red". Defaults to the manifest's first. */
  messageColorway?: string;
  /** Colorway for the recipient name (zone2), e.g. "red". Defaults to the manifest's first. */
  nameColorway?: string;
}

export class LayoutCalculatorService {

  /**
   * Calculate the complete 5-zone layout for a yard display
   */
  async calculateLayout(input: LayoutInput): Promise<LayoutCalculation> {
    const { message, recipientName, eventNumber, theme, hobbies } = input;

    // Resolve real letter/number PNGs for zone1/zone2 via the sign-asset
    // manifest. A failed/partial manifest load just means no signs resolve
    // below - createLetterSign/createNumberSign fall back to the existing
    // dev colored-box rendering, so this never blocks layout generation.
    const assetIndex = await this.loadAssetIndex();
    const style = (input.style || 'classic').toLowerCase();
    const messageColorway = (input.messageColorway || 'red').toLowerCase();
    const nameColorway = (input.nameColorway || 'red').toLowerCase();

    // Calculate Zone 1: Event message + numbers
    const zone1 = this.calculateZone1(message, eventNumber, assetIndex, style, messageColorway);

    // Calculate Zone 2: Recipient name
    const zone2 = this.calculateZone2(recipientName, assetIndex, style, nameColorway);

    // Calculate available space for Zone 3
    const availableSpace = Math.max(0, zone1.totalWidth - zone2.totalWidth);
    const sideSpace = availableSpace / 2;

    // Calculate Zone 3 (decorations) + Zone 4 (backgrounds) together: each
    // side gets a guaranteed minimum, then grows until 75% of the margin
    // is filled. Decorations use the message colorway - they aren't part
    // of either lettered zone, so there's no separate "name" concept for them.
    const { zone3, zone4 } = await this.calculateZone3AndZone4(sideSpace, theme, hobbies, assetIndex, style, messageColorway);

    // Calculate Zone 5: Bookend signs
    const zone5 = this.calculateZone5();
    
    // Calculate overall metrics
    const totalWidth = Math.max(zone1.totalWidth, zone2.totalWidth + zone3.totalWidth);
    const gridColumns = Math.max(zone1.signs.length, zone2.signs.length + zone3.signs.length);
    const meetsMinimumFill = (zone3.fillPercentage || 0) >= 0.75; // 75% minimum
    
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
   * Load and index the sign-asset manifest once per layout calculation.
   * Never throws - a missing/unreachable manifest just means every
   * resolveAsset() lookup below misses, and callers fall back to dev boxes.
   */
  private async loadAssetIndex(): Promise<Map<string, SignAsset> | null> {
    try {
      const manifest = await loadManifest();
      return indexManifest(manifest);
    } catch (error) {
      console.error('Error loading sign-asset manifest:', error);
      return null;
    }
  }

  /**
   * Calculate Zone 1: Event message + numbers with ordinals
   */
  private calculateZone1(
    message: string,
    eventNumber: number | undefined,
    assetIndex: Map<string, SignAsset> | null,
    style: string,
    colorway: string
  ): DisplayZone {
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
        signs.push(this.createLetterSign(char, position++, 2, 'zone1', assetIndex, style, colorway));
        totalWidth += 2;
      }

      // Add number digits
      for (const digit of number) {
        signs.push(this.createNumberSign(digit, position++, 2, assetIndex, style, colorway));
        totalWidth += 2;
      }

      // Add ordinal suffix
      if (ordinal) {
        signs.push(this.createOrdinalSign(ordinal, position++, 1.5));
        totalWidth += 1.5;
      }

      // Add letters after number
      for (const char of afterNumber) {
        signs.push(this.createLetterSign(char, position++, 2, 'zone1', assetIndex, style, colorway));
        totalWidth += 2;
      }
    } else if (eventNumber) {
      // Insert number into message at appropriate position
      const insertionResult = this.insertNumberIntoMessage(cleanMessage, eventNumber);

      for (const element of insertionResult.elements) {
        if (element.type === 'letter') {
          signs.push(this.createLetterSign(element.value, position++, 2, 'zone1', assetIndex, style, colorway));
          totalWidth += 2;
        } else if (element.type === 'number') {
          signs.push(this.createNumberSign(element.value, position++, 2, assetIndex, style, colorway));
          totalWidth += 2;
        } else if (element.type === 'ordinal') {
          signs.push(this.createOrdinalSign(element.value, position++, 1.5));
          totalWidth += 1.5;
        }
      }
    } else {
      // Just the message without numbers
      for (const char of cleanMessage) {
        signs.push(this.createLetterSign(char, position++, 2, 'zone1', assetIndex, style, colorway));
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
  private calculateZone2(
    recipientName: string,
    assetIndex: Map<string, SignAsset> | null,
    style: string,
    colorway: string
  ): DisplayZone {
    const signs: ZoneSign[] = [];
    let position = 0;
    let totalWidth = 0;

    const cleanName = recipientName.replace(/\s+/g, '').toUpperCase();

    for (const char of cleanName) {
      signs.push(this.createLetterSign(char, position++, 2, 'zone2', assetIndex, style, colorway));
      totalWidth += 2;
    }

    return {
      zone: 'zone2',
      signs,
      totalWidth
    };
  }
  
  /**
   * Calculate Zone 3 (decorations) and Zone 4 (backgrounds) together.
   *
   * Each side always gets a minimum of one background sign and two
   * decoration signs, even when the calculated margin is 0 - a bare
   * letters-only display looks wrong regardless of available space, and
   * these minimums are themselves allowed to overflow that margin.
   * From there, one more background + one more decoration are added at
   * a time until the side's signs cover at least 75% of its margin.
   * Overshoot on the qualifying step is accepted, not trimmed back.
   */
  private async calculateZone3AndZone4(
    availableSpacePerSide: number,
    theme: string | undefined,
    hobbies: string[] | undefined,
    assetIndex: Map<string, SignAsset> | null,
    style: string,
    colorway: string
  ): Promise<{ zone3: DisplayZone; zone4: DisplayZone }> {
    const DECORATION_WIDTH = 2;
    const BACKGROUND_WIDTH = 1;
    const MAX_ITEMS_PER_SIDE = 24; // safety cap against runaway loops

    const decorationSigns: ZoneSign[] = [];
    const backgroundSigns: ZoneSign[] = [];
    let decorationTotalWidth = 0;
    let backgroundTotalWidth = 0;

    const targetFillWidth = availableSpacePerSide * 0.75;

    for (let side = 0; side < 2; side++) {
      const sideLabel: 'left' | 'right' = side === 0 ? 'left' : 'right';
      const nextDecoration = this.getDecorationSource(theme, hobbies);
      const nextBackground = this.getBackgroundSource();
      let sidePosition = side === 0 ? 0 : 10; // Offset right side positions
      let sideWidth = 0;
      let itemsAdded = 0;

      const addBackground = () => {
        backgroundSigns.push(this.createBackdropSign(nextBackground(), sidePosition++, BACKGROUND_WIDTH));
        backgroundTotalWidth += BACKGROUND_WIDTH;
        sideWidth += BACKGROUND_WIDTH;
      };
      const addDecoration = () => {
        decorationSigns.push(this.createDecorationSign(nextDecoration(), sidePosition++, DECORATION_WIDTH, assetIndex, style, colorway, sideLabel));
        decorationTotalWidth += DECORATION_WIDTH;
        sideWidth += DECORATION_WIDTH;
      };

      // Guaranteed minimum per side
      addBackground();
      addDecoration();
      addDecoration();
      itemsAdded = 3;

      // Grow until the side clears 75% fill, accepting the overshoot
      while (sideWidth < targetFillWidth && itemsAdded < MAX_ITEMS_PER_SIDE) {
        addBackground();
        addDecoration();
        itemsAdded += 2;
      }
    }

    const totalWidth = decorationTotalWidth + backgroundTotalWidth;
    // When zone1/zone2 leave no calculated margin, the guaranteed minimum
    // signs above still cover it - treat that as a full 100% rather than
    // dividing by zero.
    const fillPercentage = availableSpacePerSide > 0 ? totalWidth / (availableSpacePerSide * 2) : 1;

    return {
      zone3: {
        zone: 'zone3',
        signs: decorationSigns,
        totalWidth: decorationTotalWidth,
        fillPercentage
      },
      zone4: {
        zone: 'zone4',
        signs: backgroundSigns,
        totalWidth: backgroundTotalWidth
      }
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
  
  private createLetterSign(
    char: string,
    position: number,
    width: number,
    zone: 'zone1' | 'zone2' = 'zone1',
    assetIndex: Map<string, SignAsset> | null = null,
    style?: string,
    colorway?: string
  ): ZoneSign {
    const asset = assetIndex && style && colorway ? resolveAsset(assetIndex, char, style, colorway) : null;
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
        },
        ...(asset && { prod: { imageUrl: assetUrl(asset) } })
      }
    };
  }

  private createNumberSign(
    digit: string,
    position: number,
    width: number,
    assetIndex: Map<string, SignAsset> | null = null,
    style?: string,
    colorway?: string
  ): ZoneSign {
    const asset = assetIndex && style && colorway ? resolveAsset(assetIndex, digit, style, colorway) : null;
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
        },
        ...(asset && { prod: { imageUrl: assetUrl(asset) } })
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
  
  private createDecorationSign(
    name: string,
    position: number,
    width: number,
    assetIndex: Map<string, SignAsset> | null = null,
    style?: string,
    colorway?: string,
    side?: 'left' | 'right'
  ): ZoneSign {
    const shapeKey = DECORATION_SHAPE_KEYS[name];
    const asset = shapeKey && assetIndex && style && colorway
      ? resolveAsset(assetIndex, shapeKey, style, colorway)
      : null;
    return {
      signId: `decoration-${name}-${position}`,
      zone: 'zone3',
      type: 'decoration',
      position,
      side,
      style: {
        dev: {
          backgroundColor: '#7c3aed', // Purple for decorations
          borderRadius: '50%',
          width: `${width}rem`,
          height: `${width}rem`
        },
        ...(asset && { prod: { imageUrl: assetUrl(asset) } })
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
  
  private getThemeDecorationPool(theme?: string): string[] {
    const themeDecorations: Record<string, string[]> = {
      'colorful': ['Stars', 'Rainbow', 'Flowers'],
      'sports': ['Soccer Ball', 'Basketball', 'Baseball'],
      'princess': ['Crown', 'Castle', 'Wand'],
      'superhero': ['Shield', 'Cape', 'Mask'],
      'classic': ['Balloon', 'Gift', 'Bow', 'Stars', 'Heart']
    };

    return themeDecorations[theme?.toLowerCase() || 'classic'] || themeDecorations.classic;
  }

  private getThemeDecoration(theme?: string): string {
    const decorations = this.getThemeDecorationPool(theme);
    return decorations[Math.floor(Math.random() * decorations.length)];
  }

  // Keyword-tagged decoration pool used to weight-match against customer
  // hobbies/interests. Names mirror the theme pool above plus the wider
  // catalog InventoryService mocks, just with keywords attached for scoring.
  private readonly decorationCatalog: { name: string; keywords: string[] }[] = [
    { name: 'Baseball', keywords: ['sports', 'baseball', 'ball'] },
    { name: 'Soccer Ball', keywords: ['sports', 'soccer', 'football'] },
    { name: 'Basketball', keywords: ['sports', 'basketball'] },
    { name: 'Gaming Controller', keywords: ['gaming', 'games', 'video games', 'videogames'] },
    { name: 'Music Notes', keywords: ['music', 'songs', 'singing'] },
    { name: 'Art Palette', keywords: ['art', 'painting', 'drawing'] },
    { name: 'Crown', keywords: ['princess', 'royal'] },
    { name: 'Castle', keywords: ['princess', 'castle', 'fairy tale', 'fairytale'] },
    { name: 'Superhero Shield', keywords: ['superhero', 'hero'] },
    { name: 'Stars', keywords: ['stars', 'space'] },
    { name: 'Rainbow', keywords: ['rainbow', 'colors'] },
    { name: 'Flowers', keywords: ['flowers', 'garden', 'nature'] },
    { name: 'Heart', keywords: ['love', 'romance', 'anniversary', 'valentine'] }
  ];

  /**
   * Rank the entire decoration catalog by keyword overlap against the
   * customer's hobbies/interests, best match first. Zero-score entries are
   * kept (ranked last, ties in catalog order) rather than dropped, so a
   * hobby that only matches art-less decorations - or matches nothing at
   * all - still leaves every candidate (including Stars/Heart, which do
   * have real art) reachable instead of excluded outright.
   */
  private rankDecorationsByHobbies(hobbies: string[]): string[] {
    const hobbyText = hobbies.join(' ').toLowerCase();

    return this.decorationCatalog
      .map(entry => ({
        name: entry.name,
        score: entry.keywords.filter(keyword => hobbyText.includes(keyword)).length
      }))
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.name);
  }

  /**
   * Returns a function that yields the next decoration name for one side.
   * With hobbies picked, draws from the full keyword-ranked catalog (best
   * matches first, then zero-score entries, cycling once exhausted) - so
   * even a hobby that matches nothing still lands on a real candidate list
   * rather than falling through to theme. Without hobbies, falls back to a
   * random pick from the selected Character Theme's pool.
   */
  private getDecorationSource(theme: string | undefined, hobbies?: string[]): () => string {
    if (hobbies && hobbies.length > 0) {
      const ranked = this.rankDecorationsByHobbies(hobbies);
      let index = 0;
      return () => ranked[index++ % ranked.length];
    }

    return () => this.getThemeDecoration(theme);
  }

  private readonly backgroundPool = ['Balloon Cluster', 'Confetti', 'Streamers'];

  private getBackgroundSource(): () => string {
    let index = 0;
    return () => this.backgroundPool[index++ % this.backgroundPool.length];
  }
}