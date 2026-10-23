/**
 * 2D Avatar Silhouette Contours & SVG Path Analytical Sampler
 *
 * Provides analytical mathematical curves (superellipses, polar metaballs,
 * rounded polygons, and smooth Bezier splines) for all 26 avatar geometries.
 */

export const CANONICAL_CENTER = 114.2705; // Canonical center coordinate B in 228.541 coordinate space
const TAU = Math.PI * 2;
const SVG_VIEW_SPAN = 228.44;

export type Point2D = [number, number];

export interface SilhouetteSpans {
  top: number;
  bottom: number;
  spanAt: (y: number) => [number, number];
  outerAt: (y: number) => [number, number];
}

export interface AnalyzedPath {
  path: string;
  ring: Point2D[];
  top: number;
  bottom: number;
  spanAt: (y: number) => [number, number];
  beltRadius: number;
}

/**
 * Rounds a number to 2 decimal places for clean SVG output
 */
export function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Clamps value between min and max
 */
export function clampNum(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

/**
 * SVG Path Builder helper class for constructing clean path strings
 */
export class SvgPathBuilder {
  private d = '';

  move(x: number, y: number): this {
    this.d += `M${round2(x)} ${round2(y)}`;
    return this;
  }

  line(x: number, y: number): this {
    this.d += `L${round2(x)} ${round2(y)}`;
    return this;
  }

  curve(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this {
    this.d += `C${round2(cp1x)} ${round2(cp1y)} ${round2(cp2x)} ${round2(cp2y)} ${round2(x)} ${round2(y)}`;
    return this;
  }

  corner(prev: Point2D, curr: Point2D, next: Point2D, radius: number): this {
    const dir = (p1: Point2D, p0: Point2D): [number, number] => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1;
      return [dx / len, dy / len];
    };

    const dIn = dir(prev, curr);
    const dOut = dir(next, curr);

    const start: Point2D = [curr[0] + dIn[0] * radius, curr[1] + dIn[1] * radius];
    const end: Point2D = [curr[0] + dOut[0] * radius, curr[1] + dOut[1] * radius];

    if (this.d) {
      this.line(start[0], start[1]);
    } else {
      this.move(start[0], start[1]);
    }

    this.d += `Q${round2(curr[0])} ${round2(curr[1])} ${round2(end[0])} ${round2(end[1])}`;
    return this;
  }

  arc(cx: number, cy: number, rx: number, ry: number, startAngle: number, endAngle: number): this {
    const segments = Math.max(1, Math.ceil(Math.abs(endAngle - startAngle) / (Math.PI / 2)));
    const step = (endAngle - startAngle) / segments;
    const k = (4 / 3) * Math.tan(step / 4);
    let cur = startAngle;

    for (let i = 0; i < segments; i++) {
      const next = cur + step;
      const p0: Point2D = [cx + rx * Math.cos(cur), cy + ry * Math.sin(cur)];
      const p1: Point2D = [cx + rx * Math.cos(next), cy + ry * Math.sin(next)];

      this.curve(
        p0[0] - k * rx * Math.sin(cur),
        p0[1] + k * ry * Math.cos(cur),
        p1[0] + k * rx * Math.sin(next),
        p1[1] - k * ry * Math.cos(next),
        p1[0],
        p1[1]
      );
      cur = next;
    }
    return this;
  }

  close(): string {
    return this.d + 'Z';
  }
}

/**
 * Converts a sequence of 2D points into a closed Catmull-Rom cubic Bezier path
 */
export function catmullRomToBezier(points: Point2D[]): string {
  const len = points.length;
  let d = `M${round2(points[0][0])} ${round2(points[0][1])}`;

  for (let i = 0; i < len; i++) {
    const pPrev = points[(i - 1 + len) % len];
    const pCurr = points[i];
    const pNext = points[(i + 1) % len];
    const pNext2 = points[(i + 2) % len];

    const cp1x = pCurr[0] + (pNext[0] - pPrev[0]) / 6;
    const cp1y = pCurr[1] + (pNext[1] - pPrev[1]) / 6;
    const cp2x = pNext[0] - (pNext2[0] - pCurr[0]) / 6;
    const cp2y = pNext[1] - (pNext2[1] - pCurr[1]) / 6;

    d += `C${round2(cp1x)} ${round2(cp1y)} ${round2(cp2x)} ${round2(cp2y)} ${round2(pNext[0])} ${round2(pNext[1])}`;
  }

  return d + 'Z';
}

/**
 * Samples a continuous polar function at regular angular increments and builds a smooth Bezier path
 */
export function samplePolarSpline(fn: (theta: number) => Point2D, samples: number = 128): string {
  const pts: Point2D[] = [];
  for (let i = 0; i < samples; i++) {
    pts.push(fn((i / samples) * TAU));
  }
  return catmullRomToBezier(pts);
}

/**
 * Constructs a polygon with rounded corners
 */
export function createRoundedPolygon(vertices: Point2D[], radius: number | number[]): string {
  const builder = new SvgPathBuilder();
  const len = vertices.length;

  for (let i = 0; i < len; i++) {
    const r = typeof radius === 'number' ? radius : radius[i % radius.length];
    builder.corner(vertices[(i - 1 + len) % len], vertices[i], vertices[(i + 1) % len], r);
  }

  return builder.close();
}

/**
 * Regular n-gon with rounded corners
 */
export function createRegularPolygon(
  radius: number,
  sides: number,
  cornerRadius: number | number[],
  rotation: number = 0
): string {
  const vertices: Point2D[] = Array.from({ length: sides }, (_, i) => {
    const theta = rotation + (i / sides) * TAU;
    return [CANONICAL_CENTER + Math.cos(theta) * radius, CANONICAL_CENTER + Math.sin(theta) * radius];
  });
  return createRoundedPolygon(vertices, cornerRadius);
}

/**
 * Union of circles / metaballs sampled into a continuous contour (cloud, clover)
 */
export function createCircleMetaballs(
  circles: [x: number, y: number, r: number][],
  samples: number = 160
): string {
  return samplePolarSpline((theta) => {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    let maxDist = 0;

    for (const [cx, cy, radius] of circles) {
      const dx = cx - CANONICAL_CENTER;
      const dy = cy - CANONICAL_CENTER;
      const proj = cosT * dx + sinT * dy;
      const discr = proj * proj - (dx * dx + dy * dy) + radius * radius;
      if (discr <= 0) continue;
      const dist = proj + Math.sqrt(discr);
      if (dist > maxDist) maxDist = dist;
    }

    return [CANONICAL_CENTER + cosT * maxDist, CANONICAL_CENTER + sinT * maxDist];
  }, samples);
}

/**
 * Lamé curve / Superellipse (squircle, gem)
 * |x/a|^n + |y/b|^n = 1
 */
export function createSuperellipse(rx: number, ry: number, power: number): string {
  return samplePolarSpline((theta) => {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const exp = 2 / power;
    return [
      CANONICAL_CENTER + Math.sign(cosT) * Math.pow(Math.abs(cosT), exp) * rx,
      CANONICAL_CENTER + Math.sign(sinT) * Math.pow(Math.abs(sinT), exp) * ry
    ];
  });
}

/**
 * Tablet / Rounded stadium shape
 */
export function createTabletContour(rx: number, ry: number): string {
  return new SvgPathBuilder()
    .move(CANONICAL_CENTER - rx + ry, CANONICAL_CENTER - ry)
    .line(CANONICAL_CENTER + rx - ry, CANONICAL_CENTER - ry)
    .arc(CANONICAL_CENTER + rx - ry, CANONICAL_CENTER, ry, ry, -Math.PI / 2, Math.PI / 2)
    .line(CANONICAL_CENTER - rx + ry, CANONICAL_CENTER + ry)
    .arc(CANONICAL_CENTER - rx + ry, CANONICAL_CENTER, ry, ry, Math.PI / 2, (Math.PI * 3) / 2)
    .close();
}

/**
 * Capsule shape
 */
export function createCapsuleContour(rx: number, ry: number): string {
  return new SvgPathBuilder()
    .move(CANONICAL_CENTER - rx, CANONICAL_CENTER + ry - rx)
    .line(CANONICAL_CENTER - rx, CANONICAL_CENTER - ry + rx)
    .arc(CANONICAL_CENTER, CANONICAL_CENTER - ry + rx, rx, rx, Math.PI, TAU)
    .line(CANONICAL_CENTER + rx, CANONICAL_CENTER + ry - rx)
    .arc(CANONICAL_CENTER, CANONICAL_CENTER + ry - rx, rx, rx, 0, Math.PI)
    .close();
}

/**
 * Cylinder shape with rounded caps
 */
export function createCylinderContour(rx: number, ry: number, capR: number): string {
  return new SvgPathBuilder()
    .move(CANONICAL_CENTER - rx, CANONICAL_CENTER - ry + capR)
    .arc(CANONICAL_CENTER, CANONICAL_CENTER - ry + capR, rx, capR, Math.PI, TAU)
    .line(CANONICAL_CENTER + rx, CANONICAL_CENTER + ry - capR)
    .arc(CANONICAL_CENTER, CANONICAL_CENTER + ry - capR, rx, capR, 0, Math.PI)
    .close();
}

/**
 * Dome shape
 */
export function createDomeContour(rx: number, ry: number, cornerR: number): string {
  const bottomY = CANONICAL_CENTER + ry;
  return new SvgPathBuilder()
    .move(CANONICAL_CENTER - rx, bottomY - cornerR)
    .arc(CANONICAL_CENTER, bottomY - cornerR, rx, 2 * ry - cornerR, Math.PI, TAU)
    .line(CANONICAL_CENTER + rx, bottomY - cornerR)
    .curve(CANONICAL_CENTER + rx, bottomY, CANONICAL_CENTER + rx, bottomY, CANONICAL_CENTER + rx - cornerR, bottomY)
    .line(CANONICAL_CENTER - rx + cornerR, bottomY)
    .curve(CANONICAL_CENTER - rx, bottomY, CANONICAL_CENTER - rx, bottomY, CANONICAL_CENTER - rx, bottomY - cornerR)
    .close();
}

/**
 * Arch shape
 */
export function createArchContour(rx: number, ry: number, cornerR: number): string {
  const bottomY = CANONICAL_CENTER + ry;
  const topY = CANONICAL_CENTER - ry + rx;
  return new SvgPathBuilder()
    .move(CANONICAL_CENTER - rx, topY)
    .arc(CANONICAL_CENTER, topY, rx, rx, Math.PI, TAU)
    .line(CANONICAL_CENTER + rx, bottomY - cornerR)
    .curve(CANONICAL_CENTER + rx, bottomY, CANONICAL_CENTER + rx, bottomY, CANONICAL_CENTER + rx - cornerR, bottomY)
    .line(CANONICAL_CENTER - rx + cornerR, bottomY)
    .curve(CANONICAL_CENTER - rx, bottomY, CANONICAL_CENTER - rx, bottomY, CANONICAL_CENTER - rx, bottomY - cornerR)
    .close();
}

/**
 * Shield shape
 */
export function createShieldContour(rx: number, ry: number, waist: number): string {
  const topY = CANONICAL_CENTER - ry;
  const bottomY = CANONICAL_CENTER + ry;
  return new SvgPathBuilder()
    .move(CANONICAL_CENTER - rx, topY + waist)
    .curve(CANONICAL_CENTER - rx, topY - 2, CANONICAL_CENTER - rx * 0.5, topY - 10, CANONICAL_CENTER, topY - 10)
    .curve(CANONICAL_CENTER + rx * 0.5, topY - 10, CANONICAL_CENTER + rx, topY - 2, CANONICAL_CENTER + rx, topY + waist)
    .curve(CANONICAL_CENTER + rx, CANONICAL_CENTER + ry * 0.42, CANONICAL_CENTER + rx * 0.62, bottomY, CANONICAL_CENTER, bottomY)
    .curve(CANONICAL_CENTER - rx * 0.62, bottomY, CANONICAL_CENTER - rx, CANONICAL_CENTER + ry * 0.42, CANONICAL_CENTER - rx, topY + waist)
    .close();
}

/**
 * Egg shape (vertically tapered)
 */
export function createEggContour(rx: number, ry: number, taper: number): string {
  return samplePolarSpline((theta) => {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const factor = (1 - sinT) / 2;
    return [CANONICAL_CENTER + cosT * rx * (1 - taper * factor * factor), CANONICAL_CENTER + sinT * ry];
  });
}

/**
 * Teardrop contour
 */
export function createTeardropContour(rx: number, ry: number, tipY: number, cornerR: number): string {
  const clampedRatio = clampNum(rx / (tipY - ry), -1, 1);
  const cosRatio = Math.sqrt(1 - clampedRatio * clampedRatio);
  const pRight: Point2D = [CANONICAL_CENTER + rx * cosRatio, tipY - rx * clampedRatio];
  const pLeft: Point2D = [CANONICAL_CENTER - rx * cosRatio, tipY - rx * clampedRatio];
  const angle = Math.atan2(pRight[1] - tipY, pRight[0] - CANONICAL_CENTER);

  return new SvgPathBuilder()
    .corner(pRight, [CANONICAL_CENTER, ry], pLeft, cornerR)
    .line(pLeft[0], pLeft[1])
    .arc(CANONICAL_CENTER, tipY, rx, rx, Math.PI - angle, angle)
    .close();
}

/**
 * House contour
 */
export function createHouseContour(rx: number, ry: number, roofH: number, cornerR: number): string {
  return createRoundedPolygon(
    [
      [CANONICAL_CENTER - rx, CANONICAL_CENTER + ry],
      [CANONICAL_CENTER + rx, CANONICAL_CENTER + ry],
      [CANONICAL_CENTER + rx, CANONICAL_CENTER - ry + roofH],
      [CANONICAL_CENTER, CANONICAL_CENTER - ry],
      [CANONICAL_CENTER - rx, CANONICAL_CENTER - ry + roofH]
    ],
    cornerR
  );
}

/**
 * Leaf contour
 */
export function createLeafContour(rx: number, ry: number, power: number): string {
  return samplePolarSpline((theta) => {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    return [
      CANONICAL_CENTER + cosT * rx * Math.pow(Math.max(1 - sinT * sinT, 0), power / 2 - 0.5),
      CANONICAL_CENTER + sinT * ry
    ];
  });
}

/**
 * Kidney bean contour
 */
export function createBeanContour(rx: number, ry: number, dent: number, angle: number): string {
  return samplePolarSpline((theta) => {
    const gaussian = (mean: number): number => {
      const diff = Math.abs((((theta - mean + Math.PI) % TAU) + TAU) % TAU - Math.PI);
      return Math.exp(-(diff * diff) / 0.4232);
    };
    const mod = 1 - dent * gaussian(angle) + dent * 0.34 * gaussian(angle + Math.PI);
    return [CANONICAL_CENTER + Math.cos(theta) * rx * mod, CANONICAL_CENTER + Math.sin(theta) * ry * mod];
  });
}

/**
 * Pebble contour with harmonic perturbation
 */
export function createPebbleContour(radius: number, noise: number, eccentricity: number): string {
  return samplePolarSpline((theta) => {
    const r = radius * (1 + noise * (Math.sin(theta * 2 + eccentricity) * 0.6 + Math.sin(theta * 3 - eccentricity) * 0.4));
    return [CANONICAL_CENTER + Math.cos(theta) * r, CANONICAL_CENTER + Math.sin(theta) * r * 0.98];
  });
}

/**
 * Static high-precision Bezier paths for heart, sparkle, and 6-point star
 */
export const HEART_PATH =
  'M79.4511 11.5693C94.8767 -3.85636 119.887 -3.85622 135.312 11.5693C150.738 26.995 150.738 52.0049 135.312 67.4306L129.302 73.4404L129.303 73.4414L83.7724 118.972C81.8111 120.933 79.4309 122.22 76.9199 122.833C76.463 122.944 76.0018 123.034 75.538 123.101C74.1477 123.301 72.734 123.301 71.3437 123.101C70.8802 123.034 70.4194 122.944 69.9628 122.833C69.8486 122.805 69.7347 122.776 69.621 122.745C69.3938 122.684 69.1679 122.616 68.9433 122.544C67.4837 122.073 66.0831 121.367 64.8017 120.426C64.6047 120.281 64.4108 120.13 64.2197 119.975C63.837 119.662 63.466 119.328 63.1093 118.972L11.5693 67.4306C-3.85643 52.0049 -3.85642 26.995 11.5693 11.5693C26.995 -3.85643 52.0049 -3.85643 67.4306 11.5693L73.4404 17.579L79.4511 11.5693Z';

export const STAR6_PATH =
  'M58.9438 9.25323C63.2492 -3.08441 80.6974 -3.08441 85.0027 9.25322L91.7612 28.6207C94.0136 35.0751 100.652 38.9078 107.368 37.6311L127.52 33.8004C140.357 31.3602 149.081 46.4708 140.549 56.3681L127.156 71.9049C122.692 77.0827 122.692 84.748 127.156 89.9258L140.549 105.463C149.081 115.36 140.357 130.471 127.52 128.03L107.368 124.2C100.652 122.923 94.0136 126.756 91.7612 133.21L85.0027 152.577C80.6974 164.915 63.2492 164.915 58.9438 152.577L52.1853 133.21C49.933 126.756 43.2946 122.923 36.5788 124.2L16.4268 128.03C3.58942 130.471 -5.1347 115.36 3.39733 105.463L16.7908 89.9258C21.2543 84.748 21.2543 77.0827 16.7908 71.9049L3.39734 56.3681C-5.13469 46.4708 3.58941 31.3602 16.4268 33.8004L36.5787 37.6311C43.2946 38.9078 49.933 35.0751 52.1853 28.6207L58.9438 9.25323Z';

export const SPARKLE_PATH =
  'M93.9365 0.100586C98.4439 -0.387322 102.691 0.897134 106.341 4.03418C111.502 8.47087 114.842 16.0545 116.636 25.2725C118.36 34.1341 118.716 44.8177 117.701 56.4346L117.707 56.4375L117.706 56.4443C122.25 58.5638 126.519 60.8171 130.449 63.168C130.485 63.1891 130.52 63.2103 130.556 63.2314C131.25 63.6478 131.934 64.067 132.607 64.4893C132.68 64.5349 132.753 64.5813 132.825 64.627C133.074 64.7838 133.322 64.941 133.567 65.0986C133.692 65.1787 133.816 65.2596 133.94 65.3398C134.138 65.4676 134.335 65.5954 134.53 65.7236C134.653 65.8039 134.775 65.8844 134.896 65.9648C135.112 66.1073 135.325 66.2506 135.538 66.3936C135.637 66.46 135.736 66.5269 135.834 66.5947C136.216 66.8576 136.592 67.1256 136.96 67.3994C137.009 67.4358 137.057 67.4729 137.106 67.5098C137.289 67.6496 137.471 67.7909 137.65 67.9336C137.915 68.1436 138.175 68.3575 138.432 68.5732C138.513 68.6413 138.594 68.7099 138.674 68.7793C138.973 69.0375 139.266 69.3005 139.552 69.5684C139.638 69.6495 139.724 69.7314 139.809 69.8135C140.098 70.0924 140.378 70.3776 140.648 70.667C140.732 70.7573 140.814 70.8484 140.896 70.9395C141.173 71.2494 141.439 71.5671 141.692 71.8906C141.748 71.9613 141.802 72.0332 141.856 72.1045C142.062 72.3797 142.257 72.6612 142.441 72.9463C142.493 73.0256 142.544 73.1054 142.593 73.1855C142.748 73.4385 142.893 73.6967 143.028 73.958C143.076 74.0507 143.123 74.1436 143.167 74.2373C143.34 74.5985 143.493 74.9697 143.626 75.3486C143.653 75.4243 143.678 75.5007 143.702 75.5771C143.834 75.9984 143.939 76.4314 144.015 76.874C144.024 76.9248 144.032 76.9757 144.039 77.0264C144.113 77.5358 144.146 78.0645 144.137 78.6084C144.116 79.8703 143.754 81.1691 142.923 82.3535C142.868 82.4323 142.809 82.5098 142.747 82.5859C142.666 82.6865 142.578 82.7844 142.484 82.8799C142.368 82.9981 142.245 83.1118 142.114 83.2207C141.815 83.4697 141.472 83.6841 141.096 83.8643C139.73 84.5186 137.915 84.8027 135.405 84.7705C135.234 84.7681 135.063 84.7635 134.892 84.7578C134.665 84.7508 134.437 84.7431 134.209 84.7314C133.737 84.7071 133.262 84.6738 132.784 84.6299C132.678 84.62 132.571 84.6094 132.464 84.5986C129.904 84.3414 127.284 83.9482 124.619 83.3936C117.433 99.0718 108.975 110.884 100.525 117.551C96.149 121.004 91.643 123.189 87.2158 123.689C82.7077 124.204 78.4616 122.946 74.8115 119.827C69.6469 115.405 66.3051 107.828 64.5088 98.6084C62.7834 89.737 62.4277 79.0371 63.4443 67.4043L63.4385 67.4014L63.4395 67.3945C58.8899 65.2711 54.6152 63.0117 50.6807 60.6553C50.6455 60.6342 50.6105 60.6133 50.5752 60.5928C49.882 60.1764 49.1979 59.7573 48.5254 59.335C48.4526 59.2892 48.38 59.2435 48.3076 59.1973C48.0583 59.0405 47.8105 58.8833 47.5654 58.7256C47.4411 58.6455 47.3164 58.565 47.1924 58.4844C46.9947 58.3567 46.7974 58.2289 46.6025 58.1006C46.4795 58.0202 46.3571 57.9398 46.2363 57.8594C46.0207 57.7169 45.8075 57.5736 45.5947 57.4307C45.4958 57.3643 45.3976 57.2974 45.2998 57.2295C44.9179 56.9666 44.5417 56.6987 44.1738 56.4248C44.1245 56.3884 44.0768 56.3512 44.0283 56.3145C43.8447 56.1746 43.6635 56.0333 43.4844 55.8906C43.2197 55.6806 42.9598 55.4667 42.7031 55.251C42.6223 55.183 42.5414 55.1143 42.4619 55.0449C42.1633 54.7867 41.8702 54.5238 41.584 54.2559C41.4984 54.1748 41.4121 54.0929 41.3271 54.0107C41.0379 53.7319 40.7576 53.4466 40.4883 53.1572C40.4042 53.067 40.3218 52.9758 40.2393 52.8848C39.963 52.5748 39.6966 52.2571 39.4443 51.9336C39.3879 51.8629 39.3333 51.791 39.2793 51.7197C39.0736 51.4445 38.8784 51.1631 38.6943 50.8779C38.643 50.7986 38.5919 50.7188 38.543 50.6387C38.3873 50.3857 38.2429 50.1275 38.1074 49.8662C38.0594 49.7735 38.0125 49.6806 37.9678 49.5869C37.7951 49.2257 37.6425 48.8545 37.5098 48.4756C37.4828 48.3999 37.4573 48.3235 37.4326 48.2471C37.3006 47.8257 37.1953 47.3928 37.1191 46.9502C37.1107 46.8994 37.1023 46.8485 37.0947 46.7979C37.0211 46.2885 36.9886 45.7598 36.9971 45.2158C37.0184 43.9539 37.3807 42.6552 38.2119 41.4707C38.2673 41.3919 38.3262 41.3144 38.3877 41.2383C38.4687 41.1377 38.5574 41.0398 38.6514 40.9443C38.7674 40.8261 38.8905 40.7125 39.0215 40.6035C39.3204 40.3545 39.6631 40.1401 40.0391 39.9599C41.4052 39.3056 43.2198 39.0215 45.7295 39.0537C45.9009 39.0561 46.0718 39.0607 46.2432 39.0664C46.4698 39.0734 46.6974 39.0811 46.9248 39.0928C47.3976 39.1171 47.8727 39.1504 48.3496 39.1943C48.4559 39.2042 48.5623 39.2148 48.6689 39.2256C51.229 39.4828 53.849 39.876 56.5137 40.4307C63.7001 24.7524 72.1583 12.9404 80.6074 6.27344C84.9842 2.82078 89.4902 0.635395 93.9179 0.135742Z';

/**
 * Registry of 2D silhouette path generators for all shapes
 */
export const SHAPE_CONTOURS: Record<string, () => string> = {
  square: () =>
    createRoundedPolygon(
      [
        [CANONICAL_CENTER - 107, CANONICAL_CENTER - 107],
        [CANONICAL_CENTER + 107, CANONICAL_CENTER - 107],
        [CANONICAL_CENTER + 107, CANONICAL_CENTER + 107],
        [CANONICAL_CENTER - 107, CANONICAL_CENTER + 107]
      ],
      28
    ),
  pebble: () => createPebbleContour(108, 0.075, 1.1),
  bean: () => createBeanContour(94, 112, 0.34, Math.PI),
  egg: () => createEggContour(98, 113, 0.22),
  squircle: () => createSuperellipse(107, 107, 3.2),
  tablet: () => createTabletContour(114, 74),
  capsule: () => createCapsuleContour(72, 113),
  cylinder: () => createCylinderContour(94, 110, 48),
  hex: () => createRegularPolygon(114, 6, 20, Math.PI / 6),
  gem: () => createSuperellipse(112, 113, 1.5),
  shield: () => createShieldContour(98, 108, 30),
  dome: () => createDomeContour(114, 82, 26),
  arch: () => createArchContour(76, 113, 42),
  cloud: () =>
    createCircleMetaballs([
      [CANONICAL_CENTER - 62, CANONICAL_CENTER + 26, 56],
      [CANONICAL_CENTER + 62, CANONICAL_CENTER + 26, 54],
      [CANONICAL_CENTER, CANONICAL_CENTER + 34, 62],
      [CANONICAL_CENTER - 24, CANONICAL_CENTER - 30, 62],
      [CANONICAL_CENTER + 38, CANONICAL_CENTER - 26, 54]
    ]),
  leaf: () => createLeafContour(88, 113, 1.5),
  clover: () =>
    createCircleMetaballs([
      [CANONICAL_CENTER - 38, CANONICAL_CENTER - 38, 58],
      [CANONICAL_CENTER + 38, CANONICAL_CENTER - 38, 58],
      [CANONICAL_CENTER + 38, CANONICAL_CENTER + 38, 58],
      [CANONICAL_CENTER - 38, CANONICAL_CENTER + 38, 58]
    ]),
  house: () => createHouseContour(100, 110, 78, 29),
  teardrop: () => createTeardropContour(88, CANONICAL_CENTER - 114, CANONICAL_CENTER + 26, 48),
  wedge: () => createRegularPolygon(130, 3, [80, 60, 60], -Math.PI / 2),
  heart: () => HEART_PATH,
  sparkle: () => SPARKLE_PATH,
  star6: () => STAR6_PATH
};

/**
 * Samples SVG path string commands (M, L, Q, C, Z) into a discrete polygon ring
 *
 * @param path - SVG path d string
 * @param maxSegmentLength - Maximum segment length for curve subdivisions
 */
export function sampleSvgPath(path: string, maxSegmentLength: number = 4): Point2D[] {
  const tokens = path.match(/[MLCQZmlcqz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const points: Point2D[] = [];
  let index = 0;
  let cmd = '';
  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;

  const nextNum = (): number => parseFloat(tokens[index++]);

  const subdivide = (evalFn: (t: number) => Point2D, approxLen: number) => {
    const steps = Math.max(2, Math.ceil(approxLen / maxSegmentLength));
    for (let s = 1; s <= steps; s++) {
      points.push(evalFn(s / steps));
    }
  };

  while (index < tokens.length) {
    if (/[a-z]/i.test(tokens[index])) {
      cmd = tokens[index++].toUpperCase();
    }

    if (cmd === 'Z') {
      const dist = Math.hypot(startX - curX, startY - curY);
      if (dist > 0.01) {
        subdivide((t) => [curX + (startX - curX) * t, curY + (startY - curY) * t], dist);
      }
      curX = startX;
      curY = startY;
      continue;
    }

    if (index >= tokens.length) break;

    if (cmd === 'M') {
      curX = nextNum();
      curY = nextNum();
      startX = curX;
      startY = curY;
      points.push([curX, curY]);
      cmd = 'L';
    } else if (cmd === 'L') {
      const targetX = nextNum();
      const targetY = nextNum();
      const dist = Math.hypot(targetX - curX, targetY - curY);
      subdivide((t) => [curX + (targetX - curX) * t, curY + (targetY - curY) * t], dist);
      curX = targetX;
      curY = targetY;
    } else if (cmd === 'Q') {
      const cpx = nextNum();
      const cpy = nextNum();
      const targetX = nextNum();
      const targetY = nextNum();
      const p0x = curX;
      const p0y = curY;
      const approxDist = Math.hypot(cpx - p0x, cpy - p0y) + Math.hypot(targetX - cpx, targetY - cpy);

      subdivide((t) => {
        const inv = 1 - t;
        return [
          inv * inv * p0x + 2 * inv * t * cpx + t * t * targetX,
          inv * inv * p0y + 2 * inv * t * cpy + t * t * targetY
        ];
      }, approxDist);

      curX = targetX;
      curY = targetY;
    } else {
      // Cubic Bezier 'C'
      const cp1x = nextNum();
      const cp1y = nextNum();
      const cp2x = nextNum();
      const cp2y = nextNum();
      const targetX = nextNum();
      const targetY = nextNum();
      const p0x = curX;
      const p0y = curY;
      const approxDist =
        Math.hypot(cp1x - p0x, cp1y - p0y) +
        Math.hypot(cp2x - cp1x, cp2y - cp1y) +
        Math.hypot(targetX - cp2x, targetY - cp2y);

      subdivide((t) => {
        const inv = 1 - t;
        const inv2 = inv * inv;
        const inv3 = inv2 * inv;
        const t2 = t * t;
        const t3 = t2 * t;
        return [
          inv3 * p0x + 3 * inv2 * t * cp1x + 3 * inv * t2 * cp2x + t3 * targetX,
          inv3 * p0y + 3 * inv2 * t * cp1y + 3 * inv * t2 * cp2y + t3 * targetY
        ];
      }, approxDist);

      curX = targetX;
      curY = targetY;
    }
  }

  return points;
}

/**
 * Computes silhouette spans, top, bottom, and ray intersections
 */
export function computeSilhouetteSpans(points: Point2D[], samples: number = 160): SilhouetteSpans {
  let top = Infinity;
  let bottom = -Infinity;

  for (const pt of points) {
    if (pt[1] < top) top = pt[1];
    if (pt[1] > bottom) bottom = pt[1];
  }

  const height = bottom - top;
  const sampleY = (idx: number): number => top + (height * (idx + 0.5)) / samples;

  const leftSpans = new Float64Array(samples);
  const rightSpans = new Float64Array(samples);
  const outerLeft = new Float64Array(samples);
  const outerRight = new Float64Array(samples);

  for (let s = 0; s < samples; s++) {
    const yVal = sampleY(s);
    let innerL = -Infinity;
    let innerR = Infinity;
    let outL = Infinity;
    let outR = -Infinity;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if ((p1[1] <= yVal) === (p2[1] <= yVal)) continue;

      const intersectX = p1[0] + ((p2[0] - p1[0]) * (yVal - p1[1])) / (p2[1] - p1[1]);

      if (intersectX <= CANONICAL_CENTER) {
        if (intersectX > innerL) innerL = intersectX;
      } else {
        if (intersectX < innerR) innerR = intersectX;
      }

      if (intersectX < outL) outL = intersectX;
      if (intersectX > outR) outR = intersectX;
    }

    leftSpans[s] = Number.isFinite(innerL) ? innerL : CANONICAL_CENTER;
    rightSpans[s] = Number.isFinite(innerR) ? innerR : CANONICAL_CENTER;
    outerLeft[s] = Number.isFinite(outL) ? outL : CANONICAL_CENTER;
    outerRight[s] = Number.isFinite(outR) ? outR : CANONICAL_CENTER;
  }

  const interpolate = (arrL: Float64Array, arrR: Float64Array) => (y: number): [number, number] => {
    const norm = clampNum(((y - top) / height) * samples - 0.5, 0, samples - 1);
    const idx0 = Math.floor(norm);
    const frac = norm - idx0;
    const idx1 = Math.min(idx0 + 1, samples - 1);

    return [
      arrL[idx0] + (arrL[idx1] - arrL[idx0]) * frac,
      arrR[idx0] + (arrR[idx1] - arrR[idx0]) * frac
    ];
  };

  return {
    top,
    bottom,
    spanAt: interpolate(leftSpans, rightSpans),
    outerAt: interpolate(outerLeft, outerRight)
  };
}

/**
 * Resamples a polygon ring into 96 radial rays from canonical center
 */
export function resamplePolygonRadially(points: Point2D[], numRays: number = 96): Point2D[] {
  return Array.from({ length: numRays }, (_, idx) => {
    const angle = (idx / numRays) * TAU;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    let maxR = 0;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      const x1 = p1[0] - CANONICAL_CENTER;
      const y1 = p1[1] - CANONICAL_CENTER;
      const x2 = p2[0] - CANONICAL_CENTER;
      const y2 = p2[1] - CANONICAL_CENTER;

      const cross = (x2 - x1) * sinA - (y2 - y1) * cosA;
      if (Math.abs(cross) < 1e-9) continue;

      const t = (x1 * sinA - y1 * cosA) / -cross;
      if (t < 0 || t > 1) continue;

      const r = (x1 + (x2 - x1) * t) * cosA + (y1 + (y2 - y1) * t) * sinA;
      if (r > maxR) maxR = r;
    }

    return [CANONICAL_CENTER + cosA * maxR, CANONICAL_CENTER + sinA * maxR];
  });
}

/**
 * Scales and translates path coordinates to match canonical coordinate frame
 */
export function transformPathCoordinates(
  path: string,
  scale: number,
  dx: number,
  dy: number
): string {
  let isY = 0;
  return path.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (match) => {
    isY ^= 1;
    const val = parseFloat(match) + (isY ? dx : dy);
    return String(round2(CANONICAL_CENTER + (val - CANONICAL_CENTER) * scale));
  });
}

