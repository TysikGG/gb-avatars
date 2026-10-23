/**
 * 3D Mesh Extrusion, Beveling & Surface Geometry Engine
 *
 * Implements 3D mesh generation for all 26 avatar geometries:
 * - Linear extrusion with rounded/beveled caps (square, hex, house, star, clover, etc.)
 * - Surfaces of revolution (pebble, egg, cylinder, teardrop, wedge, shield, dome, arch, leaf)
 * - 3D lofts with radial heightfield surfaces (cloud, heartChubby)
 * - Inscribed spheres / medial axis approximation (bean, capsule, tablet)
 * - 3D Convex Hull (QuickHull) polyhedral triangulation (crystal)
 */

import {
  CANONICAL_CENTER,
  SHAPE_CONTOURS,
  sampleSvgPath,
  getAnalyzedShapePath,
  invalidateContourCache,
  type Point2D
} from '../geometry/contours';
import { SHAPE_EYE_LAYOUTS } from '../geometry/shapes-table';
import type { CustomShapeOptions } from '../types';
import { getEngineConfig, subscribeEngineConfig } from '../config';

// Automatically invalidate model caches when engine config is updated
subscribeEngineConfig(() => {
  invalidateAllModelCaches();
});

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Ball4D = [x: number, y: number, z: number, r: number];

export interface ExtrusionSilhouette {
  kind: 'extrusion';
  rings: Point3D[][];
  isConvex: boolean;
}

export interface LoftSilhouette {
  kind: 'loft';
  rings: Point3D[][];
}

export interface SolidSilhouette {
  kind: 'solid';
  samples: Point3D[];
  balls: Ball4D[];
  isLoop: boolean;
  yawPeriod: number | null;
}

export type ShapeSilhouette = ExtrusionSilhouette | LoftSilhouette | SolidSilhouette;

export interface FrontSeat {
  kind: 'front';
  faceZ: number;
}

export interface LoftSeat {
  kind: 'loft';
  surfaceZ: (x: number, y: number) => number;
}

export interface WrapYSeat {
  kind: 'wrap';
  wrapR: number;
  wrapY0: number;
  wrapY1: number;
  eyeY: number;
  radiusAt?: (y: number) => number;
  puffAt?: (x: number, y: number) => { x: number; y: number; z: number; r: number };
}

export interface WrapXSeat {
  kind: 'wrapX';
  wrapR: number;
  wrapX0: number;
  wrapX1: number;
  radiusAtX: (x: number) => number;
}

export type EyeSeat = FrontSeat | LoftSeat | WrapYSeat | WrapXSeat;

export interface Shape3DModel {
  size: number;
  silhouette: ShapeSilhouette;
  seat: EyeSeat;
}

const TAU = Math.PI * 2;
const EPSILON = 1e-12;
const BEVEL_STEPS = 4;
const DEFAULT_HALF_DEPTH = 0.36;
const DEFAULT_BEVEL = 0.22;
const REVOLUTION_SEGMENTS = 64;
const SPATIAL_HASH_CELLS = 64;
const SPATIAL_HASH_EPS = 1e-5;
const INSCRIBED_BALL_STEPS = 33;
const MEDIAL_GRID_SIZE = 40;
const LOFT_LONGITUDE_SAMPLES = 160;
const LOFT_LATITUDE_STEPS = 16;
const LOFT_POWER = 0.72;
const SURFACE_AZIMUTH_SAMPLES = 180;

/**
 * Normalizes a 2D contour polygon into centered 3D coordinates [-1, 1]
 */
export function normalize2DTo3D(points: Point2D[]): Point3D[] {
  return points.map(([x, y]) => ({
    x: (x - CANONICAL_CENTER) / CANONICAL_CENTER,
    y: -(y - CANONICAL_CENTER) / CANONICAL_CENTER,
    z: 0
  }));
}

/**
 * Quick shortcut to get sampled polygon for shape
 */
export function getShapePolygon(shape: string, tolerance: number = 4): Point2D[] {
  return sampleSvgPath(getAnalyzedShapePath(shape).path, tolerance);
}

/**
 * Checks whether a 2D polygon is strictly convex
 */
export function isPolygonConvex(points: Point3D[]): boolean {
  let sign = 0;
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % len];
    const p2 = points[(i + 2) % len];

    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);

    if (!(Math.abs(cross) < EPSILON)) {
      if (sign === 0) {
        sign = Math.sign(cross);
      } else if (Math.sign(cross) !== sign) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generates front and back beveled rings for an extruded 3D polygon
 */
export function generateExtrusionRings(
  polygon: Point3D[],
  halfDepth: number,
  bevel: number
): Point3D[][] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of polygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const maxRadius = Math.max(1e-4, Math.min((maxX - minX) / 2, (maxY - minY) / 2));

  const evaluateLevel = (step: number, zSign: number): { z: number; scale: number } => {
    const angle = (step / BEVEL_STEPS) * (Math.PI / 2);
    const z = halfDepth - bevel + bevel * Math.sin(angle);
    return {
      z: zSign < 0 ? -z : z,
      scale: 1 - (bevel / maxRadius) * (1 - Math.cos(angle))
    };
  };

  const levels: { z: number; scale: number }[] = [];
  for (let s = BEVEL_STEPS; s >= 0; s--) {
    levels.push(evaluateLevel(s, -1));
  }
  for (let s = 0; s <= BEVEL_STEPS; s++) {
    levels.push(evaluateLevel(s, 1));
  }

  return levels.map(({ z, scale }) =>
    polygon.map((pt) => ({
      x: cx + (pt.x - cx) * scale,
      y: cy + (pt.y - cy) * scale,
      z
    }))
  );
}

