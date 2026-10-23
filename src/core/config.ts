/**
 * GB Avatars Dynamic Engine Configuration System
 *
 * Provides a unified, reactive configuration registry for all behavioral,
 * physical, temporal, and geometric tuning parameters of the 3D vector rendering engine.
 *
 * Mathematical invariants (e.g. PI, TAU) remain constant, while all behavioral
 * constants can be dynamically modified in real-time without restarting or re-mounting.
 */

export interface PhysicsConfig {
  /** Numerical integration substep interval in seconds (default: 1/120 = 0.00833s) */
  springSubStepDt: number;
  /** Exponential decay base for frame-rate independent smoothing (default: 0.86) */
  decayBase: number;
  /** Reference timestep for exponential decay in seconds (default: 1/60 = 0.01667s) */
  referenceDt: number;
  /** Angular frequency / stiffness for multi-body transitions in rad/s (default: 10) */
  bodyBlendSpeed: number;
  /** Damping ratio for body transition spring (default: 1.0 = critically damped) */
  bodyBlendDamping: number;
}

export interface GazeConfig {
  /** Overall influence/weight factor of gaze tracking on head orientation (default: 0.55) */
  gazeFactor: number;
  /** Bounding box gaze scale divisor (default: 0.5) */
  defaultGazeScale: number;
  /** Maximum pitch rotation for non-sphere bodies in degrees (default: 19) */
  maxPitchDeg: number;
  /** Maximum yaw rotation for non-sphere bodies in degrees (default: 26) */
  maxYawDeg: number;
  /** Maximum pitch rotation for sphere in degrees (default: 14) */
  maxPitchDegSphere: number;
  /** Maximum yaw rotation for sphere in degrees (default: 18) */
  maxYawDegSphere: number;
  /** Horizontal head center shift for non-sphere bodies (default: 0.07) */
  shiftX: number;
  /** Vertical head center shift for non-sphere bodies (default: 0.055) */
  shiftY: number;
  /** Horizontal head center shift for sphere (default: 0.03) */
  shiftXSphere: number;
  /** Vertical head center shift for sphere (default: 0.024) */
  shiftYSphere: number;
}

export interface MotionConfig {
  /** Default base zoom scale factor (default: 0.6) */
  defaultZoom: number;
  /** Minimum allowable zoom factor (default: 0.25) */
  minZoom: number;
  /** Maximum allowable zoom factor (default: 2.5) */
  maxZoom: number;
  /** Maximum simulation timestep clamped per frame in seconds (default: 0.1) */
  maxStepDt: number;
  /** Total duration of an eyelid blink in seconds (default: 0.26) */
  blinkDuration: number;
  /** Eyelid reopen overshoot bounce factor (default: 1.06) */
  blinkBounce: number;
  /** Facial expression morph transition duration in seconds (default: 0.28) */
  morphDuration: number;
  /** Facial expression transition duration through blink in seconds (default: 0.35) */
  lidMorphDuration: number;
  /** Animation clip cross-fade bridge duration in seconds (default: 0.35) */
  bridgeDuration: number;
  /** Procedural look target transition duration in seconds (default: 0.5) */
  lookTransitionDuration: number;
  /** Threshold under which motion state is considered settled/idle (default: 0.001) */
  settleEpsilon: number;
}

export interface EyesConfig {
  /** Canonical baseline spacing between left and right eyes (default: 0.64) */
  baseEyeGap: number;
  /** Vertical shift offset for eyes placement (default: 0.0) */
  eyeShiftY: number;
  /** Baseline individual eye width (default: 0.22) */
  baseEyeWidth: number;
  /** Baseline individual eye height (default: 0.48) */
  baseEyeHeight: number;
  /** Discretization point count for analytical eye perimeter loops (default: 64) */
  eyeLoopPoints: number;
}

export interface MeshConfig {
  /** Default 3D scale multiplier for extruded models (default: 1.2) */
  defaultScale: number;
  /** Default half-depth for extruded 3D geometry (default: 0.36) */
  defaultHalfDepth: number;
  /** Default bevel radius for rounded 3D edges (default: 0.22) */
  defaultBevel: number;
  /** Number of subdivision steps for bevel curvature (default: 4) */
  bevelSteps: number;
  /** Angular segment count for bodies of revolution (default: 64) */
  revolutionSegments: number;
  /** Curvature power exponent for loft heightfield interpolation (default: 0.72) */
  loftPower: number;
  /** Camera projection screen radius multiplier factor (default: 0.36 / 1.18 = 0.30508) */
  projectedRadiusFactor: number;
}