/**
 * Normalizes SVG path so its bounding box fits cleanly into 228.44 span
 */
export function normalizePathString(path: string, polygon: Point2D[]): string {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of polygon) {
    if (pt[0] < minX) minX = pt[0];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[1] > maxY) maxY = pt[1];
  }

  const dx = CANONICAL_CENTER - (minX + maxX) / 2;
  const dy = CANONICAL_CENTER - (minY + maxY) / 2;
  const scale = clampNum(SVG_VIEW_SPAN / Math.max(maxX - minX, maxY - minY), 0.9, 1.35);

  if (Math.abs(scale - 1) < 5e-3 && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
    return path;
  }

  return transformPathCoordinates(path, scale, dx, dy);
}

/**
 * Analyzes and normalizes shape path geometry
 */
export function analyzeShapePath(rawPath: string): AnalyzedPath {
  const normPath = normalizePathString(rawPath, sampleSvgPath(rawPath));
  const polygon = sampleSvgPath(normPath);
  const spans = computeSilhouetteSpans(polygon);

  let maxRadius = 0;
  for (let y = spans.top; y <= spans.bottom; y += 2) {
    const [left, right] = spans.outerAt(y);
    maxRadius = Math.max(maxRadius, (right - left) / 2);
  }

  return {
    path: normPath,
    ring: resamplePolygonRadially(polygon),
    top: round2(spans.top),
    bottom: round2(spans.bottom),
    spanAt: spans.spanAt,
    beltRadius: round2(maxRadius)
  };
}

/**
 * Memoization cache for analyzed shape paths
 */
const analyzedCache = new Map<string, AnalyzedPath>();

/**
 * Get analyzed path descriptor for given shape identifier
 */
export function getAnalyzedShapePath(shape: string): AnalyzedPath {
  const cached = analyzedCache.get(shape);
  if (cached) return cached;

  const fn = SHAPE_CONTOURS[shape];
  if (!fn) {
    throw new Error(`getAnalyzedShapePath: unknown shape "${shape}"`);
  }

  const analyzed = analyzeShapePath(fn());
  analyzedCache.set(shape, analyzed);
  return analyzed;
}

/**
 * Invalidate contour cache (used when custom shapes are registered)
 */
export function invalidateContourCache(shape: string): void {
  analyzedCache.delete(shape);
}
