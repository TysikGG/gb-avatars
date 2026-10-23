export { Avatar, GbAvatar, Gravatar } from './Avatar.js';
export { useAvatarGaze } from './useAvatarGaze.js';
export { useEngineConfig } from './useEngineConfig.js';

export type { UseAvatarGazeOptions } from './useAvatarGaze.js';

// Re-export core engine utilities & types
export {
  createMotion,
  renderSvgString,
  canonicalShape,
  createAppearance,
  officialShapes,
  computeGaze,
  OFFICIAL_SHAPES,
  EXTENDED_SHAPES,
  ALL_BUILTIN_SHAPES,
  PRESET_CUSTOM_SHAPES,
  registerCustomShape,
  getRegisteredCustomShapes,
  subscribeCustomShapes,
  resolveShape,
  normalizeSvgPathToMotionLab,
  extractPathFromSvg,
  OFFICIAL_COLORS,
  DEFAULT_COLOR,
  getAvatarAppearance,
  resolveColorHex,
  resolveEyeColorHex,
  EXPRESSIONS,
  EXPRESSION_ALIASES,
  POKE_TYPES,
  normalizeExpression,
  registerAnimation,
  getAnimation,
  getRegisteredAnimations,
  getEngineConfig,
  updateEngineConfig,
  resetEngineConfig,
  subscribeEngineConfig,
  getConfigDiff,
  DEFAULT_ENGINE_CONFIG
} from '../core/index.js';

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
} from '../core/index.js';
