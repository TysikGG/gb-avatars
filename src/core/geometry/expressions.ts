/**
 * Facial Expression Geometries & Eyelid Morph Definitions
 */

export const BASE_EYE_RADIUS = 0.26;
export const HALF_EYE_RADIUS = BASE_EYE_RADIUS / 2; // 0.1305
const CONTROL_POINT_COUNT = 18;

export interface RuntimeEyeSpec {
  off: [number, number];
  tilt: number;
  wid: number;
  lidY: number;
  oval: [number, number];
  ovalMix: number;
  pts: [number, number][];
  path: number[] | null;
  fillRing: [number, number][] | null;
}

export function sampleBezierSpine(ctrlPts: number[]): [number, number][] {
  const pts: [number, number][] = [];
  const sampleSegment = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    startIdx: number
  ) => {
    for (let i = startIdx; i < 11; i++) {
      const t = i / 10;
      const inv = 1 - t;
      const c0 = inv * inv * inv;
      const c1 = 3 * inv * inv * t;
      const c2 = 3 * inv * t * t;
      const c3 = t * t * t;
      pts.push([
        c0 * p0[0] + c1 * p1[0] + c2 * p2[0] + c3 * p3[0],
        c0 * p0[1] + c1 * p1[1] + c2 * p2[1] + c3 * p3[1]
      ]);
    }
  };

  const getPoint = (idx: number): [number, number] => [ctrlPts[idx * 6], ctrlPts[idx * 6 + 1]];
  const getHandle = (idx: number, isForward: boolean): [number, number] => {
    const offset = isForward ? 4 : 2;
    return [ctrlPts[idx * 6] + ctrlPts[idx * 6 + offset], ctrlPts[idx * 6 + 1] + ctrlPts[idx * 6 + offset + 1]];
  };

  sampleSegment(getPoint(0), getHandle(0, true), getHandle(1, false), getPoint(1), 0);
  sampleSegment(getPoint(1), getHandle(1, true), getHandle(2, false), getPoint(2), 1);
  return pts;
}

export function createBezierControlPoints(spec: {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  isArc: boolean;
}): number[] {
  const [x0, y0] = spec.p0;
  const [x1, y1] = spec.p1;
  const [x2, y2] = spec.p2;
  const u = Array(CONTROL_POINT_COUNT).fill(0);

  const setPos = (idx: number, p: [number, number]) => {
    u[idx * 6] = p[0];
    u[idx * 6 + 1] = p[1];
  };
  const setInHandle = (idx: number, p: [number, number]) => {
    u[idx * 6 + 2] = p[0] - u[idx * 6];
    u[idx * 6 + 3] = p[1] - u[idx * 6 + 1];
  };
  const setOutHandle = (idx: number, p: [number, number]) => {
    u[idx * 6 + 4] = p[0] - u[idx * 6];
    u[idx * 6 + 5] = p[1] - u[idx * 6 + 1];
  };

  if (spec.isArc) {
    const d = 2 * (x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1));
    if (Math.abs(d) > 1e-9) {
      const q0 = x0 * x0 + y0 * y0;
      const q1 = x1 * x1 + y1 * y1;
      const q2 = x2 * x2 + y2 * y2;
      const cx = (q0 * (y1 - y2) + q1 * (y2 - y0) + q2 * (y0 - y1)) / d;
      const cy = (q0 * (x2 - x1) + q1 * (x0 - x2) + q2 * (x1 - x0)) / d;
      const r = Math.hypot(x0 - cx, y0 - cy);
      const a0 = Math.atan2(y0 - cy, x0 - cx);
      const a2 = Math.atan2(y2 - cy, x2 - cx);
      const a1 = Math.atan2(y1 - cy, x1 - cx);
      const TAU = Math.PI * 2;
      const span = (a2 - a0 + TAU) % TAU;
      const finalSpan = (a1 - a0 + TAU) % TAU <= span ? span : span - TAU;
      const evalCircle = (ang: number): [number, number] => [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
      const evalTangent = (ang: number): [number, number] => [-Math.sin(ang), Math.cos(ang)];
      const halfSpan = finalSpan / 2;
      const handleLen = ((4 / 3) * Math.tan(halfSpan / 4)) * r;
      const angles = [a0, a0 + halfSpan, a0 + finalSpan];

      for (let i = 0; i < 3; i++) {
        const pt = evalCircle(angles[i]);
        const tan = evalTangent(angles[i]);
        setPos(i, pt);
        if (i > 0) setInHandle(i, [pt[0] - handleLen * tan[0], pt[1] - handleLen * tan[1]]);
        if (i < 2) setOutHandle(i, [pt[0] + handleLen * tan[0], pt[1] + handleLen * tan[1]]);
      }
      return u;
    }
    const mid: [number, number] = [(x0 + x2) / 2, (y0 + y2) / 2];
    setPos(0, [x0, y0]);
    setPos(1, mid);
    setPos(2, [x2, y2]);
    return u;
  }

  const m1: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const m2: [number, number] = [(x1 + x2) / 2, (y1 + y2) / 2];
  const mid: [number, number] = [(m1[0] + m2[0]) / 2, (m1[1] + m2[1]) / 2];

  setPos(0, [x0, y0]);
  setPos(1, mid);
  setPos(2, [x2, y2]);
  setOutHandle(0, [x0 + (2 / 3) * (m1[0] - x0), y0 + (2 / 3) * (m1[1] - y0)]);
  setInHandle(1, [mid[0] + (2 / 3) * (m1[0] - mid[0]), mid[1] + (2 / 3) * (m1[1] - mid[1])]);
  setOutHandle(1, [mid[0] + (2 / 3) * (m2[0] - mid[0]), mid[1] + (2 / 3) * (m2[1] - mid[1])]);
  setInHandle(2, [x2 + (2 / 3) * (m2[0] - x2), y2 + (2 / 3) * (m2[1] - y2)]);

  return u;
}

