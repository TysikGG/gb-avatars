/**
 * Spring Dynamics & Numerical Integration
 * Implements a 2nd-order damped harmonic oscillator with sub-stepping for stability.
 */

import { getEngineConfig } from '../config';

export interface SpringState {
  x: number; // Current value
  v: number; // Current velocity
  t: number; // Target value
}

export function createSpring(initialValue: number = 0): SpringState {
  return { x: initialValue, v: 0, t: initialValue };
}

/**
 * Analytical acceleration: a = -2 * zeta * omega * v - omega^2 * (x - target)
 *
 * @param spring - Spring state
 * @param omega - Angular frequency / stiffness (higher = snappier)
 * @param zeta - Damping ratio (1.0 = critically damped, <1 = bouncy, >1 = sluggish)
 * @param dt - Time step in seconds
 */
export function stepSpring(spring: SpringState, omega: number, zeta: number, dt: number): void {
  const force = -2 * zeta * omega * spring.v - omega * omega * (spring.x - spring.t);
  spring.v += force * dt;
  spring.x += spring.v * dt;

  if (!Number.isFinite(spring.x) || !Number.isFinite(spring.v)) {
    spring.x = spring.t;
    spring.v = 0;
  }
}

/**
 * Sub-steps the spring at 120Hz for high numerical stability across variable framerates.
 */
export const SUB_STEP_DT = 1 / 120;

export function getSubStepCount(dt: number): number {
  const substep = getEngineConfig()?.physics?.springSubStepDt ?? SUB_STEP_DT;
  return Math.max(1, Math.ceil(dt / substep));
}

export function advanceSpringSubStepped(
  spring: SpringState,
  omega: number,
  zeta: number,
  dt: number
): void {
  const subSteps = getSubStepCount(dt);
  const subDt = dt / subSteps;
  for (let i = 0; i < subSteps; i++) {
    stepSpring(spring, omega, zeta, subDt);
  }
}

/**
 * Frame-rate independent exponential smoothing factor.
 * blend = 1 - 0.86^(dt / (1/60))
 */
export const BASE_FRAME_TIME = 1 / 60;
export const BASE_RETENTION = 0.86;

export function computeBlend(dt: number, retention?: number): number {
  const cfg = getEngineConfig()?.physics;
  const decay = retention ?? cfg?.decayBase ?? BASE_RETENTION;
  const refDt = cfg?.referenceDt ?? BASE_FRAME_TIME;
  return 1 - Math.pow(decay, dt / refDt);
}

/**
 * Smooth exponential interpolation for coordinates.
 */
export function smoothExponential(current: number, target: number, dt: number): number {
  const blend = computeBlend(dt);
  return current + (target - current) * blend;
}
