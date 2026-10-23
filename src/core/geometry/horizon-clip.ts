/**
 * Horizon Line Projection, Eye Seating & 2D Polygon Overlay Clipper
 *
 * Implements 3D-to-2D projection of features onto curved 3D avatar seating surfaces:
 * - Planar front face projection
 * - Loft heightfield surface projection
 * - Cylindrical vertical/horizontal wrap projection
 * - 2D Boolean polygon union & internal edge dissolving for clean SVG rendering
 */

import { CANONICAL_CENTER, type Point2D } from './contours';
import type { Shape3DModel, EyeSeat, Point3D } from '../mesh/extrusion';
import { SHAPE_EYE_LAYOUTS } from './shapes-table';
import { getEngineConfig } from '../config';

export interface ProjectedPoint2D {
  x: number;
  y: number;
}

export interface ProjectionContext {
  rotate: (p: Point3D) => Point3D;
  project: (p: Point3D) => ProjectedPoint2D;
  origin: ProjectedPoint2D;
  radius: number;
}

export interface OrientationEuler {
  yaw: number;
  pitch: number;
  roll: number;
}

const TAU = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
const EYE_LOOP_POINTS = 64;
const BASE_EYE_GAP = 0.64;
const BASE_EYE_WIDTH = 0.22;
const BASE_EYE_HEIGHT = 0.48;

/**
 * Constructs a 3D Euler rotation function
 */
export function createRotationMatrix(yawDeg: number, pitchDeg: number, rollDeg: number): (p: Point3D) => Point3D {
  const yawRad = yawDeg * DEG_TO_RAD;
  const pitchRad = pitchDeg * DEG_TO_RAD;
  const rollRad = rollDeg * DEG_TO_RAD;

  const cy = Math.cos(yawRad);
  const sy = Math.sin(yawRad);
  const cp = Math.cos(pitchRad);
  const sp = Math.sin(pitchRad);
  const cr = Math.cos(rollRad);
  const sr = Math.sin(rollRad);

  return ({ x, y, z }: Point3D): Point3D => {
    // Yaw rotation around Y
    const x1 = x * cy + z * sy;
    const z1 = z * cy - x * sy;

    // Pitch rotation around X
    const y2 = y * cp - z1 * sp;
    const z2 = z1 * cp + y * sp;

    // Roll rotation around Z
    const x3 = x1 * cr - y2 * sr;
    const y3 = y2 * cr + x1 * sr;

    return { x: x3, y: y3, z: z2 };
  };
}

/**
 * Calculates projected avatar radius on screen
 */
export function computeProjectedRadius(model: Shape3DModel, size: number): number {
  const factor = getEngineConfig()?.mesh?.projectedRadiusFactor ?? (0.36 / 1.18);
  return Math.max(0.2, model.size) * (factor * size);
}

/**
 * Creates 3D projection context with rotation, translation, and scale
 */
export function createProjectionContext(
  model: Shape3DModel,
  orientation: OrientationEuler,
  size: number
): ProjectionContext {
  const center = size / 2;
  const radius = computeProjectedRadius(model, size);
  const rotate = createRotationMatrix(orientation.yaw, orientation.pitch, orientation.roll);

  return {
    rotate,
    project: (p: Point3D): ProjectedPoint2D => {
      const rot = rotate(p);
      return {
        x: center + radius * rot.x,
        y: center - radius * rot.y
      };
    },
    origin: { x: center, y: center },
    radius
  };
}

/**
 * Projects eyes onto a flat planar front face (seat.kind === 'front')
 */
export function projectEyesFront(
  faceZ: number,
  eyes: { loops: Point3D[][]; shiftY: number },
  ctx: ProjectionContext
): ProjectedPoint2D[][] {
  if (!(ctx.rotate({ x: 0, y: 0, z: 1 }).z > 0.03)) return [];
  const shiftY = Math.sin(eyes.shiftY);

  return eyes.loops
    .filter((loop) => loop.length >= 3)
    .map((loop) =>
      loop.map((pt) =>
        ctx.project({
          x: pt.x,
          y: pt.y - shiftY,
          z: faceZ
        })
      )
    );
}

/**
 * Projects eyes onto a 3D lofted heightfield surface (seat.kind === 'loft')
 */
