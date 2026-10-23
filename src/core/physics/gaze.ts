/**
 * Gaze Calculation & Head Orientation Tracking
 */

import { clamp } from '../math/easing';
import { getEngineConfig } from '../config';

export interface GazeOrientation {
  rx: number; // Pitch in degrees
  ry: number; // Yaw in degrees
  px: number; // Horizontal center shift
  py: number; // Vertical center shift
}

const BODY_GAZE_SCALES: Record<string, number> = {
  heartChubby: 0.6,
  wedge: 0.55
};

/**
 * Normalizes screen pointer coordinates relative to avatar bounding box.
 * Coordinates are mapped to [-1, 1], with Y inverted (up is positive).
 */
export function computeGaze(
  rect: { left: number; top: number; width: number; height: number },
  point: { x: number; y: number },
  gazeScale?: number
): [number, number] {
  const scaleFactor = gazeScale ?? getEngineConfig()?.gaze?.defaultGazeScale ?? 0.5;
  const radius = Math.max(rect.width, 1) * scaleFactor;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return [
    clamp((point.x - centerX) / radius, -1, 1),
    clamp(-(point.y - centerY) / radius, -1, 1)
  ];
}

/**
 * Computes 3D Euler angles and position offsets from normalized gaze coordinates.
 *
 * @param body - Current body shape identifier
 * @param gazeX - Normalized horizontal gaze [-1, 1]
 * @param gazeY - Normalized vertical gaze [-1, 1]
 */
export function computeGazeOrientation(
  body: string,
  gazeX: number,
  gazeY: number
): GazeOrientation {
  const cfg = getEngineConfig()?.gaze;
  const isNonSphere = body !== 'sphere';
  const scale = BODY_GAZE_SCALES[body] ?? 1.0;

  const maxPitch = isNonSphere ? (cfg?.maxPitchDeg ?? 19) : (cfg?.maxPitchDegSphere ?? 14);
  const maxYaw = isNonSphere ? (cfg?.maxYawDeg ?? 26) : (cfg?.maxYawDegSphere ?? 18);
  const shiftX = isNonSphere ? (cfg?.shiftX ?? 0.07) : (cfg?.shiftXSphere ?? 0.03);
  const shiftY = isNonSphere ? (cfg?.shiftY ?? 0.055) : (cfg?.shiftYSphere ?? 0.024);

  return {
    rx: -maxPitch * scale * gazeY,
    ry: maxYaw * scale * gazeX,
    px: shiftX * gazeX,
    py: shiftY * gazeY
  };
}