export function createRawEye(
  offset: [number, number],
  tiltRad: number,
  halfWidth: number,
  arcSpec: { p0: [number, number]; p1: [number, number]; p2: [number, number]; isArc: boolean },
  ovalRadii: [number, number]
): RuntimeEyeSpec {
  const ctrlPts = createBezierControlPoints(arcSpec);
  return {
    off: offset,
    tilt: tiltRad,
    wid: halfWidth,
    lidY: 1,
    oval: ovalRadii,
    ovalMix: 0,
    pts: sampleBezierSpine(ctrlPts),
    path: ctrlPts,
    fillRing: null
  };
}

export function createCapsuleEye(
  width: number,
  height: number,
  angleDeg: number,
  offset: [number, number],
  arcOffset: number
): RuntimeEyeSpec {
  const halfLen = Math.max(0, (height - width) / 2);
  const rad = (angleDeg * Math.PI) / 180;
  const sinA = Math.sin(rad) * halfLen;
  const cosA = Math.cos(rad) * halfLen;
  return createRawEye(
    offset,
    arcOffset,
    width / 2,
    { p0: [-sinA, -cosA], p1: [0, 0], p2: [sinA, cosA], isArc: false },
    [0, 0]
  );
}

export function createSymmetricEyes(eye: RuntimeEyeSpec): [RuntimeEyeSpec, RuntimeEyeSpec] {
  return [eye, eye];
}

/**
 * Exact analytical eye geometry pairs for all 9 avatar expressions
 */
export const RUNTIME_EXPRESSION_EYES: Record<string, [RuntimeEyeSpec, RuntimeEyeSpec]> = {
  neutral: createSymmetricEyes(createCapsuleEye(BASE_EYE_RADIUS, 0.57, 0, [0, 0], 0)),
  happy: createSymmetricEyes(
    createRawEye(
      [0.03, 0.03],
      0,
      HALF_EYE_RADIUS,
      { p0: [0.16, -0.04], p1: [0, 0.12], p2: [-0.16, -0.04], isArc: true },
      [0, 0]
    )
  ),
  surprised: createSymmetricEyes(createCapsuleEye(0.42, 0.86, 0, [0.03, 0], 0)),
  inspecting: [
    createCapsuleEye(0.54, 0.54, 0, [0.04, 0], 0),
    createCapsuleEye(0.36, 0.36, 0, [0.04, 0], 0)
  ],
  sad: createSymmetricEyes(createCapsuleEye(BASE_EYE_RADIUS, 0.5, -28, [-0.05, 0], 0)),
  sleepy: createSymmetricEyes(
    createRawEye(
      [0.01, 0],
      0,
      HALF_EYE_RADIUS,
      { p0: [-0.11, 0.025], p1: [0, -0.05], p2: [0.11, 0.025], isArc: false },
      [0, 0]
    )
  ),
  squinted: createSymmetricEyes(createCapsuleEye(BASE_EYE_RADIUS, 0.5, 90, [0.01, 0], 0)),
  calm: createSymmetricEyes(
    createRawEye(
      [0.05, 0],
      0,
      0.247,
      { p0: [-0.296, 0], p1: [0, 0], p2: [0.296, 0], isArc: false },
      [0.296, 0.247]
    )
  ),
  confused: createSymmetricEyes(
    createRawEye(
      [-0.1, 0],
      0,
      HALF_EYE_RADIUS,
      { p0: [0.01, 0.16], p1: [-0.17, 0], p2: [0.01, -0.16], isArc: false },
      [0, 0]
    )
  )
};