/**
 * Creates an Extrusion Shape3DModel
 */
export function createExtrusionModel(
  scale: number,
  polygon: Point3D[],
  halfDepth?: number,
  bevel?: number
): Shape3DModel {
  const actualHalfDepth = halfDepth ?? getEngineConfig()?.mesh?.defaultHalfDepth ?? DEFAULT_HALF_DEPTH;
  const actualBevel = bevel ?? getEngineConfig()?.mesh?.defaultBevel ?? DEFAULT_BEVEL;

  return {
    size: scale,
    silhouette: {
      kind: 'extrusion',
      rings: generateExtrusionRings(polygon, actualHalfDepth, actualBevel),
      isConvex: isPolygonConvex(polygon)
    },
    seat: { kind: 'front', faceZ: actualHalfDepth }
  };
}

/**
 * Generates 3D loft rings for smooth rounded shapes like cloud and heart
 */
export function generateLoftRings(
  polygon: Point3D[],
  depth: number
): { rings: Point3D[][]; center: { x: number; y: number }; depth: number } {
  const stepRatio = polygon.length / LOFT_LONGITUDE_SAMPLES;
  const sampledPolygon: Point3D[] =
    stepRatio > 1
      ? Array.from({ length: LOFT_LONGITUDE_SAMPLES }, (_, i) => polygon[Math.floor(i * stepRatio)])
      : polygon;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of sampledPolygon) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const rings: Point3D[][] = [];

  for (let lat = 0; lat <= LOFT_LATITUDE_STEPS; lat++) {
    const theta = -Math.PI / 2 + (Math.PI * lat) / LOFT_LATITUDE_STEPS;
    const radialScale = Math.pow(Math.max(0, Math.cos(theta)), LOFT_POWER);
    const z = depth * Math.sin(theta);

    rings.push(
      sampledPolygon.map((pt) => ({
        x: center.x + (pt.x - center.x) * radialScale,
        y: center.y + (pt.y - center.y) * radialScale,
        z
      }))
    );
  }

  return { rings, center, depth };
}

/**
 * Constructs a radial heightfield surface function z(x, y) for eye seating on lofted 3D bodies
 */
export function createLoftSurfaceFunction(loft: {
  rings: Point3D[][];
  center: { x: number; y: number };
  depth: number;
}): (x: number, y: number) => number {
  const equator = loft.rings[Math.floor(loft.rings.length / 2)];
  const radialDistances = new Float64Array(SURFACE_AZIMUTH_SAMPLES);

  for (let i = 0; i < SURFACE_AZIMUTH_SAMPLES; i++) {
    const angle = ((i + 0.5) / SURFACE_AZIMUTH_SAMPLES) * TAU;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    let maxDist = 0;

    for (let e = 0; e < equator.length; e++) {
      const p1 = equator[e];
      const p2 = equator[(e + 1) % equator.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const cross = cosA * dy - sinA * dx;

      if (Math.abs(cross) < 1e-9) continue;

      const relX = p1.x - loft.center.x;
      const relY = p1.y - loft.center.y;
      const dist = (relX * dy - relY * dx) / cross;
      const t = (relX * sinA - relY * cosA) / cross;

      if (dist > maxDist && t >= 0 && t <= 1) {
        maxDist = dist;
      }
    }

    radialDistances[i] = maxDist;
  }

  const normalizedRadius = (x: number, y: number): number => {
    const dx = x - loft.center.x;
    const dy = y - loft.center.y;
    const r = Math.hypot(dx, dy);
    if (r < 1e-8) return 0;

    const angle = ((Math.atan2(dy, dx) + TAU) % TAU) / TAU;
    const sampleIdx = angle * SURFACE_AZIMUTH_SAMPLES;
    const idx0 = Math.floor(sampleIdx) % SURFACE_AZIMUTH_SAMPLES;
    const frac = sampleIdx - Math.floor(sampleIdx);
    const r0 = radialDistances[idx0];
    const r1 = radialDistances[(idx0 + 1) % SURFACE_AZIMUTH_SAMPLES];

    return Math.min(1, r / Math.max(1e-8, r0 * (1 - frac) + r1 * frac));
  };

  return (x: number, y: number): number => {
    const norm = normalizedRadius(x, y);
    return loft.depth * Math.sqrt(Math.max(0, 1 - Math.pow(norm, 2 / LOFT_POWER)));
  };
}

/**
 * Creates a Loft Shape3DModel (cloud, heartChubby)
 */
export function createLoftModel(scale: number, polygon: Point3D[], depth: number): Shape3DModel {
  const loft = generateLoftRings(polygon, depth);
  return {
    size: scale,
    silhouette: { kind: 'loft', rings: loft.rings },
    seat: { kind: 'loft', surfaceZ: createLoftSurfaceFunction(loft) }
  };
}

/**
 * Creates a revolution profile sampler from 2D points
 */
export function createRevolutionProfileSampler(polygon: Point2D[]): (yVal: number) => number {
  const len = polygon.length;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [, y] of polygon) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  minY -= SPATIAL_HASH_EPS;
  maxY += SPATIAL_HASH_EPS;

  const toCell = (y: number): number =>
    Math.min(SPATIAL_HASH_CELLS - 1, Math.floor(((y - minY) / (maxY - minY)) * SPATIAL_HASH_CELLS));

  const bins: number[][] = Array.from({ length: SPATIAL_HASH_CELLS }, () => []);

  for (let i = 0; i < len; i++) {
    const y0 = polygon[i][1];
    const y1 = polygon[(i + 1) % len][1];
    const maxCell = toCell(Math.max(y0, y1) + SPATIAL_HASH_EPS);
    for (let c = toCell(Math.min(y0, y1) - SPATIAL_HASH_EPS); c <= maxCell; c++) {
      bins[c].push(i);
    }
  }

  return (yTarget: number): number => {
    let minX = Infinity;
    let maxX = -Infinity;

    if (!(yTarget >= minY && yTarget <= maxY)) {
      return maxX - minX;
    }

    const candidates = bins[toCell(yTarget)];
    for (const idx of candidates) {
      const [x0, y0] = polygon[idx];
      const [x1, y1] = polygon[(idx + 1) % len];

      if (Math.abs(y1 - y0) < 1e-9) {
        if (Math.abs(y0 - yTarget) < 1e-6) {
          minX = Math.min(minX, x0, x1);
          maxX = Math.max(maxX, x0, x1);
        }
        continue;
      }

      if ((y0 <= yTarget && y1 >= yTarget) || (y1 <= yTarget && y0 >= yTarget)) {
        const xIntersect = x0 + ((x1 - x0) * (yTarget - y0)) / (y1 - y0);
        if (xIntersect < minX) minX = xIntersect;
        if (xIntersect > maxX) maxX = xIntersect;
      }
    }

    return maxX - minX;
  };
}