export interface EngineConfig {
  physics: PhysicsConfig;
  gaze: GazeConfig;
  motion: MotionConfig;
  eyes: EyesConfig;
  mesh: MeshConfig;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const DEFAULT_ENGINE_CONFIG: Readonly<EngineConfig> = Object.freeze({
  physics: Object.freeze({
    springSubStepDt: 1 / 120,
    decayBase: 0.86,
    referenceDt: 1 / 60,
    bodyBlendSpeed: 10,
    bodyBlendDamping: 1
  }),
  gaze: Object.freeze({
    gazeFactor: 0.55,
    defaultGazeScale: 0.5,
    maxPitchDeg: 19,
    maxYawDeg: 26,
    maxPitchDegSphere: 14,
    maxYawDegSphere: 18,
    shiftX: 0.07,
    shiftY: 0.055,
    shiftXSphere: 0.03,
    shiftYSphere: 0.024
  }),
  motion: Object.freeze({
    defaultZoom: 0.6,
    minZoom: 0.25,
    maxZoom: 2.5,
    maxStepDt: 0.1,
    blinkDuration: 0.26,
    blinkBounce: 1.06,
    morphDuration: 0.28,
    lidMorphDuration: 0.35,
    bridgeDuration: 0.35,
    lookTransitionDuration: 0.5,
    settleEpsilon: 1e-3
  }),
  eyes: Object.freeze({
    baseEyeGap: 0.64,
    eyeShiftY: 0,
    baseEyeWidth: 0.22,
    baseEyeHeight: 0.48,
    eyeLoopPoints: 64
  }),
  mesh: Object.freeze({
    defaultScale: 1.2,
    defaultHalfDepth: 0.36,
    defaultBevel: 0.22,
    bevelSteps: 4,
    revolutionSegments: 64,
    loftPower: 0.72,
    projectedRadiusFactor: 0.36 / 1.18
  })
});

/**
 * Helper to clone config object deeply
 */
function cloneConfig(cfg: EngineConfig): EngineConfig {
  return {
    physics: { ...cfg.physics },
    gaze: { ...cfg.gaze },
    motion: { ...cfg.motion },
    eyes: { ...cfg.eyes },
    mesh: { ...cfg.mesh }
  };
}

// Active mutable config state
let currentConfig: EngineConfig = cloneConfig(DEFAULT_ENGINE_CONFIG as EngineConfig);

// Set of reactive change listeners
type ConfigListener = (config: EngineConfig) => void;
const listeners = new Set<ConfigListener>();

/**
 * Retrieves the current live configuration of the engine.
 */
export function getEngineConfig(): EngineConfig {
  return currentConfig;
}

/**
 * Dynamically updates configuration parameters at runtime.
 * Merges partial changes, validates values, and notifies all active listeners.
 *
 * @param patch - Partial configuration tree with updated values
 * @returns Updated complete EngineConfig
 */
export function updateEngineConfig(patch: DeepPartial<EngineConfig>): EngineConfig {
  if (!patch || typeof patch !== 'object') return currentConfig;

  for (const categoryKey of Object.keys(patch) as Array<keyof EngineConfig>) {
    const categoryPatch = patch[categoryKey];
    if (categoryPatch && typeof categoryPatch === 'object' && currentConfig[categoryKey]) {
      for (const [propKey, propVal] of Object.entries(categoryPatch)) {
        if (typeof propVal === 'number' && Number.isFinite(propVal)) {
          (currentConfig[categoryKey] as any)[propKey] = propVal;
        }
      }
    }
  }

  notifyListeners();
  return currentConfig;
}

/**
 * Resets the entire engine configuration, or a specific category, back to official defaults.
 *
 * @param category - Optional specific category to reset ('physics' | 'gaze' | 'motion' | 'eyes' | 'mesh')
 * @returns Reset complete EngineConfig
 */
export function resetEngineConfig(category?: keyof EngineConfig): EngineConfig {
  if (category && DEFAULT_ENGINE_CONFIG[category]) {
    currentConfig[category] = { ...DEFAULT_ENGINE_CONFIG[category] } as any;
  } else {
    currentConfig = cloneConfig(DEFAULT_ENGINE_CONFIG as EngineConfig);
  }

  notifyListeners();
  return currentConfig;
}

/**
 * Subscribes a listener to configuration changes.
 *
 * @param listener - Callback invoked whenever configuration updates
 * @returns Unsubscribe function
 */
export function subscribeEngineConfig(listener: ConfigListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener(currentConfig);
    } catch (err) {
      console.error('Error in engine config listener:', err);
    }
  }
}

/**
 * Calculates a delta object containing only parameters that differ from official defaults.
 * Returns null if current config matches defaults exactly.
 */
export function getConfigDiff(config: EngineConfig = getEngineConfig()): DeepPartial<EngineConfig> | null {
  const diff: any = {};
  let hasDiff = false;

  for (const catKey of Object.keys(DEFAULT_ENGINE_CONFIG) as Array<keyof EngineConfig>) {
    const currentCat = config[catKey];
    const defaultCat = DEFAULT_ENGINE_CONFIG[catKey];
    const catDiff: any = {};
    let catHasDiff = false;

    for (const propKey of Object.keys(defaultCat)) {
      const curVal = (currentCat as any)[propKey];
      const defVal = (defaultCat as any)[propKey];

      if (typeof curVal === 'number' && typeof defVal === 'number') {
        if (Math.abs(curVal - defVal) > 1e-4) {
          catDiff[propKey] = curVal;
          catHasDiff = true;
        }
      } else if (curVal !== defVal) {
        catDiff[propKey] = curVal;
        catHasDiff = true;
      }
    }

    if (catHasDiff) {
      diff[catKey] = catDiff;
      hasDiff = true;
    }
  }

  return hasDiff ? diff : null;
}