export interface EyeCutArc {
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  isArc: boolean;
}

export interface EyeShapeDef {
  kind: 'slit' | 'arc' | 'capsule';
  width: number;
  height: number;
  angleDeg?: number;
  offsetY?: number;
  arc?: EyeCutArc;
}

export interface ExpressionGeometry {
  left: EyeShapeDef;
  right: EyeShapeDef;
}

/**
 * Procedural geometric definitions for all 9 avatar expressions
 */
export const EXPRESSION_SPECS: Record<string, ExpressionGeometry> = {
  neutral: {
    left: { kind: 'capsule', width: BASE_EYE_RADIUS, height: 0.57, offsetY: 0 },
    right: { kind: 'capsule', width: BASE_EYE_RADIUS, height: 0.57, offsetY: 0 }
  },
  happy: {
    left: {
      kind: 'arc',
      width: 0.03,
      height: 0.03,
      arc: { p0: [0.16, -0.04], p1: [0, 0.12], p2: [-0.16, -0.04], isArc: true }
    },
    right: {
      kind: 'arc',
      width: 0.03,
      height: 0.03,
      arc: { p0: [0.16, -0.04], p1: [0, 0.12], p2: [-0.16, -0.04], isArc: true }
    }
  },
  surprised: {
    left: { kind: 'capsule', width: 0.42, height: 0.86, offsetY: 0.03 },
    right: { kind: 'capsule', width: 0.42, height: 0.86, offsetY: 0.03 }
  },
  inspecting: {
    left: { kind: 'capsule', width: 0.54, height: 0.54, offsetY: 0.04 },
    right: { kind: 'capsule', width: 0.36, height: 0.36, offsetY: 0.04 }
  },
  sad: {
    left: { kind: 'slit', width: BASE_EYE_RADIUS, height: 0.5, angleDeg: -28, offsetY: -0.05 },
    right: { kind: 'slit', width: BASE_EYE_RADIUS, height: 0.5, angleDeg: -28, offsetY: -0.05 }
  },
  sleepy: {
    left: {
      kind: 'arc',
      width: 0.01,
      height: 0,
      arc: { p0: [-0.11, 0.025], p1: [0, -0.05], p2: [0.11, 0.025], isArc: false }
    },
    right: {
      kind: 'arc',
      width: 0.01,
      height: 0,
      arc: { p0: [-0.11, 0.025], p1: [0, -0.05], p2: [0.11, 0.025], isArc: false }
    }
  },
  squinted: {
    left: { kind: 'slit', width: BASE_EYE_RADIUS, height: 0.5, angleDeg: 90, offsetY: 0.01 },
    right: { kind: 'slit', width: BASE_EYE_RADIUS, height: 0.5, angleDeg: 90, offsetY: 0.01 }
  },
  calm: {
    left: { kind: 'capsule', width: 0.296, height: 0.247, offsetY: 0.05 },
    right: { kind: 'capsule', width: 0.296, height: 0.247, offsetY: 0.05 }
  },
  confused: {
    left: {
      kind: 'arc',
      width: -0.1,
      height: 0,
      arc: { p0: [0.01, 0.16], p1: [-0.17, 0], p2: [0.01, -0.16], isArc: false }
    },
    right: {
      kind: 'arc',
      width: -0.1,
      height: 0,
      arc: { p0: [0.01, 0.16], p1: [-0.17, 0], p2: [0.01, -0.16], isArc: false }
    }
  }
};
