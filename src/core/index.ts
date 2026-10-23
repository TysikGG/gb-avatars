export {
  registerAnimation,
  getAnimation,
  hasAnimation,
  getRegisteredAnimations,
  PRESET_ANIMATIONS
} from './animations/index.js';

export {
  renderSvgString
} from './engine';

export { createMotion } from './motion/motion.js';
export { OFFICIAL_SHAPES as officialShapes } from './shapes.js';

export { canonicalShape, SHAPE_EYE_LAYOUTS } from './geometry/shapes-table.js';
export { createAppearance } from './geometry/palette.js';
export { computeGaze, computeGazeOrientation } from './physics/gaze.js';
export { getPokeDuration, computePokesOffset } from './physics/pokes.js';
export { createSpring, stepSpring, advanceSpringSubStepped } from './physics/spring.js';
export { quatFromEuler, quatToMatrix3, quatFromAxisAngle, quatMul, quatIdentity } from './math/quat.js';
export { vec2, vec3, v2Len, v3Norm, v3Cross, lerp } from './math/vec.js';
export { clamp, smoothstep, easeInOutCubic, easeOutCubic, easeOutBack } from './math/easing.js';
export { EXPRESSION_SPECS } from './geometry/expressions.js';

export {
  OFFICIAL_SHAPES,
  EXTENDED_SHAPES,
  ALL_BUILTIN_SHAPES,
  PRESET_CUSTOM_SHAPES,
  registerCustomShape,
  getRegisteredCustomShapes,
  subscribeCustomShapes,
  resolveShape,
  normalizeSvgPathToMotionLab,
  extractPathFromSvg
} from './shapes.js';

export {
  OFFICIAL_COLORS,
  DEFAULT_COLOR,
  getAvatarAppearance
} from './colors.js';

export {
  EXPRESSIONS,
  EXPRESSION_ALIASES,
  POKE_TYPES,
  normalizeExpression
} from './expressions.js';

export {
  getEngineConfig,
  updateEngineConfig,
  resetEngineConfig,
  subscribeEngineConfig,
  getConfigDiff,
  DEFAULT_ENGINE_CONFIG,
  type EngineConfig,
  type DeepPartial,
  type PhysicsConfig,
  type GazeConfig,
  type MotionConfig,
  type EyesConfig,
  type MeshConfig
} from './config.js';

export type {
  OfficialShape,
  ExtendedShape,
  BuiltinShape,
  Expression,
  PokeType,
  AnimationDefinition,
  AnimationResult,
  EyeLayout,
  CustomShapeOptions,
  Appearance,
  ColorDefinition,
  MotionInstance,
  AvatarHandle,
  AvatarProps,
  GbAvatarHandle,
  GbAvatarProps,
  GravatarHandle,
  GravatarProps
} from './types.js';