/**
 * Creates 3D revolution rings from a 2D silhouette
 */
export function generateRevolutionMesh(polygon: Point2D[]): Point3D[] {
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [, y] of polygon) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const profile = createRevolutionProfileSampler(polygon);
  const radiusAt = (y: number): number => {
    const span = profile(y);
    return span < 0 ? 0 : span / 2 / CANONICAL_CENTER;
  };

  const height = maxY - minY;
  const findCapTransition = (yEdge: number, sign: number) => {
    if (radiusAt(yEdge) >= 0.06) return null;
    const baseR = radiusAt(yEdge);
    let step = height * 0.02;

    for (let s = height / 512; s <= height * 0.05; s += height / 512) {
      if (Math.abs(radiusAt(yEdge + sign * s) - baseR) > 1e-4) {
        step = s;
        break;
      }
    }
    return { yEdge, sign, step, endR: radiusAt(yEdge + sign * step) };
  };

  const caps = [findCapTransition(minY, 1), findCapTransition(maxY, -1)].filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

  const smoothedRadius = (y: number): number => {
    let r = radiusAt(y);
    for (const cap of caps) {
      const dist = (y - cap.yEdge) * cap.sign;
      if (dist >= 0 && dist < cap.step) {
        r = Math.min(r, cap.endR * Math.sqrt(dist / cap.step));
      }
    }
    return r;
  };

  const points: Point3D[] = [];

  const addRing = (normY: number, rawY: number) => {
    const r = smoothedRadius(rawY);
    if (r < 0.06) {
      points.push({ x: 0, y: normY, z: 0 });
    } else {
      for (let s = 0; s < REVOLUTION_SEGMENTS; s++) {
        const theta = (s / REVOLUTION_SEGMENTS) * TAU;
        points.push({
          x: r * Math.sin(theta),
          y: normY,
          z: r * Math.cos(theta)
        });
      }
    }
  };

  const topNormY = -(minY - CANONICAL_CENTER) / CANONICAL_CENTER;
  const bottomNormY = -(maxY - CANONICAL_CENTER) / CANONICAL_CENTER;

  addRing(topNormY, minY);

  const sampleCount = 95;
  for (let s = 1; s < sampleCount; s++) {
    const factor = (1 - Math.cos((s / sampleCount) * Math.PI)) / 2;
    const rawY = minY + (maxY - minY) * factor;
    const r = smoothedRadius(rawY);
    const normY = -(rawY - CANONICAL_CENTER) / CANONICAL_CENTER;

    if (r < 1e-4) {
      points.push({ x: 0, y: normY, z: 0 });
    } else {
      for (let step = 0; step < REVOLUTION_SEGMENTS; step++) {
        const theta = (step / REVOLUTION_SEGMENTS) * TAU;
        points.push({
          x: r * Math.sin(theta),
          y: normY,
          z: r * Math.cos(theta)
        });
      }
    }
  }

  addRing(bottomNormY, maxY);
  return points;
}

/**
 * Creates a Revolution Shape3DModel (pebble, egg, cylinder, etc.)
 */
export function createRevolutionModel(scale: number, shape: string): Shape3DModel {
  const mesh = generateRevolutionMesh(getShapePolygon(shape));
  const analyzed = getAnalyzedShapePath(shape);
  const yBottom = -(analyzed.bottom - CANONICAL_CENTER) / CANONICAL_CENTER;
  const yTop = -(analyzed.top - CANONICAL_CENTER) / CANONICAL_CENTER;

  const profileSampler = createRevolutionProfileSampler(getShapePolygon(shape));
  const radiusAt = (normY: number): number => {
    const rawY = CANONICAL_CENTER - normY * CANONICAL_CENTER;
    const span = profileSampler(rawY);
    return Math.max(0.02, span / 2 / CANONICAL_CENTER);
  };

  const eyeY = Math.min(yTop - 0.02, Math.max(yBottom + 0.02, 0));

  return {
    size: scale,
    silhouette: {
      kind: 'solid',
      samples: mesh,
      balls: [],
      isLoop: false,
      yawPeriod: 360 / REVOLUTION_SEGMENTS
    },
    seat: {
      kind: 'wrap',
      wrapR: radiusAt(eyeY),
      wrapY0: yBottom,
      wrapY1: yTop,
      eyeY,
      radiusAt
    }
  };
}

/**
 * Precomputed 2D perimeter points for heartChubby
 */
