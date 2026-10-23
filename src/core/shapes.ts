import { canonicalShape as engineCanonicalShape } from './geometry/shapes-table.js';
import { registerCustomShape as engineRegisterCustomShape } from './engine';
import { normalizeSvgPathToMotionLab, extractPathFromSvg } from './svg-normalizer.js';
import type { OfficialShape, ExtendedShape, BuiltinShape, CustomShapeOptions } from './types.js';

export { normalizeSvgPathToMotionLab, extractPathFromSvg };

/**
 * 13 Official primary UI shapes
 */
export const OFFICIAL_SHAPES: OfficialShape[] = [
  'blob',
  'cloud',
  'square',
  'sparkle',
  'clover',
  'heart',
  'flower',
  'teardrop',
  'tablet',
  'wedge',
  'house',
  'star',
  'hex'
];

/**
 * 13 Extended shapes built into the 3D engine
 */
export const EXTENDED_SHAPES: ExtendedShape[] = [
  'pebble',
  'bean',
  'egg',
  'squircle',
  'capsule',
  'cylinder',
  'gem',
  'crystal',
  'shield',
  'dome',
  'arch',
  'leaf',
  'pumpkin'
];

/**
 * All 26 built-in shapes
 */
export const ALL_BUILTIN_SHAPES: BuiltinShape[] = [...OFFICIAL_SHAPES, ...EXTENDED_SHAPES];

/**
 * Custom shapes registry & listener set
 */
const customShapesRegistry = new Map<string, CustomShapeOptions & { name: string; label: string }>();
const listeners = new Set<() => void>();

/**
 * Subscribe to custom shape registry updates
 * @param fn - Callback function
 * @returns Unsubscribe function
 */
export function subscribeCustomShapes(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in custom shape listener:', e);
    }
  });
}

/**
 * Register a custom 2D contour or SVG icon to be rendered as a 3D animated avatar.
 * Automatically extracts and normalizes coordinates from raw SVG markup, icons, or paths!
 *
 * @param name - Unique identifier
 * @param options - Configuration options
 * @returns The registered shape name
 */
export function registerCustomShape(name: string, options: CustomShapeOptions): string {
  const rawPath = options.path;
  const normalizedPath =
    typeof rawPath === 'string'
      ? normalizeSvgPathToMotionLab(rawPath)
      : rawPath;

  const shapeOptions: CustomShapeOptions = {
    ...options,
    path: normalizedPath
  };

  const shapeName = engineRegisterCustomShape(name, shapeOptions);

  if (!options.isInternal) {
    customShapesRegistry.set(shapeName, {
      name: shapeName,
      label: options.label || shapeName.charAt(0).toUpperCase() + shapeName.slice(1),
      ...shapeOptions
    });
    notifyListeners();
  }

  return shapeName;
}

/**
 * Get all currently registered custom shape descriptors
 */
export function getRegisteredCustomShapes(): (CustomShapeOptions & { name: string; label: string })[] {
  return Array.from(customShapesRegistry.values());
}

/**
 * Resolve shape to canonical engine name
 */
export function resolveShape(shape: string): string {
  if (customShapesRegistry.has(shape)) {
    return shape;
  }
  return engineCanonicalShape(shape);
}

/**
 * Built-in preset custom shapes to showcase engine extensibility out of the box
 */
export const PRESET_CUSTOM_SHAPES: (CustomShapeOptions & { name: string; label: string })[] = [
  {
    name: 'diamond',
    label: 'Diamond Gem',
    path: 'M 114.27 15 L 213.54 114.27 L 114.27 213.54 L 15 114.27 Z',
    scale: 1.25,
    eyeLayout: { width: 0.22, height: 0.45, gap: 0.48, shiftY: 0 }
  },
  {
    name: 'ghost',
    label: 'Spooky Ghost',
    path: 'M 35 114 C 35 55 70 25 114 25 C 158 25 193 55 193 114 C 193 170 193 200 193 200 L 160 185 L 130 200 L 98 185 L 68 200 L 35 185 Z',
    scale: 1.2,
    eyeLayout: { width: 0.22, height: 0.44, gap: 0.46, shiftY: 0.08 }
  },
  {
    name: 'star8',
    label: '8-Point Star',
    path: 'M 114.27 15 L 138 78 L 202 52 L 176 114.27 L 213.54 150 L 150 162 L 138 213.54 L 114.27 172 L 78 213.54 L 78 150 L 15 150 L 52 114.27 L 26 52 L 90 78 Z',
    scale: 1.3,
    eyeLayout: { width: 0.2, height: 0.42, gap: 0.44, shiftY: 0 }
  },
  {
    name: 'kitty',
    label: 'Kitty Cat',
    path: 'M 40 80 L 55 35 L 90 60 C 105 55 125 55 140 60 L 175 35 L 190 80 C 210 115 210 165 180 195 C 150 215 80 215 50 195 C 20 165 20 115 40 80 Z',
    scale: 1.15,
    eyeLayout: { width: 0.24, height: 0.46, gap: 0.52, shiftY: 0.05 }
  }
];

// Initialize preset custom shapes internally
PRESET_CUSTOM_SHAPES.forEach((preset) =>
  registerCustomShape(preset.name, { ...preset, isInternal: true })
);
