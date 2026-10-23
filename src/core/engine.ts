/**
 * GB Avatars Software 3D Vector Rendering Engine
 *
 * Microkernel Architecture Facade connecting:
 * - Math: Vectors, Quaternions, Bezier Curves, Easing
 * - Physics: 120Hz Sub-stepped Spring Oscillators, Analytical Pokes, Pointer Gaze Tracking
 * - Geometry: 2D Silhouette Contours, 3D Mesh Extrusion & Beveling, Horizon Arc Projection
 * - Motion: Real-time Simulation Coordinator & Facial Expression State Machine
 * - Rasterizer: Analytical 3D Vector to SVG Serialization Engine
 */

export { renderSvgString, registerCustomShape } from './rasterizer/svg-renderer';
export { createMotion } from './motion/motion';
export { canonicalShape } from './geometry/shapes-table';
export { createAppearance } from './geometry/palette';
export { computeGaze } from './physics/gaze';
export { registerAnimation, getRegisteredAnimations } from './animations/registry';
export { OFFICIAL_SHAPES as officialShapes } from './shapes';
export {
  getEngineConfig,
  updateEngineConfig,
  resetEngineConfig,
  subscribeEngineConfig,
  getConfigDiff,
  DEFAULT_ENGINE_CONFIG,
  type EngineConfig,
  type DeepPartial
} from './config';
