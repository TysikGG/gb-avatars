import { createAppearance } from './engine.js';
import type { Appearance, ColorDefinition } from './types.js';

/**
 * 11 Official colors from avatar palette
 */
export const OFFICIAL_COLORS: ColorDefinition[] = [
  { id: 'white',   label: 'White',   hex: '#ffffff', eyeHex: '#000000' },
  { id: 'brown',   label: 'Brown',   hex: '#936439', eyeHex: '#000000' },
  { id: 'red',     label: 'Red',     hex: '#FF263C', eyeHex: '#000000' },
  { id: 'orange',  label: 'Orange',  hex: '#FF6700', eyeHex: '#000000' },
  { id: 'yellow',  label: 'Yellow',  hex: '#FF9800', eyeHex: '#000000' },
  { id: 'green',   label: 'Green',   hex: '#00C972', eyeHex: '#000000' },
  { id: 'cyan',    label: 'Cyan',    hex: '#00BCA6', eyeHex: '#000000' },
  { id: 'blue',    label: 'Blue',    hex: '#1084FE', eyeHex: '#000000' },
  { id: 'violet',  label: 'Violet',  hex: '#9159FE', eyeHex: '#000000' },
  { id: 'magenta', label: 'Magenta', hex: '#FF309B', eyeHex: '#000000' },
  { id: 'gray',    label: 'Gray',    hex: '#777777', eyeHex: '#000000' }
];

export const DEFAULT_COLOR = OFFICIAL_COLORS[5]; // Green #00C972

/**
 * Safely resolves any color input (hex string, CSS color, official color ID, or ColorDefinition object) to a hex string
 */
export function resolveColorHex(color?: string | ColorDefinition | null): string {
  if (!color) return '#00C972';

  if (typeof color === 'object') {
    if ('hex' in color && typeof color.hex === 'string') {
      return color.hex;
    }
    if ('id' in color && typeof color.id === 'string') {
      const match = OFFICIAL_COLORS.find(c => c.id.toLowerCase() === color.id.toLowerCase());
      if (match) return match.hex;
    }
    return '#00C972';
  }

  const str = String(color).trim();
  const match = OFFICIAL_COLORS.find(c => c.id.toLowerCase() === str.toLowerCase());
  if (match) return match.hex;

  return str;
}

/**
 * Safely resolves eye color input (hex string, CSS color, or ColorDefinition object) to a hex string
 */
export function resolveEyeColorHex(eyeColor?: string | ColorDefinition | null, fallback: string = '#000000'): string {
  if (!eyeColor) return fallback;

  if (typeof eyeColor === 'object') {
    if ('eyeHex' in eyeColor && typeof eyeColor.eyeHex === 'string') {
      return eyeColor.eyeHex;
    }
    if ('hex' in eyeColor && typeof eyeColor.hex === 'string') {
      return eyeColor.hex;
    }
    return fallback;
  }

  return String(eyeColor).trim();
}

/**
 * Cache appearances by bodyHex + eyeHex to avoid redundant object allocations
 */
const appearanceCache = new Map<string, Appearance>();

/**
 * Create or retrieve cached appearance descriptor.
 *
 * Supports hex strings, official color IDs (e.g. "red", "blue"), or ColorDefinition objects.
 *
 * @param bodyColor - Main body fill color (hex string or ColorDefinition object)
 * @param eyeColor - Eye fill color (hex string or ColorDefinition object)
 * @returns Appearance object required by renderSvgString
 */
export function getAvatarAppearance(
  bodyColor: string | ColorDefinition = '#00C972',
  eyeColor?: string | ColorDefinition
): Appearance {
  const bodyHex = resolveColorHex(bodyColor);

  const defaultEyeHex = typeof bodyColor === 'object' && bodyColor !== null && 'eyeHex' in bodyColor && typeof bodyColor.eyeHex === 'string'
    ? bodyColor.eyeHex
    : '#000000';

  const resolvedEyeHex = resolveEyeColorHex(eyeColor, defaultEyeHex);

  const key = `${bodyHex.toLowerCase()}_${resolvedEyeHex.toLowerCase()}`;
  let appearance = appearanceCache.get(key);
  if (!appearance) {
    appearance = createAppearance(bodyHex, resolvedEyeHex);
    if (appearance) {
      appearanceCache.set(key, appearance);
    }
  }
  return appearance!;
}