export const HEART_CHUBBY_POLYGON: Point3D[] = [
  { x: 0.934475, y: 0.004363, z: 0 },
  { x: 0.948892, y: 0.039715, z: 0 },
  { x: 0.960873, y: 0.07607, z: 0 },
  { x: 0.97033, y: 0.113265, z: 0 },
  { x: 0.97719, y: 0.151127, z: 0 },
  { x: 0.981391, y: 0.189478, z: 0 },
  { x: 0.982889, y: 0.228137, z: 0 },
  { x: 0.981652, y: 0.266916, z: 0 },
  { x: 0.977663, y: 0.305628, z: 0 },
  { x: 0.970917, y: 0.344081, z: 0 },
  { x: 0.961427, y: 0.382083, z: 0 },
  { x: 0.949221, y: 0.419442, z: 0 },
  { x: 0.934347, y: 0.455971, z: 0 },
  { x: 0.916864, y: 0.491484, z: 0 },
  { x: 0.896854, y: 0.525803, z: 0 },
  { x: 0.874414, y: 0.558756, z: 0 },
  { x: 0.849661, y: 0.590185, z: 0 },
  { x: 0.822729, y: 0.619944, z: 0 },
  { x: 0.793762, y: 0.647897, z: 0 },
  { x: 0.762906, y: 0.673914, z: 0 },
  { x: 0.730313, y: 0.69787, z: 0 },
  { x: 0.696141, y: 0.719649, z: 0 },
  { x: 0.66056, y: 0.73915, z: 0 },
  { x: 0.623751, y: 0.75629, z: 0 },
  { x: 0.585907, y: 0.771002, z: 0 },
  { x: 0.547225, y: 0.783237, z: 0 },
  { x: 0.507905, y: 0.792966, z: 0 },
  { x: 0.468149, y: 0.800173, z: 0 },
  { x: 0.42816, y: 0.80486, z: 0 },
  { x: 0.388136, y: 0.807043, z: 0 },
  { x: 0.348273, y: 0.806754, z: 0 },
  { x: 0.30876, y: 0.804036, z: 0 },
  { x: 0.269782, y: 0.79895, z: 0 },
  { x: 0.231517, y: 0.791569, z: 0 },
  { x: 0.194132, y: 0.781978, z: 0 },
  { x: 0.157785, y: 0.770263, z: 0 },
  { x: 0.122627, y: 0.756535, z: 0 },
  { x: 0.0888, y: 0.740942, z: 0 },
  { x: 0.056426, y: 0.723602, z: 0 },
  { x: 0.025616, y: 0.70466, z: 0 },
  { x: -0.003604, y: 0.689511, z: 0 },
  { x: -0.033175, y: 0.70954, z: 0 },
  { x: -0.064385, y: 0.728086, z: 0 },
  { x: -0.097135, y: 0.745017, z: 0 },
  { x: -0.131306, y: 0.760147, z: 0 },
  { x: -0.166773, y: 0.773378, z: 0 },
  { x: -0.203396, y: 0.78458, z: 0 },
  { x: -0.241017, y: 0.793631, z: 0 },
  { x: -0.279477, y: 0.800446, z: 0 },
  { x: -0.318605, y: 0.804944, z: 0 },
  { x: -0.358222, y: 0.807057, z: 0 },
  { x: -0.398144, y: 0.806731, z: 0 },
  { x: -0.438177, y: 0.803924, z: 0 },
  { x: -0.478127, y: 0.798608, z: 0 },
  { x: -0.517793, y: 0.790771, z: 0 },
  { x: -0.556972, y: 0.780413, z: 0 },
  { x: -0.595464, y: 0.767555, z: 0 },
  { x: -0.633067, y: 0.752231, z: 0 },
  { x: -0.669586, y: 0.734493, z: 0 },
  { x: -0.70483, y: 0.714412, z: 0 },
  { x: -0.738621, y: 0.692077, z: 0 },
  { x: -0.770792, y: 0.667594, z: 0 },
  { x: -0.801192, y: 0.641084, z: 0 },
  { x: -0.829668, y: 0.61267, z: 0 },
  { x: -0.856071, y: 0.582482, z: 0 },
  { x: -0.880259, y: 0.550658, z: 0 },
  { x: -0.902102, y: 0.517347, z: 0 },
  { x: -0.921488, y: 0.482714, z: 0 },
  { x: -0.938325, y: 0.446929, z: 0 },
  { x: -0.952536, y: 0.410174, z: 0 },
  { x: -0.964065, y: 0.372636, z: 0 },
  { x: -0.97287, y: 0.334503, z: 0 },
  { x: -0.978926, y: 0.295967, z: 0 },
  { x: -0.982226, y: 0.25722, z: 0 },
  { x: -0.982775, y: 0.218453, z: 0 },
  { x: -0.980597, y: 0.179853, z: 0 },
  { x: -0.975726, y: 0.141608, z: 0 },
  { x: -0.968211, y: 0.103897, z: 0 },
  { x: -0.958114, y: 0.066896, z: 0 },
  { x: -0.945515, y: 0.030776, z: 0 },
  { x: -0.930505, y: -0.004299, z: 0 },
  { x: -0.913195, y: -0.038176, z: 0 },
  { x: -0.893702, y: -0.070708, z: 0 },
  { x: -0.872159, y: -0.101761, z: 0 },
  { x: -0.848736, y: -0.131217, z: 0 },
  { x: -0.823621, y: -0.158973, z: 0 },
  { x: -0.797098, y: -0.18497, z: 0 },
  { x: -0.771054, y: -0.209614, z: 0 },
  { x: -0.746119, y: -0.233208, z: 0 },
  { x: -0.722152, y: -0.255887, z: 0 },
  { x: -0.699027, y: -0.277769, z: 0 },
  { x: -0.676632, y: -0.29896, z: 0 },
  { x: -0.654868, y: -0.319554, z: 0 },
  { x: -0.633643, y: -0.339637, z: 0 },
  { x: -0.612875, y: -0.359289, z: 0 },
  { x: -0.592487, y: -0.37858, z: 0 },
  { x: -0.572408, y: -0.397581, z: 0 },
  { x: -0.552568, y: -0.416353, z: 0 },
  { x: -0.532905, y: -0.434959, z: 0 },
  { x: -0.513356, y: -0.453458, z: 0 },
  { x: -0.493859, y: -0.471906, z: 0 },
  { x: -0.474354, y: -0.490362, z: 0 },
  { x: -0.454782, y: -0.508882, z: 0 },
  { x: -0.435081, y: -0.527524, z: 0 },
  { x: -0.415188, y: -0.546348, z: 0 },
  { x: -0.395037, y: -0.565415, z: 0 },
  { x: -0.374561, y: -0.58479, z: 0 },
  { x: -0.353687, y: -0.604542, z: 0 },
  { x: -0.332335, y: -0.624746, z: 0 },
  { x: -0.310422, y: -0.645481, z: 0 },
  { x: -0.287855, y: -0.666835, z: 0 },
  { x: -0.26453, y: -0.688906, z: 0 },
  { x: -0.240327, y: -0.711785, z: 0 },
  { x: -0.214659, y: -0.734005, z: 0 },
  { x: -0.187035, y: -0.753471, z: 0 },
  { x: -0.157726, y: -0.770065, z: 0 },
  { x: -0.127007, y: -0.783671, z: 0 },
  { x: -0.095168, y: -0.794231, z: 0 },
  { x: -0.062495, y: -0.801658, z: 0 },
  { x: -0.029282, y: -0.805976, z: 0 },
  { x: 0.004183, y: -0.80716, z: 0 },
  { x: 0.037612, y: -0.8052, z: 0 },
  { x: 0.070718, y: -0.800109, z: 0 },
  { x: 0.10321, y: -0.791889, z: 0 },
  { x: 0.134799, y: -0.78058, z: 0 },
  { x: 0.165197, y: -0.766237, z: 0 },
  { x: 0.194114, y: -0.748919, z: 0 },
  { x: 0.221262, y: -0.728704, z: 0 },
  { x: 0.246462, y: -0.705993, z: 0 },
  { x: 0.270428, y: -0.683311, z: 0 },
  { x: 0.293552, y: -0.661427, z: 0 },
  { x: 0.315946, y: -0.640234, z: 0 },
  { x: 0.337708, y: -0.619638, z: 0 },
  { x: 0.358931, y: -0.599553, z: 0 },
  { x: 0.379697, y: -0.5799, z: 0 },
  { x: 0.400083, y: -0.560607, z: 0 },
  { x: 0.420161, y: -0.541605, z: 0 },
  { x: 0.439999, y: -0.522832, z: 0 },
  { x: 0.45966, y: -0.504224, z: 0 },
  { x: 0.479207, y: -0.485725, z: 0 },
  { x: 0.498701, y: -0.467276, z: 0 },
  { x: 0.518203, y: -0.448819, z: 0 },
  { x: 0.537773, y: -0.430299, z: 0 },
  { x: 0.557471, y: -0.411656, z: 0 },
  { x: 0.577362, y: -0.392832, z: 0 },
  { x: 0.597509, y: -0.373765, z: 0 },
  { x: 0.617982, y: -0.35439, z: 0 },
  { x: 0.638853, y: -0.334638, z: 0 },
  { x: 0.6602, y: -0.314435, z: 0 },
  { x: 0.682109, y: -0.2937, z: 0 },
  { x: 0.704673, y: -0.272346, z: 0 },
  { x: 0.727993, y: -0.250276, z: 0 },
  { x: 0.7522, y: -0.227386, z: 0 },
  { x: 0.777421, y: -0.20355, z: 0 },
  { x: 0.803765, y: -0.178622, z: 0 },
  { x: 0.830042, y: -0.152199, z: 0 },
  { x: 0.854755, y: -0.124009, z: 0 },
  { x: 0.877712, y: -0.094143, z: 0 },
  { x: 0.898759, y: -0.062708, z: 0 },
  { x: 0.917726, y: -0.029827, z: 0 }
];