export function projectEyesLoft(
  surfaceFn: (x: number, y: number) => number,
  eyes: { loops: Point3D[][]; shiftY: number },
  ctx: ProjectionContext
): ProjectedPoint2D[][] {
  if (!(ctx.rotate({ x: 0, y: 0, z: 1 }).z >= 0.05)) return [];
  const shiftY = Math.sin(eyes.shiftY);
  const result: ProjectedPoint2D[][] = [];

  for (const loop of eyes.loops) {
    if (loop.length < 3) continue;
    const shifted = loop.map((pt) => ({ x: pt.x, y: pt.y - shiftY }));

    let cx = 0;
    let cy = 0;
    for (const pt of shifted) {
      cx += pt.x;
      cy += pt.y;
    }
    cx /= shifted.length;
    cy /= shifted.length;

    const eps = 4e-3;
    const dzdx = (surfaceFn(cx + eps, cy) - surfaceFn(cx - eps, cy)) / (2 * eps);
    const dzdy = (surfaceFn(cx, cy + eps) - surfaceFn(cx, cy - eps)) / (2 * eps);
    const normLen = Math.hypot(dzdx, dzdy, 1);

    if (ctx.rotate({ x: -dzdx / normLen, y: -dzdy / normLen, z: 1 / normLen }).z < 0.12) {
      continue;
    }

    const baseZ = surfaceFn(cx, cy);
    result.push(
      shifted.map((pt) =>
        ctx.project({
          x: pt.x,
          y: pt.y,
          z: baseZ + (pt.x - cx) * dzdx + (pt.y - cy) * dzdy
        })
      )
    );
  }

  return result;
}

/**
 * Projects eyes onto a vertical cylinder surface (seat.kind === 'wrap')
 */
