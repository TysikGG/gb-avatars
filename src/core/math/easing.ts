/**
 * Easing Functions & Bezier Curves
 */

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Standard cubic ease-in-out curve
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Standard cubic ease-out curve
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Elastic overshoot back ease-out curve
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Smoothstep interpolation (Hermite polynomial)
 */
export function smoothstep(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

/**
 * Evaluates a 1D cubic Bezier segment for easing
 */
export function evalBezier(t: number, p1: number, p2: number): number {
  const inv = 1 - t;
  return 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t;
}

/**
 * Evaluates the first derivative of a 1D cubic Bezier segment
 */
export function evalBezierDerivative(t: number, p1: number, p2: number): number {
  const inv = 1 - t;
  return 3 * inv * inv * p1 + 6 * inv * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

/**
 * Standard cubic bezier easing solver using Newton-Raphson iteration
 */
export function createBezierEasing(mX1: number, mY1: number, mX2: number, mY2: number) {
  return function (x: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Newton-Raphson iteration to find t for given x
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = evalBezier(t, mX1, mX2) - x;
      if (Math.abs(currentX) < 1e-5) break;
      const dX = evalBezierDerivative(t, mX1, mX2);
      if (Math.abs(dX) < 1e-6) break;
      t -= currentX / dX;
    }
    return evalBezier(clamp(t, 0, 1), mY1, mY2);
  };
}