/**
 * 3D Model Registry for built-in shapes
 */
export const SHAPE_3D_MODELS: Record<string, () => Shape3DModel> = {
  square: () => createExtrusionModel(1.0413, normalize2DTo3D(getShapePolygon('square'))),
  sparkle: () => createExtrusionModel(1.521, normalize2DTo3D(getShapePolygon('sparkle'))),
  clover: () => createExtrusionModel(1.0881, normalize2DTo3D(getShapePolygon('clover'))),
  house: () => createExtrusionModel(1.17, normalize2DTo3D(getShapePolygon('house'))),
  hex: () => createExtrusionModel(1.2519, normalize2DTo3D(getShapePolygon('hex'))),
  star6: () => createExtrusionModel(1.4976, normalize2DTo3D(getShapePolygon('star6')), 0.3, 0.18),
  starFlower: () => {
    const rBase = 0.58;
    const centers: Point3D[] = [{ x: 0, y: 0, z: 0.36 }];
    for (let i = 0; i < 6; i++) {
      const theta = -Math.PI / 2 + (i * TAU) / 6;
      centers.push({ x: rBase * Math.cos(theta), y: rBase * Math.sin(theta), z: 0.33 });
    }
    const polygon: Point3D[] = [];
    for (let i = 0; i < 240; i++) {
      const theta = (i / 240) * TAU;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      let lo = 0;
      let hi = 0.91;
      for (let step = 0; step < 22; step++) {
        const mid = (lo + hi) / 2;
        const px = mid * cosT;
        const py = mid * sinT;
        const inside = centers.some(
          (c) => (px - c.x) * (px - c.x) + (py - c.y) * (py - c.y) <= c.z * c.z
        );
        if (inside) lo = mid;
        else hi = mid;
      }
      polygon.push({ x: lo * cosT, y: lo * sinT, z: 0 });
    }
    return createExtrusionModel(1.3923, polygon);
  },
  cloud: () => createLoftModel(1.3455, normalize2DTo3D(getShapePolygon('cloud', 1)), 0.72),
  heartChubby: () => createLoftModel(1.3572, HEART_CHUBBY_POLYGON, 0.62),
  pebble: () => createRevolutionModel(1.2168, 'pebble'),
  egg: () => createRevolutionModel(1.17, 'egg'),
  gem: () => createRevolutionModel(1.17, 'gem'),
  shield: () => createRevolutionModel(1.17, 'shield'),
  dome: () => createRevolutionModel(1.17, 'dome'),
  leaf: () => createRevolutionModel(1.17, 'leaf'),
  arch: () => {
    const analyzed = getAnalyzedShapePath('arch');
    const yBottom = -(analyzed.bottom - CANONICAL_CENTER) / CANONICAL_CENTER;
    const yTop = -(analyzed.top - CANONICAL_CENTER) / CANONICAL_CENTER;
    const mesh = generateRevolutionMesh(getShapePolygon('arch'));
    const profile = createRevolutionProfileSampler(getShapePolygon('arch'));
    const radiusAt = (normY: number) => {
      const rawY = CANONICAL_CENTER - normY * CANONICAL_CENTER;
      return Math.max(0.02, profile(rawY) / 2 / CANONICAL_CENTER);
    };
    return {
      size: 1.17,
      silhouette: {
        kind: 'solid',
        samples: mesh,
        balls: [],
        isLoop: false,
        yawPeriod: 360 / REVOLUTION_SEGMENTS
      },
      seat: {
        kind: 'wrap',
        wrapR: analyzed.beltRadius / CANONICAL_CENTER,
        wrapY0: yBottom,
        wrapY1: yTop,
        eyeY: yBottom + (yTop - yBottom) * 0.42,
        radiusAt
      }
    };
  },
  cylinder: () => {
    const analyzed = getAnalyzedShapePath('cylinder');
    const yBottom = -(analyzed.bottom - CANONICAL_CENTER) / CANONICAL_CENTER;
    const yTop = -(analyzed.top - CANONICAL_CENTER) / CANONICAL_CENTER;
    const mesh = generateRevolutionMesh(getShapePolygon('cylinder'));
    const profile = createRevolutionProfileSampler(getShapePolygon('cylinder'));
    const radiusAt = (normY: number) => {
      const rawY = CANONICAL_CENTER - normY * CANONICAL_CENTER;
      return Math.max(0.02, profile(rawY) / 2 / CANONICAL_CENTER);
    };
    return {
      size: 1.17,
      silhouette: {
        kind: 'solid',
        samples: mesh,
        balls: [],
        isLoop: false,
        yawPeriod: 360 / REVOLUTION_SEGMENTS
      },
      seat: {
        kind: 'wrap',
        wrapR: analyzed.beltRadius / CANONICAL_CENTER,
        wrapY0: yBottom,
        wrapY1: yTop,
        eyeY: (yTop + yBottom) * 0.5,
        radiusAt
      }
    };
  },
  wedge: () => {
    const polygon = getShapePolygon('wedge');
    const analyzed = getAnalyzedShapePath('wedge');
    const mesh = generateRevolutionMesh(polygon);
    const [, r] = analyzed.spanAt(analyzed.top + (analyzed.bottom - analyzed.top) * 0.5);
    const yTop = -(analyzed.top - CANONICAL_CENTER) / CANONICAL_CENTER;
    const yBottom = -(analyzed.bottom - CANONICAL_CENTER) / CANONICAL_CENTER;
    const profile = createRevolutionProfileSampler(polygon);
    const radiusAt = (normY: number) => {
      const rawY = CANONICAL_CENTER - normY * CANONICAL_CENTER;
      return Math.max(0.02, profile(rawY) / 2 / CANONICAL_CENTER);
    };
    return {
      size: 1.3591,
      silhouette: {
        kind: 'solid',
        samples: mesh,
        balls: [],
        isLoop: false,
        yawPeriod: 360 / REVOLUTION_SEGMENTS
      },
      seat: {
        kind: 'wrap',
        wrapR: Math.max(0.2, (r - CANONICAL_CENTER) / CANONICAL_CENTER),
        wrapY0: yBottom,
        wrapY1: yTop,
        eyeY: yTop + (yBottom - yTop) * 0.5,
        radiusAt
      }
    };
  },
  teardrop: () => {
    const polygon = getShapePolygon('teardrop');
    const analyzed = getAnalyzedShapePath('teardrop');
    const mesh = generateRevolutionMesh(polygon);
    const [, r] = analyzed.spanAt(analyzed.top + (analyzed.bottom - analyzed.top) * 0.62);
    const yBottom = -(analyzed.bottom - CANONICAL_CENTER) / CANONICAL_CENTER;
    const yTop = -(analyzed.top - CANONICAL_CENTER) / CANONICAL_CENTER;
    const profile = createRevolutionProfileSampler(polygon);
    const radiusAt = (normY: number) => {
      const rawY = CANONICAL_CENTER - normY * CANONICAL_CENTER;
      return Math.max(0.02, profile(rawY) / 2 / CANONICAL_CENTER);
    };
    return {
      size: 1.3181,
      silhouette: {
        kind: 'solid',
        samples: mesh,
        balls: [],
        isLoop: false,
        yawPeriod: 360 / REVOLUTION_SEGMENTS
      },
      seat: {
        kind: 'wrap',
        wrapR: Math.max(0.2, (r - CANONICAL_CENTER) / CANONICAL_CENTER),
        wrapY0: yBottom,
        wrapY1: yTop,
        eyeY: (yBottom + yTop) * 0.5,
        radiusAt
      }
    };
  },
  squircle: () => {
    const ring = getAnalyzedShapePath('squircle').ring.map(([x, y]) => ({
      x: (x - CANONICAL_CENTER) / CANONICAL_CENTER,
      y: -(y - CANONICAL_CENTER) / CANONICAL_CENTER
    }));
    const halfDepth = 0.28;
    const bevel = 0.11;
    const len = ring.length;
    const points: Point3D[] = [];

    for (let i = 0; i < len; i++) {
      const curr = ring[i];
      const prev = ring[(i - 1 + len) % len];
      const next = ring[(i + 1) % len];
      let nx = next.y - prev.y;
      let ny = -(next.x - prev.x);
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      if (nx * curr.x + ny * curr.y < 0) {
        nx = -nx;
        ny = -ny;
      }
      for (let s = 0; s <= BEVEL_STEPS; s++) {
        const theta = (s / BEVEL_STEPS) * (Math.PI / 2);
        const offset = bevel * (1 - Math.cos(theta));
        const z = halfDepth - bevel + bevel * Math.sin(theta);
        points.push({ x: curr.x - nx * offset, y: curr.y - ny * offset, z });
        points.push({ x: curr.x - nx * offset, y: curr.y - ny * offset, z: -z });
      }
    }

    return {
      size: 1.17,
      silhouette: {
        kind: 'solid',
        samples: points,
        balls: [],
        isLoop: false,
        yawPeriod: null
      },
      seat: { kind: 'front', faceZ: halfDepth }
    };
  },
  tablet: () => {
    const analyzed = getAnalyzedShapePath('tablet');
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of analyzed.ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const hx = (maxX - minX) / 2 / CANONICAL_CENTER;
    const hy = (maxY - minY) / 2 / CANONICAL_CENTER;
    const extraX = Math.max(0, hx - hy);
    const balls: Ball4D[] = [];
    for (let i = 0; i < INSCRIBED_BALL_STEPS; i++) {
      const xNorm = -extraX + (extraX * 2 * i) / (INSCRIBED_BALL_STEPS - 1);
      balls.push([xNorm, 0, 0, hy]);
    }
    return {
      size: 1.3923,
      silhouette: {
        kind: 'solid',
        samples: [],
        balls,
        isLoop: false,
        yawPeriod: null
      },
      seat: {
        kind: 'wrapX',
        wrapR: hy,
        wrapX0: -hx + 0.02,
        wrapX1: hx - 0.02,
        radiusAtX: (xVal: number) => {
          const delta = Math.abs(xVal) - extraX;
          return delta <= 0 ? hy : Math.sqrt(Math.max(0, hy * hy - delta * delta));
        }
      }
    };
  },
  capsule: () => {
    const analyzed = getAnalyzedShapePath('capsule');
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of analyzed.ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const hx = (maxX - minX) / 2 / CANONICAL_CENTER;
    const hy = (maxY - minY) / 2 / CANONICAL_CENTER;
    const extraY = Math.max(0, hy - hx);
    const balls: Ball4D[] = [];
    for (let i = 0; i < INSCRIBED_BALL_STEPS; i++) {
      const yNorm = -extraY + (extraY * 2 * i) / (INSCRIBED_BALL_STEPS - 1);
      balls.push([0, yNorm, 0, hx]);
    }
    const yBottom = -(maxY - CANONICAL_CENTER) / CANONICAL_CENTER;
    const yTop = -(minY - CANONICAL_CENTER) / CANONICAL_CENTER;
    return {
      size: 1.17,
      silhouette: {
        kind: 'solid',
        samples: [],
        balls,
        isLoop: false,
        yawPeriod: null
      },
      seat: {
        kind: 'wrap',
        wrapR: Math.max(0.35, hx),
        wrapY0: yBottom,
        wrapY1: yTop,
        eyeY: (yTop + yBottom) * 0.5
      }
    };
  },
  bean: () => {
    const polygon = getShapePolygon('bean');
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of polygon) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const insidePolygon = (px: number, py: number): boolean => {
      let inside = false;
      const len = polygon.length;
      for (let i = 0, j = len - 1; i < len; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > py !== yj > py && px < xi + ((xj - xi) * (py - yi)) / (yj - yi)) {
          inside = !inside;
        }
      }
      return inside;
    };
    const step = Math.max(maxX - minX, maxY - minY) / MEDIAL_GRID_SIZE;
    const candidates: { x: number; y: number; r: number }[] = [];
    for (let y = minY + step / 2; y < maxY; y += step) {
      for (let x = minX + step / 2; x < maxX; x += step) {
        if (!insidePolygon(x, y)) continue;
        let minSq = Infinity;
        for (const [px, py] of polygon) {
          minSq = Math.min(minSq, (px - x) * (px - x) + (py - y) * (py - y));
        }
        const r = Math.sqrt(minSq);
        if (r > step) candidates.push({ x, y, r });
      }
    }
    candidates.sort((a, b) => b.r - a.r);
    const chosen: { x: number; y: number; r: number }[] = [];
    for (const c of candidates) {
      if (!chosen.some((t) => Math.hypot(c.x - t.x, c.y - t.y) + c.r <= t.r + step * 0.25)) {
        chosen.push(c);
      }
    }
    const balls: Ball4D[] = chosen.map((c) => [
      (c.x - CANONICAL_CENTER) / CANONICAL_CENTER,
      -(c.y - CANONICAL_CENTER) / CANONICAL_CENTER,
      0,
      c.r / CANONICAL_CENTER
    ]);
    const analyzed = getAnalyzedShapePath('bean');
    const yBottom = -(analyzed.bottom - CANONICAL_CENTER) / CANONICAL_CENTER;
    const yTop = -(analyzed.top - CANONICAL_CENTER) / CANONICAL_CENTER;
    const profile = createRevolutionProfileSampler(polygon);
    const radiusAt = (normY: number) => {
      const rawY = CANONICAL_CENTER - normY * CANONICAL_CENTER;
      return Math.max(0.02, profile(rawY) / 2 / CANONICAL_CENTER);
    };
    const eyeY = Math.min(yTop - 0.02, Math.max(yBottom + 0.02, 0));
    return {
      size: 1.17,
      silhouette: {
        kind: 'solid',
        samples: [],
        balls,
        isLoop: false,
        yawPeriod: null
      },
      seat: {
        kind: 'wrap',
        wrapR: radiusAt(eyeY),
        wrapY0: yBottom,
        wrapY1: yTop,
        eyeY,
        radiusAt,
        puffAt: (px: number, py: number) => {
          let chosenBall = balls[0];
          let maxZ = -Infinity;
          let minDist = Infinity;
          let foundInside = false;
          for (const b of balls) {
            const d = Math.hypot(px - b[0], py - b[1]);
            if (d < b[3]) {
              const zVal = b[2] + Math.sqrt(b[3] * b[3] - d * d);
              if (!foundInside || zVal > maxZ) {
                foundInside = true;
                maxZ = zVal;
                chosenBall = b;
              }
            } else if (!foundInside && d - b[3] < minDist) {
              minDist = d - b[3];
              chosenBall = b;
            }
          }
          return {
            x: chosenBall[0],
            y: chosenBall[1],
            z: chosenBall[2],
            r: chosenBall[3]
          };
        }
      }
    };
  },
  crystal: () => {
    const radius = 0.12;
    const vertices: Point3D[] = [
      { x: 0, y: 1.04, z: 0 },
      { x: 0, y: -1.04, z: 0 }
    ];
    const ringR = 0.52;
    for (const ySign of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * TAU;
        vertices.push({
          x: ringR * Math.cos(theta),
          y: ySign * 0.51,
          z: ringR * Math.sin(theta)
        });
      }
    }
    const samples: Point3D[] = [];
    for (const v of vertices) {
      for (let lat = 0; lat <= 8; lat++) {
        const phi = (lat / 8) * Math.PI;
        const sinP = Math.sin(phi);
        const lonCount = lat === 0 || lat === 8 ? 1 : 14;
        for (let lon = 0; lon < lonCount; lon++) {
          const theta = (lon / lonCount) * TAU;
          samples.push({
            x: v.x + radius * sinP * Math.sin(theta),
            y: v.y + radius * Math.cos(phi),
            z: v.z + radius * sinP * Math.cos(theta)
          });
        }
      }
    }
    return {
      size: 1.3806,
      silhouette: {
        kind: 'solid',
        samples,
        balls: [],
        isLoop: false,
        yawPeriod: null
      },
      seat: {
        kind: 'front',
        faceZ: (Math.sqrt(3) / 2) * 0.64
      }
    };
  }
};

