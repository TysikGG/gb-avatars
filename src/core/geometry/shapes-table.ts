/**
 * Shape Metadata & Eye Layout Metrics Table
 * Defines eye spacing, width, height, and vertical shift for all 26 built-in avatar geometries.
 */

export interface EyeMetrics {
  width: number;
  height: number;
  gap: number;
  shiftY: number;
}

export const SHAPE_EYE_LAYOUTS: Record<string, EyeMetrics> = {
  sphere: { width: 0.22, height: 0.48, gap: 0.5, shiftY: 0 },
  blob: { width: 0.22, height: 0.48, gap: 0.5, shiftY: 0 },
  cloud: { width: 0.21294, height: 0.46683, gap: 0.470016, shiftY: 0.07 },
  square: { width: 0.25533, height: 0.55975, gap: 0.529408, shiftY: 0.12 },
  sparkle: { width: 0.18382, height: 0.40299, gap: 0.41216, shiftY: 0 },
  clover: { width: 0.23296, height: 0.51072, gap: 0.559104, shiftY: -0.02 },
  heartChubby: { width: 0.18658, height: 0.40903, gap: 0.44621, shiftY: 0.052 },
  starFlower: { width: 0.19292, height: 0.42294, gap: 0.382976, shiftY: 0.12 },
  teardrop: { width: 0.20779, height: 0.45554, gap: 0.452608, shiftY: 0.18 },
  tablet: { width: 0.2132, height: 0.4674, gap: 0.587776, shiftY: 0.02 },
  wedge: { width: 0.2132, height: 0.4674, gap: 0.467712, shiftY: 0.18 },
  house: { width: 0.22951, height: 0.50316, gap: 0.512512, shiftY: 0.185 },
  star6: { width: 0.18478, height: 0.44966, gap: 0.419133, shiftY: 0.12 },
  pebble: { width: 0.2392, height: 0.5244, gap: 0.546304, shiftY: 0.12 },
  bean: { width: 0.2028, height: 0.4446, gap: 0.4608, shiftY: 0.12 },
  egg: { width: 0.2392, height: 0.5244, gap: 0.433664, shiftY: 0.113 },
  squircle: { width: 0.2392, height: 0.5244, gap: 0.5632, shiftY: 0.12 },
  capsule: { width: 0.2106, height: 0.4617, gap: 0.360448, shiftY: 0.12 },
  cylinder: { width: 0.2392, height: 0.5244, gap: 0.47872, shiftY: 0.12 },
  hex: { width: 0.26, height: 0.57, gap: 0.64, shiftY: 0.12 },
  gem: { width: 0.2392, height: 0.5244, gap: 0.501248, shiftY: 0.12 },
  crystal: { width: 0.1612, height: 0.3534, gap: 0.3712, shiftY: 0.12 },
  shield: { width: 0.2679, height: 0.58733, gap: 0.444928, shiftY: 0.12 },
  dome: { width: 0.2132, height: 0.4674, gap: 0.47872, shiftY: 0.106 },
  arch: { width: 0.1924, height: 0.4218, gap: 0.448, shiftY: 0.16 },
  leaf: { width: 0.1872, height: 0.4104, gap: 0.448, shiftY: 0.04 }
};

/**
 * Maps public shape identifiers to internal geometric models.
 */
export function canonicalShape(shape: string): string {
  switch (shape) {
    case 'blob':
      return 'sphere';
    case 'flower':
      return 'starFlower';
    case 'heart':
      return 'heartChubby';
    case 'star':
      return 'star6';
    default:
      return shape;
  }
}
