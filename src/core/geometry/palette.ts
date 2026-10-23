/**
 * Color Appearance & Palette Definitions
 */

import type { Appearance } from '../types';

const DEFAULT_CHANNELS: [number, number, number] = [0, 0, 0];

/**
 * Creates an Appearance object defining body ink and eye spot colors.
 * When spotPaint is omitted, cutout mode is enabled (transparent eye holes).
 *
 * @param inkPaint - Primary body fill color (hex/rgb/css)
 * @param spotPaint - Eye contour / pupil fill color
 */
export function createAppearance(inkPaint: string, spotPaint?: string): Appearance {
  if (spotPaint == null) {
    return {
      ink: DEFAULT_CHANNELS,
      spot: DEFAULT_CHANNELS,
      cutout: true,
      inkPaint
    };
  }
  return {
    ink: DEFAULT_CHANNELS,
    spot: DEFAULT_CHANNELS,
    cutout: false,
    inkPaint,
    spotPaint
  };
}