/**
 * Memoization cache for 3D shape models
 */
const modelCache = new Map<string, Shape3DModel>();

/**
 * Retrieves the compiled 3D shape descriptor for given shape identifier
 */
export function getShape3DModel(shape: string): Shape3DModel {
  const cached = modelCache.get(shape);
  if (cached) return cached;

  const fn = SHAPE_3D_MODELS[shape];
  if (!fn) {
    throw new Error(`getShape3DModel: unknown shape "${shape}"`);
  }

  const model = fn();
  modelCache.set(shape, model);
  return model;
}

/**
 * Clears model memoization cache
 */
export function invalidateModelCache(shape: string): void {
  modelCache.delete(shape);
}

/**
 * Clears entire model memoization cache
 */
export function invalidateAllModelCaches(): void {
  modelCache.clear();
}

/**
 * Registers a custom shape contour dynamically into the 3D rendering pipeline
 */
export function registerCustomShape(name: string, options: Partial<CustomShapeOptions> = {}): string {
  if (!name || typeof name !== 'string') {
    throw new Error('registerCustomShape: name must be a non-empty string');
  }

  const {
    path = 'M 114.27 20 L 208.54 114.27 L 114.27 208.54 L 20 114.27 Z',
    scale = 1.2,
    eyeLayout = { width: 0.22, height: 0.48, gap: 0.5, shiftY: 0 }
  } = options;

  SHAPE_CONTOURS[name] = typeof path === 'function' ? path : () => path;
  SHAPE_3D_MODELS[name] = () =>
    createExtrusionModel(scale, normalize2DTo3D(getShapePolygon(name)));

  SHAPE_EYE_LAYOUTS[name] = {
    width: eyeLayout.width ?? 0.22,
    height: eyeLayout.height ?? 0.48,
    gap: eyeLayout.gap ?? 0.5,
    shiftY: eyeLayout.shiftY ?? 0
  };

  invalidateContourCache(name);
  invalidateModelCache(name);

  return name;
}
