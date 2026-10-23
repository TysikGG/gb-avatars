import { createAppearance } from './engine';
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
 * Cache appearances by bodyHex + eyeHex to avoid redundant object allocations
 */
const appearanceCache = new Map<string, Appearance>();

/**
 * Create or retrieve cached appearance descriptor
 *
 * @param bodyHex - Main body fill color (e.g. "#00C972")
 * @param eyeHex - Eye fill color (e.g. "#000000")
 * @returns Appearance object required by renderSvgString
 */
export function getAvatarAppearance(bodyHex: string = '#00C972', eyeHex: string = '#000000'): Appearance {
  const key = `${bodyHex.toLowerCase()}_${eyeHex.toLowerCase()}`;
  let appearance = appearanceCache.get(key);
  if (!appearance) {
    appearance = createAppearance(bodyHex, eyeHex);
    if (appearance) {
      appearanceCache.set(key, appearance);
    }
  }
  return appearance!;
}