export function projectEyesWrapY(
  seat: EyeSeat & { kind: 'wrap' },
  eyes: { loops: Point3D[][]; shiftY: number },
  ctx: ProjectionContext
): ProjectedPoint2D[][] {
  const { wrapR, wrapY0, wrapY1, radiusAt, puffAt } = seat;
  const margin = radiusAt ? 0.02 : 0.06;
  const centerY = Math.min(wrapY1 - margin, Math.max(wrapY0 + margin, seat.eyeY - eyes.shiftY));
  const clampY = (y: number): number => Math.min(wrapY1, Math.max(wrapY0, y));

  const projectCylinder = (loop: Point3D[]): ProjectedPoint2D[] => {
    const pts: ProjectedPoint2D[] = [];
    for (const pt of loop) {
      const y = clampY(centerY + pt.y);
      const r = radiusAt ? radiusAt(y) : wrapR;
      const theta = Math.max(-2.6, Math.min(2.6, pt.x / Math.max(0.12, r)));
      let slope = 0;

      if (radiusAt) {
        const delta = 0.012;
        slope = -(radiusAt(Math.min(wrapY1, y + delta)) - radiusAt(Math.max(wrapY0, y - delta))) / (2 * delta);
      }

      const normal = ctx.rotate({ x: Math.sin(theta), y: slope, z: Math.cos(theta) });
      if (normal.z >= 0.05) {
        pts.push(ctx.project({ x: r * Math.sin(theta), y, z: r * Math.cos(theta) }));
      }
    }
    return pts;
  };

  const projectPuff = (loop: Point3D[]): ProjectedPoint2D[] => {
    if (!puffAt || loop.length === 0) return [];
    let avgX = 0;
    let avgY = 0;
    for (const pt of loop) {
      avgX += pt.x;
      avgY += pt.y;
    }
    const ball = puffAt(avgX / loop.length, clampY(centerY + avgY / loop.length));
    const forwardZ = ctx.rotate({ x: 0, y: 0, z: 1 }).z;
    const pts: ProjectedPoint2D[] = [];

    for (const pt of loop) {
      const dx = pt.x - ball.x;
      const dy = clampY(centerY + pt.y) - ball.y;
      const dist = Math.hypot(dx, dy);
      let phi = Math.min(dist / ball.r, Math.PI - 0.02);
      const uX = dist > 1e-9 ? dx / dist : 1;
      const uY = dist > 1e-9 ? dy / dist : 0;
      const tanZ = ctx.rotate({ x: uX, y: uY, z: 0 }).z;
      const dotZ = (p: number) => tanZ * Math.sin(p) + forwardZ * Math.cos(p);

      if (dotZ(phi) < 0.06 && forwardZ > 0.06) {
        let lo = 0;
        let hi = phi;
        for (let s = 0; s < 20; s++) {
          const mid = (lo + hi) / 2;
          if (dotZ(mid) >= 0.06) lo = mid;
          else hi = mid;
        }
        phi = lo;
      }

      const sinP = ball.r * Math.sin(phi);
      const normal = ctx.rotate({ x: uX * Math.sin(phi), y: uY * Math.sin(phi), z: Math.cos(phi) });
      if (normal.z >= 0.05) {
        pts.push(
          ctx.project({
            x: ball.x + uX * sinP,
            y: ball.y + uY * sinP,
            z: ball.z + ball.r * Math.cos(phi)
          })
        );
      }
    }

    return pts;
  };

  let minY = Infinity;
  let maxY = -Infinity;
  for (const loop of eyes.loops) {
    for (const pt of loop) {
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  let adjustY = 0;
  if (maxY - minY <= wrapY1 - wrapY0) {
    if (centerY + minY < wrapY0) adjustY = wrapY0 - (centerY + minY);
    else if (centerY + maxY > wrapY1) adjustY = wrapY1 - (centerY + maxY);
  }

  const adjustedLoops =
    adjustY === 0
      ? eyes.loops
      : eyes.loops.map((loop) => loop.map((pt) => ({ x: pt.x, y: pt.y + adjustY, z: pt.z })));

  const projectFn = puffAt ? projectPuff : projectCylinder;
  return adjustedLoops.map(projectFn).filter((loop) => loop.length > 2);
}

/**
 * Projects eyes onto a horizontal cylinder surface (seat.kind === 'wrapX', tablet)
 */
export function projectEyesWrapX(
  seat: EyeSeat & { kind: 'wrapX' },
  eyes: { loops: Point3D[][]; shiftY: number },
  ctx: ProjectionContext
): ProjectedPoint2D[][] {
  const { wrapR, wrapX0, wrapX1, radiusAtX } = seat;
  const centerAngle = Math.max(-2.4, Math.min(2.4, -eyes.shiftY / wrapR));

  let minX = Infinity;
  let maxX = -Infinity;
  for (const loop of eyes.loops) {
    for (const pt of loop) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
    }
  }

  let adjustX = 0;
  if (maxX - minX <= wrapX1 - wrapX0) {
    if (minX < wrapX0) adjustX = wrapX0 - minX;
    else if (maxX > wrapX1) adjustX = wrapX1 - maxX;
  }

  const adjustedLoops =
    adjustX === 0
      ? eyes.loops
      : eyes.loops.map((loop) => loop.map((pt) => ({ x: pt.x + adjustX, y: pt.y, z: pt.z })));

  return adjustedLoops
    .map((loop) => {
      const pts: ProjectedPoint2D[] = [];
      for (const pt of loop) {
        const x = Math.min(wrapX1, Math.max(wrapX0, pt.x));
        const r = radiusAtX(x);
        const theta = centerAngle + Math.max(-2.6, Math.min(2.6, pt.y / Math.max(0.12, wrapR)));
        const delta = 0.012;
        const slope = -(radiusAtX(Math.min(wrapX1, x + delta)) - radiusAtX(Math.max(wrapX0, x - delta))) / (2 * delta);

        const normal = ctx.rotate({ x: slope, y: Math.sin(theta), z: Math.cos(theta) });
        if (normal.z >= 0.05) {
          pts.push(ctx.project({ x, y: r * Math.sin(theta), z: r * Math.cos(theta) }));
        }
      }
      return pts;
    })
    .filter((loop) => loop.length > 2);
}

/**
 * Dispatches eye projection to the appropriate seating geometry
 */
export function projectEyesToSeat(
  seat: EyeSeat,
  eyes: { loops: Point3D[][]; shiftY: number },
  ctx: ProjectionContext
): ProjectedPoint2D[][] {
  switch (seat.kind) {
    case 'front':
      return projectEyesFront(seat.faceZ, eyes, ctx);
    case 'loft':
      return projectEyesLoft(seat.surfaceZ, eyes, ctx);
    case 'wrap':
      return projectEyesWrapY(seat, eyes, ctx);
    case 'wrapX':
      return projectEyesWrapX(seat, eyes, ctx);
    default:
      throw new Error(`projectEyesToSeat: unhandled seat kind ${(seat as any).kind}`);
  }
}

/**
 * Generates eye boundary loops from an expression state applied to a shape layout
 */
export function createEyeBoundaryLoops(
  shape: string,
  eyes: any[]
): { loops: Point3D[][]; shiftY: number } {
  const layout = SHAPE_EYE_LAYOUTS[shape] ?? { width: 0.22, height: 0.48, gap: 0.5, shiftY: 0 };
  const scaleW = layout.width / BASE_EYE_WIDTH;
  const scaleH = layout.height / BASE_EYE_HEIGHT;
  const scaleGap = layout.gap / BASE_EYE_GAP;

  const isSimpleOval = (e: any): boolean =>
    e && e.oval && e.oval[0] > 1e-4 && e.oval[1] > 1e-4 && (!e.fillRing || e.fillRing.length === 0);

  if (eyes.length === 2 && eyes.every(isSimpleOval)) {
    const eLeft = eyes[0];
    const eRight = eyes[1];

    const wL = (eLeft.oval[0] || 0) * scaleW;
    const hL = (eLeft.oval[1] || 0) * (eLeft.lidY || 1) * scaleW;
    const wR = (eRight.oval[0] || 0) * scaleW;
    const hR = (eRight.oval[1] || 0) * (eRight.lidY || 1) * scaleW;

    const rMinL = Math.max(0.01, Math.min(1, Math.min(wL, hL))) / 2;
    const rMaxL = Math.max(0.02, Math.min(1.8, Math.max(wL, hL))) / 2;
    const rMinR = Math.max(0.01, Math.min(1, Math.min(wR, hR))) / 2;
    const rMaxR = Math.max(0.02, Math.min(1.8, Math.max(wR, hR))) / 2;

    const gap = Math.max(0.05, Math.min(1.8, (BASE_EYE_GAP + (eLeft.off ? eLeft.off[0] : 0) + (eRight.off ? eRight.off[0] : 0)) * scaleGap));

    const sampleEllipse = (sign: number, minR: number, maxR: number, tiltDeg: number): Point3D[] => {
      const angle = -tiltDeg * DEG_TO_RAD;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const pts: Point3D[] = [];

      for (let i = 0; i < EYE_LOOP_POINTS; i++) {
        const theta = (TAU * i) / EYE_LOOP_POINTS;
        const px = sign * maxR * Math.cos(theta);
        const py = minR * Math.sin(theta);
        pts.push({
          x: px * cosA - py * sinA + (sign * gap) / 2,
          y: px * sinA + py * cosA,
          z: 0
        });
      }
      return pts;
    };

    const tiltL = (eLeft.tilt ? eLeft.tilt * (180 / Math.PI) : 0) + (wL >= hL ? 0 : 90);
    const tiltR = (eRight.tilt ? eRight.tilt * (180 / Math.PI) : 0) + (wR >= hR ? 0 : 90);

    return {
      loops: [sampleEllipse(-1, rMinL, rMaxL, -tiltL), sampleEllipse(1, rMinR, rMaxR, tiltR)],
      shiftY: layout.shiftY + (((eLeft.off ? eLeft.off[1] : 0) + (eRight.off ? eRight.off[1] : 0)) / 2) * scaleH
    };
  }

  // Complex eyelid / custom expression path
  const loops: Point3D[][] = [];
  eyes.forEach((eye, idx) => {
    if (!eye) return;
    const sign = idx === 0 ? -1 : 1;
    const lidY = eye.lidY || 1;
    const cosT = Math.cos(eye.tilt || 0);
    const sinT = Math.sin(eye.tilt || 0);
    const cx = sign * ((BASE_EYE_GAP / 2 + (eye.off ? eye.off[0] : 0)) * scaleGap);
    const cy = (eye.off ? eye.off[1] : 0) * scaleH;

    const transformPt = (x: number, y: number): Point3D => {
      const rx = x * cosT - y * sinT;
      const ry = x * sinT + y * cosT;
      return {
        x: cx + sign * rx * scaleW,
        y: cy + ry * scaleW * lidY,
        z: 0
      };
    };

    if (eye.fillRing && eye.fillRing.length >= 3) {
      const offX = eye.off ? eye.off[0] : 0;
      const offY = eye.off ? eye.off[1] : 0;
      loops.push(eye.fillRing.map(([x, y]: Point2D) => transformPt(x - offX, (y - offY) * lidY)));
      return;
    }

    if (isSimpleOval(eye)) {
      const pts: Point3D[] = [];
      for (let i = 0; i < 48; i++) {
        const theta = (TAU * i) / 48;
        pts.push(transformPt(eye.oval[0] * Math.cos(theta), eye.oval[1] * lidY * Math.sin(theta)));
      }
      loops.push(pts);
    }
  });

  return { loops, shiftY: 0 };
}

/**
 * Formats a list of polygon coordinate arrays into an SVG path string
 */
export function formatPolygonSvgPath(polygons: number[][]): string {
  let path = '';
  for (const poly of polygons) {
    if (poly.length < 4) continue;
    path += `M${round2(poly[0])} ${round2(poly[1])}`;
    for (let i = 2; i < poly.length; i += 2) {
      path += ` ${round2(poly[i])} ${round2(poly[i + 1])}`;
    }
    path += 'Z';
  }
  return path;
}

function round2(val: number): string {
  return String(Math.round(val * 100) / 100);
}

/**
 * 2D Graham Scan / Monotone Chain convex hull on projected screen coordinates
 */
export function convexHull2D(points: ProjectedPoint2D[]): ProjectedPoint2D[] {
  const valid = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) return valid;

  // Sort by X then Y
  valid.sort((a, b) => a.x - b.x || a.y - b.y);

  const cross = (o: ProjectedPoint2D, a: ProjectedPoint2D, b: ProjectedPoint2D): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: ProjectedPoint2D[] = [];
  for (const p of valid) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: ProjectedPoint2D[] = [];
  for (let i = valid.length - 1; i >= 0; i--) {
    const p = valid[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}
