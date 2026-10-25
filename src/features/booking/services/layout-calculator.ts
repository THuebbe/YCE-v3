import { LayoutCalculation, DisplayZone, ZoneSign, SignStyle } from '../types';
import { loadManifest, indexManifest, resolveAsset, resolveArt, assetUrl, SignAsset } from './sign-assets';
import { ordinalKey, decorationKey, backdropKey, bookendKey, artSlug } from './catalog-keys';
import { messageElements, nameElements } from './line-elements';

// Decorations that come in the letter colorways (manifest shape assets).
// Every other decoration, backdrop and bookend is one full-color piece of
// art (resolveArt + artSlug); without art it falls back to a labelled board.
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
  /** Message letter/number style (and decorations), e.g. "classic". Defaults to "classic". */
  style?: string;
  /** Name style; defaults to `style` */
  nameStyle?: string;
  /**
   * Units free per sign key (sign_library.asset_key) for the extras:
   * decorations, backdrops and bookends are only drawn from signs with
   * units left, and each use takes one (PRODUCT.md "Booking configurator").
   * Without it, extras are picked as before.
   */
  extrasStock?: Map<string, number>;
  /** Colorway for the message (zone1) and decorations, e.g. "red". Defaults to the manifest's first. */
  messageColorway?: string;
  /** Colorway for the recipient name (zone2), e.g. "red". Defaults to the manifest's first. */
  nameColorway?: string;
  /** Event day (YYYY-MM-DD): picks which holiday the Holiday theme means */
  eventDate?: string;
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
    const nameStyle = (input.nameStyle || style).toLowerCase();
    const zone2 = this.calculateZone2(recipientName, assetIndex, nameStyle, nameColorway);

    // Calculate available space for Zone 3
    const availableSpace = Math.max(0, zone1.totalWidth - zone2.totalWidth);
    const sideSpace = availableSpace / 2;

    // Calculate Zone 3 (decorations) + Zone 4 (backgrounds) together: each
    // side gets a guaranteed minimum, then grows until 75% of the margin
    // is filled. Decorations use the message colorway - they aren't part
    // of either lettered zone, so there's no separate "name" concept for them.
    const stock = input.extrasStock ? new Map(input.extrasStock) : null;
    const pickDecoration = () => this.getDecorationSource(theme, hobbies, message, input.eventDate);
    const { zone3, zone4 } = await this.calculateZone3AndZone4(sideSpace, pickDecoration, assetIndex, style, messageColorway, stock);

    // Calculate Zone 5: Bookend signs
    const zone5 = this.calculateZone5(stock, assetIndex);
    
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

    for (const element of messageElements(message, eventNumber)) {
      if (element.type === 'letter') {
        signs.push(this.createLetterSign(element.value, position++, 2, 'zone1', assetIndex, style, colorway));
        totalWidth += 2;
      } else if (element.type === 'number') {
        signs.push(this.createNumberSign(element.value, position++, 2, assetIndex, style, colorway));
        totalWidth += 2;
      } else {
        signs.push(this.createOrdinalSign(element.value, position++, 1.5));
        totalWidth += 1.5;
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

    for (const { value } of nameElements(recipientName)) {
      signs.push(this.createLetterSign(value, position++, 2, 'zone2', assetIndex, style, colorway));
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
    decorationSource: () => () => string,
    assetIndex: Map<string, SignAsset> | null,
    style: string,
    colorway: string,
    stock: Map<string, number> | null = null
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
      const nextDecoration = decorationSource();
      const nextBackground = this.getBackgroundSource();
      let sidePosition = side === 0 ? 0 : 10; // Offset right side positions
      let sideWidth = 0;
      let itemsAdded = 0;

      // With stock: only signs with a unit left, trying a few candidates
      // before leaving the slot empty
      const takeFree = <T extends ZoneSign>(make: () => T): T | null => {
        for (let attempt = 0; attempt < 8; attempt++) {
          const sign = make();
          if (!stock) return sign;
          const left = sign.catalogKey ? stock.get(sign.catalogKey) ?? 0 : 0;
          if (left > 0) {
            stock.set(sign.catalogKey!, left - 1);
            return sign;
          }
        }
        return null;
      };
      const addBackground = () => {
        const sign = takeFree(() => this.createBackdropSign(nextBackground(), sidePosition, BACKGROUND_WIDTH, assetIndex));
        if (!sign) return;
        sidePosition++;
        backgroundSigns.push(sign);
        backgroundTotalWidth += BACKGROUND_WIDTH;
        sideWidth += BACKGROUND_WIDTH;
      };
      const addDecoration = () => {
        const sign = takeFree(() => this.createDecorationSign(nextDecoration(), sidePosition, DECORATION_WIDTH, assetIndex, style, colorway, sideLabel));
        if (!sign) return;
        sidePosition++;
        decorationSigns.push(sign);
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
  private calculateZone5(stock: Map<string, number> | null = null, assetIndex: Map<string, SignAsset> | null = null): DisplayZone {
    const signs: ZoneSign[] = [
      this.createBookendSign('Left Bookend', 0, 1.5, assetIndex),
      this.createBookendSign('Right Bookend', 1, 1.5, assetIndex)
    ].filter(sign => {
      // Without a free bookend the display just goes without it
      if (!stock) return true;
      const left = stock.get(sign.catalogKey!) ?? 0;
      if (left <= 0) return false;
      stock.set(sign.catalogKey!, left - 1);
      return true;
    });

    return {
      zone: 'zone5',
      signs,
      totalWidth: signs.length * 1.5
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
      catalogKey: asset?.id,
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
      catalogKey: asset?.id,
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
      catalogKey: ordinalKey(ordinal),
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
    const shape = shapeKey && assetIndex && style && colorway
      ? resolveAsset(assetIndex, shapeKey, style, colorway)
      : null;
    // Art is one full-color piece, so its inventory key stays the decoration's own
    const art = !shapeKey && assetIndex ? resolveArt(assetIndex, 'decoration', artSlug(name)) : null;
    const asset = shape ?? art;
    return {
      signId: `decoration-${name}-${position}`,
      catalogKey: shape?.id ?? decorationKey(name),
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
  
  private createBackdropSign(name: string, position: number, width: number, assetIndex: Map<string, SignAsset> | null = null): ZoneSign {
    const art = assetIndex ? resolveArt(assetIndex, 'backdrop', artSlug(name)) : null;
    return {
      signId: `backdrop-${name}-${position}`,
      catalogKey: backdropKey(name),
      zone: 'zone4',
      type: 'backdrop',
      position,
      style: {
        dev: {
          backgroundColor: '#3b82f6', // Blue for backdrop
          borderRadius: '2px',
          width: `${width}rem`,
          height: `${width}rem`
        },
        ...(art && { prod: { imageUrl: assetUrl(art) } })
      }
    };
  }
  
  private createBookendSign(name: string, position: number, width: number, assetIndex: Map<string, SignAsset> | null = null): ZoneSign {
    const art = assetIndex ? resolveArt(assetIndex, 'bookend', artSlug(name)) : null;
    return {
      signId: `bookend-${name}-${position}`,
      catalogKey: bookendKey(name),
      zone: 'zone5',
      type: 'bookend',
      position,
      style: {
        dev: {
          backgroundColor: '#22c55e', // Green for bookends
          borderRadius: '4px',
          width: `${width}rem`,
          height: '4rem'
        },
        ...(art && { prod: { imageUrl: assetUrl(art) } })
      }
    };
  }
  
  // Utility methods
  
  // Which decorations go with which choice. A theme the customer picks wins;
  // without one the message's occasion decides, then the classic party set.
  private readonly themePools: Record<string, string[]> = {
    classic: ['Balloon', 'Gift', 'Bow', 'Stars', 'Heart', 'Party Hat', 'Smiley'],
    colorful: ['Stars', 'Rainbow', 'Flowers', 'Butterfly'],
    sports: ['Soccer Ball', 'Basketball', 'Baseball', 'Football', 'Volleyball', 'Trophy', 'Medal'],
    princess: ['Crown', 'Castle', 'Wand', 'Heart'],
    superhero: ['Shield', 'Cape', 'Mask', 'Lightning Bolt'],
    animals: ['Paw Print', 'Dinosaur', 'Bunny', 'Butterfly'],
  };

  // The Holiday theme means the holiday nearest the event, so a display
  // doesn't mix Christmas trees with pumpkins
  private readonly holidayPools: { months: number[]; pool: string[] }[] = [
    { months: [10], pool: ['Pumpkin', 'Ghost', 'Stars'] },
    { months: [11, 12, 1], pool: ['Christmas Tree', 'Snowflake', 'Gift', 'Stars'] },
    { months: [3, 4], pool: ['Easter Egg', 'Bunny', 'Flowers'] },
    { months: [6, 7], pool: ['American Flag', 'Fireworks', 'Stars'] },
  ];

  private readonly occasionPools: { match: RegExp; pool: string[] }[] = [
    { match: /birthday/i, pool: ['Birthday Cake', 'Balloon', 'Gift', 'Party Hat', 'Party Popper', 'Stars'] },
    { match: /grad/i, pool: ['Graduation Cap', 'Diploma', 'Stars', 'Trophy', 'Balloon'] },
    { match: /anniversary|love/i, pool: ['Heart', 'Flowers', 'Stars'] },
    { match: /welcome home/i, pool: ['American Flag', 'Heart', 'Stars', 'Balloon'] },
    { match: /get well/i, pool: ['Flowers', 'Smiley', 'Heart', 'Balloon'] },
    { match: /congrat/i, pool: ['Trophy', 'Stars', 'Party Popper', 'Balloon'] },
  ];

  private getThemeDecorationPool(theme?: string, message?: string, eventDate?: string): string[] {
    const key = theme?.toLowerCase();
    if (key === 'holiday') {
      const month = eventDate ? Number(eventDate.slice(5, 7)) : 0;
      const holiday = this.holidayPools.find(h => h.months.includes(month)) ?? this.holidayPools[1];
      return holiday.pool;
    }
    if (key && key !== 'classic' && this.themePools[key]) return this.themePools[key];
    const occasion = message ? this.occasionPools.find(o => o.match.test(message)) : undefined;
    return occasion?.pool ?? this.themePools.classic;
  }

  // Keyword-tagged decoration pool used to weight-match against customer
  // hobbies/interests (the configurator's Hobbies chips: Soccer, Basketball,
  // Baseball, Dance, Music, Art, Reading, Gaming).
  private readonly decorationCatalog: { name: string; keywords: string[] }[] = [
    { name: 'Soccer Ball', keywords: ['soccer'] },
    { name: 'Basketball', keywords: ['basketball'] },
    { name: 'Baseball', keywords: ['baseball', 'softball'] },
    { name: 'Football', keywords: ['football'] },
    { name: 'Volleyball', keywords: ['volleyball'] },
    { name: 'Trophy', keywords: ['soccer', 'basketball', 'baseball', 'football', 'volleyball', 'sports'] },
    { name: 'Medal', keywords: ['soccer', 'basketball', 'baseball', 'football', 'volleyball', 'sports'] },
    { name: 'Ballet Slippers', keywords: ['dance', 'ballet'] },
    { name: 'Tutu', keywords: ['dance', 'ballet'] },
    { name: 'Disco Ball', keywords: ['dance', 'music'] },
    { name: 'Music Notes', keywords: ['music', 'singing'] },
    { name: 'Guitar', keywords: ['music', 'guitar'] },
    { name: 'Microphone', keywords: ['music', 'singing'] },
    { name: 'Art Palette', keywords: ['art', 'painting'] },
    { name: 'Paintbrush', keywords: ['art', 'painting'] },
    { name: 'Crayons', keywords: ['art', 'drawing', 'coloring'] },
    { name: 'Open Book', keywords: ['reading', 'books'] },
    { name: 'Book Stack', keywords: ['reading', 'books'] },
    { name: 'Gaming Controller', keywords: ['gaming', 'games', 'video games'] },
    { name: 'Pixel Heart', keywords: ['gaming', 'games'] },
    { name: 'Crown', keywords: ['princess', 'royal'] },
    { name: 'Castle', keywords: ['princess', 'castle', 'fairy tale'] },
    { name: 'Superhero Shield', keywords: ['superhero', 'hero'] },
    { name: 'Lightning Bolt', keywords: ['superhero', 'hero'] },
    { name: 'Stars', keywords: ['stars', 'space'] },
    { name: 'Rainbow', keywords: ['rainbow', 'colors'] },
    { name: 'Flowers', keywords: ['flowers', 'garden', 'nature'] },
    { name: 'Butterfly', keywords: ['butterflies', 'nature'] },
    { name: 'Paw Print', keywords: ['animals', 'dogs', 'cats', 'pets'] },
    { name: 'Dinosaur', keywords: ['dinosaurs', 'animals'] },
    { name: 'Heart', keywords: ['love', 'romance', 'anniversary', 'valentine'] }
  ];

  /**
   * The decoration catalog in the order to try for the customer's hobbies:
   * the matches (best first), the matches again - real displays repeat an
   * icon rather than add an unrelated one - and only then everything else,
   * so a hobby whose decorations aren't free (or that matches nothing)
   * still leaves every candidate reachable instead of excluded outright.
   */
  private rankDecorationsByHobbies(hobbies: string[]): string[] {
    const hobbyText = hobbies.join(' ').toLowerCase();

    const scored = this.decorationCatalog
      .map(entry => ({
        name: entry.name,
        score: entry.keywords.filter(keyword => hobbyText.includes(keyword)).length
      }))
      .sort((a, b) => b.score - a.score);
    const matches = scored.filter(e => e.score > 0).map(e => e.name);
    const rest = scored.filter(e => e.score === 0).map(e => e.name);
    return [...matches, ...matches, ...rest];
  }

  /**
   * Returns a function that yields the next decoration name for one side.
   * With hobbies picked, draws from the keyword-ranked catalog
   * (rankDecorationsByHobbies, cycling once exhausted). Without
   * hobbies, picks at random from the theme's pool (or the occasion's, or
   * the holiday's: getThemeDecorationPool).
   */
  private getDecorationSource(theme: string | undefined, hobbies?: string[], message?: string, eventDate?: string): () => string {
    if (hobbies && hobbies.length > 0) {
      const ranked = this.rankDecorationsByHobbies(hobbies);
      let index = 0;
      return () => ranked[index++ % ranked.length];
    }

    const pool = this.getThemeDecorationPool(theme, message, eventDate);
    return () => pool[Math.floor(Math.random() * pool.length)];
  }

  private readonly backgroundPool = ['Balloon Cluster', 'Confetti', 'Pinwheel Spinner', 'Streamers', 'Star Spinner', 'Flower Spinner'];

  private getBackgroundSource(): () => string {
    let index = 0;
    return () => this.backgroundPool[index++ % this.backgroundPool.length];
  }
}