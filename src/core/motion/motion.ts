/**
 * Avatar Motion Coordinator, Spring State Machine & Expression Engine
 *
 * Coordinates real-time 3D motion synthesis:
 * - Damped harmonic oscillators (120Hz sub-stepped spring physics)
 * - 3D head pitch & yaw tracking from pointer gaze
 * - Analytical procedural poke impulse simulation
 * - Smooth eyelid blink dynamics and facial expression morphing
 * - Multi-body shape transitions with spring-weighted interpolation
 */

import type { MotionInstance } from '../types';
import { createSpring, stepSpring, computeBlend } from '../physics/spring';
import { getPokeDuration, computePokesOffset, type ActivePoke } from '../physics/pokes';
import { computeGazeOrientation } from '../physics/gaze';
import { quatFromEuler, DEG2RAD } from '../math/quat';
import { clamp, easeInOutCubic } from '../math/easing';
import { RUNTIME_EXPRESSION_EYES, type RuntimeEyeSpec } from '../geometry/expressions';
import { getEngineConfig } from '../config';

export interface MotionOptions {
  body?: string;
  isGazeAlways?: boolean;
  zoomMul?: number;
}

export interface KeyframePoint<T> {
  t: number;
  v: T;
  ease?: [number, number, number, number];
  cut?: boolean;
}

export interface MotionClip {
  duration: number;
  body: string | null;
  squashAnchor: number;
  restTime: number;
  inspect: { bias?: number; isFollowingTurn?: boolean };
  position: KeyframePoint<[number, number]>[];
  rotation: KeyframePoint<[number, number, number]>[];
  squash: KeyframePoint<[number, number]>[];
  zoom: KeyframePoint<[number]>[];
  lids: KeyframePoint<[number]>[];
  expression: KeyframePoint<string>[];
}

export interface MotionPose {
  rot: [number, number, number];
  pos: [number, number];
  scl: [number, number];
  zoom: number;
  lids: number;
  expr: string;
  squashAnchor: number;
}

const DEFAULT_EASING: [number, number, number, number] = [0.42, 0, 0.58, 1];
const BRIDGE_EASING: [number, number, number, number] = [0.4, 0, 0.2, 1];
const MORPH_EASING: [number, number, number, number] = [0.4, 0.06, 0.18, 1];

const BRIDGE_DURATION = 0.35;
const MORPH_DURATION = 0.28;
const LID_MORPH_DURATION = 0.35;
const BLINK_DURATION = 0.26;
const BLINK_IN_FRACTION = 4.25 / 60;
const BLINK_OUT_FRACTION = 2 / 60;
const BLINK_BOUNCE = 1.06;

const DEFAULT_ZOOM = 0.6;
const GAZE_FACTOR = 0.55;
const SPRING_DT = 1 / 120;
const BODY_BLEND_SPEED = 10;
const SETTLE_EPSILON = 1e-3;

export const REST_ROTATION: [number, number, number] = [0, 0, 0];

export const LOOK_TARGETS: Record<string, { rot: [number, number, number]; pos: [number, number] }> = {
  left: { rot: [0, -20, 0], pos: [-0.1, 0] },
  right: { rot: [0, 20, 0], pos: [0.1, 0] },
  up: { rot: [-20, 0, 0], pos: [0, 0.1] },
  down: { rot: [20, 0, 0], pos: [0, -0.1] },
  center: { rot: [0, 0, 0], pos: [0, 0] }
};

export const REST_CLIP: MotionClip = {
  duration: 10,
  body: null,
  squashAnchor: 0,
  restTime: 0,
  inspect: {},
  position: [],
  rotation: [{ t: 0, v: REST_ROTATION, ease: DEFAULT_EASING }],
  squash: [],
  zoom: [],
  lids: [],
  expression: []
};

/**
 * Evaluates a cubic Bezier curve at parameter t
 */
function solveCubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  let u = t;
  for (let i = 0; i < 8; i++) {
    const inv = 1 - u;
    const currentX = 3 * inv * inv * u * p1x + 3 * inv * u * u * p2x + u * u * u;
    const dx = 3 * inv * inv * p1x + 6 * inv * u * (p2x - p1x) + 3 * u * u * (1 - p2x);
    if (Math.abs(currentX - t) < 1e-6 || Math.abs(dx) < 1e-6) break;
    u = clamp(u - (currentX - t) / dx, 0, 1);
  }
  const inv = 1 - u;
  return 3 * inv * inv * u * p1y + 3 * inv * u * u * p2y + u * u * u;
}

/**
 * Samples a keyframe track at time t with Bezier interpolation
 */
export function sampleTrack<T extends number[]>(track: KeyframePoint<T>[], time: number): T | null {
  if (track.length === 0) return null;
  if (time <= track[0].t) return track[0].v;
  const last = track[track.length - 1];
  if (time >= last.t) return last.v;

  let idx = 0;
  while (idx < track.length - 2 && track[idx + 1].t <= time) {
    idx++;
  }

  const p0 = track[idx];
  const p1 = track[idx + 1];
  const ease = p0.ease ?? DEFAULT_EASING;
  const progress = (time - p0.t) / Math.max(p1.t - p0.t, 1e-9);
  const factor = solveCubicBezier(progress, ease[0], ease[1], ease[2], ease[3]);

  return p0.v.map((startVal, i) => startVal + (p1.v[i] - startVal) * factor) as T;
}

/**
 * Mulberry32 PRNG
 */
function createPRNG(seed: number = 0): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function applyBlinkDeformation(eye: RuntimeEyeSpec, closeAmount: number): RuntimeEyeSpec {
  if (closeAmount <= 0) return eye;
  // Lid height factor: drops to 0.03 when fully closed
  const factor = Math.max(0.03, 1 - closeAmount);
  const drop = 0.035 * closeAmount;
  const tilt = eye.tilt || 0;
  const cosT = Math.cos(-tilt);
  const sinT = Math.sin(-tilt);

  return {
    ...eye,
    off: [eye.off[0] - sinT * drop, eye.off[1] + cosT * drop],
    lidY: (eye.lidY ?? 1) * factor,
    wid: closeAmount >= 0.98 ? 0 : eye.wid,
    oval: eye.oval ? [eye.oval[0], eye.oval[1] * factor] : eye.oval
  };
}

/**
 * Expression State Machine Manager
 */
class ExpressionState {
  currentName: string = 'neutral';
  private inspectWeightVal: number = 0;
  private activeTransition: any = null;
  private currentEyes: [RuntimeEyeSpec, RuntimeEyeSpec] = RUNTIME_EXPRESSION_EYES.neutral;

  get name(): string {
    return this.currentName;
  }

  get isMorphing(): boolean {
    return this.activeTransition != null && this.activeTransition.kind !== 'blink' && !this.activeTransition.isHeld;
  }

  private computeBlinkCloseAmount(): { close: number; phase: 'closing' | 'hold' | 'opening' } {
    if (!this.activeTransition) return { close: 0, phase: 'closing' };
    const dur = Math.max(this.activeTransition.dur, 0.05);
    const progress = Math.min(this.activeTransition.t / dur, 1);
    const inU = Math.min(0.28, (4.25 / 60) / dur);
    const u1 = (1 - inU) * 0.42;
    const u2 = u1 + inU;

    if (progress < u1) {
      const p = progress / u1;
      return { close: p * p * (3 - 2 * p), phase: 'closing' };
    }
    if (progress <= u2) {
      return { close: 1, phase: 'hold' };
    }
    const p = (progress - u2) / Math.max(1e-6, 1 - u2);
    let openProgress: number;
    const bounceFactor = getEngineConfig()?.motion?.blinkBounce ?? BLINK_BOUNCE;
    if (p < 0.7) {
      const q = p / 0.7;
      openProgress = (1 - (1 - q) * (1 - q)) * bounceFactor;
    } else {
      const q = (p - 0.7) / 0.3;
      openProgress = bounceFactor - (bounceFactor - 1.0) * (q * q * (3 - 2 * q));
    }
    return { close: Math.max(0, 1 - openProgress), phase: 'opening' };
  }

  eyes(): [RuntimeEyeSpec, RuntimeEyeSpec] {
    if (this.activeTransition == null) return this.currentEyes;

    if (this.activeTransition.kind === 'blink' || this.activeTransition.kind === 'lidMorph') {
      const { close, phase } = this.computeBlinkCloseAmount();
      const baseEyes =
        this.activeTransition.kind === 'lidMorph' && phase === 'opening'
          ? this.activeTransition.to
          : this.activeTransition.from;

      const left = applyBlinkDeformation(baseEyes[0], close);
      const right = applyBlinkDeformation(baseEyes[1], close);
      const res: any = [left, right];
      res.lids = [close, close];
      return res;
    }

    if (this.activeTransition.kind === 'morph') {
      const dur = Math.max(this.activeTransition.dur, 0.05);
      const progress = Math.min(this.activeTransition.t / dur, 1);
      const factor = progress * progress * (3 - 2 * progress);
      const from = this.activeTransition.from;
      const to = this.activeTransition.to;

      const blendEye = (e1: RuntimeEyeSpec, e2: RuntimeEyeSpec): RuntimeEyeSpec => ({
        ...e2,
        off: [e1.off[0] + (e2.off[0] - e1.off[0]) * factor, e1.off[1] + (e2.off[1] - e1.off[1]) * factor],
        tilt: (e1.tilt || 0) + ((e2.tilt || 0) - (e1.tilt || 0)) * factor,
        wid: (e1.wid || 0) + ((e2.wid || 0) - (e1.wid || 0)) * factor,
        lidY: (e1.lidY || 1) + ((e2.lidY || 1) - (e1.lidY || 1)) * factor,
        oval: [e1.oval[0] + (e2.oval[0] - e1.oval[0]) * factor, e1.oval[1] + (e2.oval[1] - e1.oval[1]) * factor]
      });

      return [blendEye(from[0], to[0]), blendEye(from[1], to[1])];
    }

    return this.activeTransition.to;
  }

  inspectWeight(): number {
    return this.inspectWeightVal;
  }

  blinkAmount(): number | null {
    if (this.activeTransition?.kind !== 'blink' || this.activeTransition.isHeld) return null;
    return this.computeBlinkCloseAmount().close;
  }

  morph(nextName: string): void {
    const nextEyes = RUNTIME_EXPRESSION_EYES[nextName] ?? RUNTIME_EXPRESSION_EYES.neutral;
    this.activeTransition = {
      kind: 'morph',
      from: this.eyes(),
      to: nextEyes,
      t: 0,
      dur: getEngineConfig()?.motion?.morphDuration ?? MORPH_DURATION,
      isHeld: false
    };
    this.currentName = nextName;
  }

  lidMorph(nextName: string): void {
    const nextEyes = RUNTIME_EXPRESSION_EYES[nextName] ?? RUNTIME_EXPRESSION_EYES.neutral;
    this.activeTransition = {
      kind: 'lidMorph',
      from: this.eyes(),
      to: nextEyes,
      t: 0,
      dur: getEngineConfig()?.motion?.lidMorphDuration ?? LID_MORPH_DURATION,
      isHeld: false
    };
    this.currentName = nextName;
  }

  blink(): void {
    if (this.activeTransition == null || this.activeTransition.isHeld) {
      this.activeTransition = {
        kind: 'blink',
        from: this.currentEyes,
        to: RUNTIME_EXPRESSION_EYES[this.currentName] ?? RUNTIME_EXPRESSION_EYES.neutral,
        t: 0,
        dur: getEngineConfig()?.motion?.blinkDuration ?? BLINK_DURATION,
        isHeld: false
      };
    }
  }

  play(kf: KeyframePoint<string>): void {
    if (kf.v !== this.currentName) {
      if (!kf.cut) {
        this.lidMorph(kf.v);
      } else {
        this.morph(kf.v);
      }
    }
  }

  step(dt: number): void {
    if (this.activeTransition != null && !this.activeTransition.isHeld) {
      this.activeTransition.t += dt;
      if (this.activeTransition.t >= this.activeTransition.dur) {
        this.currentEyes = this.activeTransition.to;
        this.activeTransition = null;
      }
    }
  }

  release(): void {
    if (this.activeTransition != null) {
      this.activeTransition.isHeld = false;
    }
  }

  seek(exprTrack: KeyframePoint<string>[], time: number): void {
    this.currentName = 'neutral';
    this.currentEyes = RUNTIME_EXPRESSION_EYES.neutral;
    this.activeTransition = null;

    let targetExpr = 'neutral';
    for (const kf of exprTrack) {
      if (kf.t <= time + 1e-9) {
        targetExpr = kf.v;
      } else {
        break;
      }
    }
    this.currentName = targetExpr;
    this.currentEyes = RUNTIME_EXPRESSION_EYES[targetExpr] ?? RUNTIME_EXPRESSION_EYES.neutral;
  }
}

/**
 * Creates the core 3D Motion Instance coordinator
 */
export function createMotion(options: MotionOptions = {}): MotionInstance {
  const zoomMul = Math.min(3, Math.max(0.2, options.zoomMul || 1));
  const exprState = new ExpressionState();
  const prng = createPRNG(42);

  let currentBody = options.body ?? 'sphere';
  const hasFixedBody = options.body !== undefined;

  let blendedBodies: { body: string; weight: number }[] = [];
  const bodySpring = createSpring(1);

  let rotEuler: [number, number, number] = [0, 0, 0];
  let posOffset: [number, number] = [0, 0];
  let squashScale: [number, number] = [1, 1];
  let currentZoom = (getEngineConfig()?.motion?.defaultZoom ?? DEFAULT_ZOOM) * zoomMul;
  let squashAnchor = 0;

  let isPlaying = false;
  let isPaused = false;
  let currentTime = 0;
  let loopCount = 0;

  let currentClip: MotionClip = REST_CLIP;
  let activeBridge: MotionClip | null = null;
  let savedClipInfo: { clip: MotionClip; name: string } | null = null;
  let isLooping = true;

  let activePokes: ActivePoke[] = [];
  let heldExpression: string | null = null;
  let pendingBlinkAction: (() => void) | null = null;
  let lookTransition: { t: number; fromRot: [number, number, number]; toRot: [number, number, number]; fromPos: [number, number]; toPos: [number, number] } | null = null;

  let gaze = {
    isHeld: false,
    isAlways: options.isGazeAlways ?? false,
    x: 0,
    y: 0,
    cx: 0,
    cy: 0,
    hold: 0
  };

  const syncTracks = () => {
    const pos = sampleTrack(currentClip.position, currentTime);
    posOffset = pos ? [pos[0], pos[1]] : [0, 0];

    const rot = sampleTrack(currentClip.rotation, currentTime);
    rotEuler = rot ? [rot[0], rot[1], rot[2]] : [0, 0, 0];

    const sq = sampleTrack(currentClip.squash, currentTime);
    squashScale = sq ? [sq[0], sq[1]] : [1, 1];

    const zm = sampleTrack(currentClip.zoom, currentTime);
    if (zm) {
      const minZ = getEngineConfig()?.motion?.minZoom ?? 0.25;
      const maxZ = getEngineConfig()?.motion?.maxZoom ?? 2.5;
      currentZoom = Math.min(maxZ, Math.max(minZ, zm[0])) * zoomMul;
    }
  };

  const getLids = (): number => {
    const lidVal = sampleTrack(currentClip.lids, currentTime);
    return lidVal ? clamp(lidVal[0], 0, 1) : 0;
  };

  const getPose = (): MotionPose => ({
    rot: rotEuler,
    pos: posOffset,
    scl: squashScale,
    zoom: currentZoom / zoomMul,
    lids: getLids(),
    expr: exprState.name,
    squashAnchor
  });

  const getBlendedBodies = (): { body: string; weight: number }[] => {
    if (blendedBodies.length === 0) return [{ body: currentBody, weight: 1 }];
    const amount = easeInOutCubic(clamp(bodySpring.x, 0, 1));
    const map = new Map<string, number>();

    for (const b of blendedBodies) {
      map.set(b.body, (map.get(b.body) ?? 0) + b.weight * (1 - amount));
    }
    map.set(currentBody, (map.get(currentBody) ?? 0) + amount);

    const filtered = [...map].filter(([, w]) => w > 1e-4);
    const sum = filtered.reduce((acc, [, w]) => acc + w, 0);
    return filtered.map(([b, w]) => ({ body: b, weight: w / sum }));
  };

  const setBodyInternal = (body: string) => {
    if (body !== currentBody) {
      blendedBodies = getBlendedBodies();
      currentBody = body;
      bodySpring.x = 0;
      bodySpring.v = 0;
      bodySpring.t = 1;
    }
  };

  const updateGaze = (dt: number) => {
    if (isPaused || (!gaze.isHeld && gaze.hold === 0)) return;
    const blend = computeBlend(dt);

    const smoothVal = (cur: number, target: number) => {
      const next = cur + (target - cur) * blend;
      const eps = getEngineConfig()?.motion?.settleEpsilon ?? SETTLE_EPSILON;
      return Math.abs(target - next) < eps ? target : next;
    };

    gaze = {
      ...gaze,
      cx: smoothVal(gaze.cx, gaze.x),
      cy: smoothVal(gaze.cy, gaze.y),
      hold: smoothVal(gaze.hold, gaze.isHeld ? 1 : 0)
    };

    if (isPlaying) return;

    syncTracks();
    const gazeOffset = computeGazeOrientation(currentBody, gaze.cx, gaze.cy);
    const h = gaze.hold;

    rotEuler = [
      rotEuler[0] + (gazeOffset.rx - rotEuler[0]) * h,
      rotEuler[1] + (gazeOffset.ry - rotEuler[1]) * h,
      rotEuler[2] * (1 - h)
    ];
    posOffset = [
      posOffset[0] + (gazeOffset.px - posOffset[0]) * h,
      posOffset[1] + (gazeOffset.py - posOffset[1]) * h
    ];
  };

  return {
    get isPlaying(): boolean {
      return isPlaying;
    },
    get time(): number {
      return currentTime;
    },
    get duration(): number {
      return currentClip.duration;
    },
    get loopCount(): number {
      return loopCount;
    },
    get face(): string {
      return exprState.name;
    },
    get isSettled(): boolean {
      const gazeSettled =
        isPaused ||
        (gaze.hold === (gaze.isHeld ? 1 : 0) && (!gaze.isHeld || (gaze.cx === gaze.x && gaze.cy === gaze.y)));
      return (
        !isPlaying &&
        activePokes.length === 0 &&
        blendedBodies.length === 0 &&
        lookTransition == null &&
        pendingBlinkAction == null &&
        !exprState.isMorphing &&
        exprState.blinkAmount() == null &&
        gazeSettled
      );
    },

    load(clipData: any, { isPlaying: play = true, phase = 0 }: any = {}) {
      currentClip = {
        duration: clipData.duration || 1,
        body: clipData.body ?? currentBody,
        squashAnchor: clipData.squashAnchor ?? 0,
        restTime: clipData.workArea ? clipData.workArea.start : 0,
        inspect: clipData.inspect || {},
        position: (clipData.tracks?.position || []).map((k: any) => ({ t: k.t, v: k.v, ease: k.ease })),
        rotation: (clipData.tracks?.rotation || []).map((k: any) => ({ t: k.t, v: k.v, ease: k.ease })),
        squash: (clipData.tracks?.squash || []).map((k: any) => ({ t: k.t, v: k.v, ease: k.ease })),
        zoom: (clipData.tracks?.zoom || []).map((k: any) => ({ t: k.t, v: k.v, ease: k.ease })),
        lids: (clipData.tracks?.lids || []).map((k: any) => ({ t: k.t, v: k.v, ease: k.ease })),
        expression: (clipData.tracks?.expression || []).map((k: any) => ({ t: k.t, v: k.v, ease: k.ease, cut: k.cut }))
      };
      savedClipInfo = { clip: currentClip, name: clipData.name || 'recipe' };
      isLooping = true;
      isPlaying = play;
      currentTime = phase > 0 ? phase * currentClip.duration : 0;
      syncTracks();
    },

    play() {
      isPaused = false;
      isPlaying = true;
    },

    pause() {
      isPaused = true;
      isPlaying = false;
    },

    stop() {
      isPlaying = false;
      currentTime = 0;
      syncTracks();
    },

    rest() {
      isPaused = false;
      isPlaying = false;
      currentClip = REST_CLIP;
      currentTime = 0;
      syncTracks();
    },

    seek(time: number) {
      currentTime = time;
      lookTransition = null;
      pendingBlinkAction = null;
      syncTracks();
      exprState.seek(currentClip.expression, time);
      if (heldExpression != null) {
        exprState.seek([{ t: 0, v: heldExpression }], 0);
      }
    },

    setBody(body: string, { isInstant = false } = {}) {
      if (isInstant) {
        currentBody = body;
        blendedBodies = [];
        bodySpring.x = 1;
        bodySpring.v = 0;
      } else {
        setBodyInternal(body);
      }
    },

    setMorph(_options?: any) {},

    setExpression(expr: string, { isThroughBlink = false } = {}) {
      if (isThroughBlink) {
        exprState.lidMorph(expr);
      } else {
        exprState.morph(expr);
      }
    },

    holdFace(expr: string | null) {
      if (expr !== heldExpression) {
        heldExpression = expr;
        if (expr != null) {
          exprState.morph(expr);
        }
      }
    },

    poke(type: string, { turns = 1 } = {}) {
      activePokes = [
        ...activePokes,
        { poke: type, t: 0, turns: Math.max(1, Math.round(turns)) }
      ];
    },

    blink() {
      exprState.blink();
    },

    setInspect() {},

    setGaze(coords: [number, number] | null) {
      if (coords == null) {
        gaze = { ...gaze, isHeld: false };
        return;
      }
      const x = clamp(coords[0] || 0, -1, 1);
      const y = clamp(coords[1] || 0, -1, 1);
      gaze =
        gaze.hold === 0
          ? { ...gaze, isHeld: true, x, y, cx: x, cy: y }
          : { ...gaze, isHeld: true, x, y };
    },

    setGazeAlways(always: boolean) {
      gaze = { ...gaze, isAlways: always };
    },

    look(target: string) {
      const t = LOOK_TARGETS[target] ?? LOOK_TARGETS.center;
      lookTransition = {
        t: 0,
        fromRot: rotEuler,
        toRot: t.rot,
        fromPos: posOffset,
        toPos: t.pos
      };
    },

    setGlow(_glow: any) {},

    advance(dt: number) {
      const maxDt = getEngineConfig()?.motion?.maxStepDt ?? 0.1;
      const stepDt = Math.min(dt, maxDt);
      updateGaze(stepDt);

      if (isPlaying) {
        currentTime += stepDt;
        if (currentTime >= currentClip.duration) {
          if (isLooping) {
            loopCount += 1;
            currentTime = currentTime % currentClip.duration;
          } else {
            currentTime = currentClip.duration;
            isPlaying = false;
          }
        }
        syncTracks();
      }

      if (lookTransition != null) {
        lookTransition.t += stepDt;
        const transDur = getEngineConfig()?.motion?.lookTransitionDuration ?? 0.5;
        const progress = Math.min(lookTransition.t / transDur, 1);
        const factor = solveCubicBezier(progress, 0.42, 0, 0.58, 1);
        rotEuler = [
          lookTransition.fromRot[0] + (lookTransition.toRot[0] - lookTransition.fromRot[0]) * factor,
          lookTransition.fromRot[1] + (lookTransition.toRot[1] - lookTransition.fromRot[1]) * factor,
          lookTransition.fromRot[2] + (lookTransition.toRot[2] - lookTransition.fromRot[2]) * factor
        ];
        posOffset = [
          lookTransition.fromPos[0] + (lookTransition.toPos[0] - lookTransition.fromPos[0]) * factor,
          lookTransition.fromPos[1] + (lookTransition.toPos[1] - lookTransition.fromPos[1]) * factor
        ];
        if (progress >= 1) {
          rotEuler = lookTransition.toRot;
          posOffset = lookTransition.toPos;
          lookTransition = null;
        }
      }

      exprState.step(stepDt);

      if (blendedBodies.length > 0) {
        const springDt = getEngineConfig()?.physics?.springSubStepDt ?? SPRING_DT;
        const blendSpeed = getEngineConfig()?.physics?.bodyBlendSpeed ?? BODY_BLEND_SPEED;
        const blendDamping = getEngineConfig()?.physics?.bodyBlendDamping ?? 1;
        const subSteps = Math.max(1, Math.ceil(stepDt / springDt));
        const subDt = stepDt / subSteps;
        for (let i = 0; i < subSteps; i++) {
          stepSpring(bodySpring, blendSpeed, blendDamping, subDt);
        }
        if (Math.abs(bodySpring.x - 1) < 1e-3 && Math.abs(bodySpring.v) < 0.01) {
          bodySpring.x = 1;
          bodySpring.v = 0;
          blendedBodies = [];
        }
      }

      activePokes = activePokes
        .map((p) => ({ ...p, t: p.t + stepDt }))
        .filter((p) => p.t < getPokeDuration(p.poke));
    },

    frame() {
      const gazeOffset =
        gaze.isAlways && isPlaying && !isPaused
          ? computeGazeOrientation(currentBody, gaze.cx, gaze.cy)
          : null;
      const gazeFactor = getEngineConfig()?.gaze?.gazeFactor ?? GAZE_FACTOR;
      const gazeHold = gazeFactor * gaze.hold;
      const pokeOffset = computePokesOffset(activePokes);

      const targetRot: [number, number, number] = [
        rotEuler[0] + (gazeOffset ? gazeOffset.rx * gazeHold : 0) + pokeOffset.pitch,
        rotEuler[1] + (gazeOffset ? gazeOffset.ry * gazeHold : 0) + pokeOffset.yaw,
        rotEuler[2]
      ];

      const targetPos: [number, number] = [
        posOffset[0] + (gazeOffset ? gazeOffset.px * gazeHold : 0),
        posOffset[1] + (gazeOffset ? gazeOffset.py * gazeHold : 0) + pokeOffset.lift
      ];

      const targetSquash: [number, number] = [
        squashScale[0] * pokeOffset.squash[0],
        squashScale[1] * pokeOffset.squash[1]
      ];

      const quat = quatFromEuler(
        targetRot[0] * DEG2RAD,
        targetRot[1] * DEG2RAD,
        targetRot[2] * DEG2RAD
      );

      return {
        body: currentBody,
        quat,
        zoom: currentZoom,
        offset: targetPos,
        squash: targetSquash,
        squashAnchor,
        eyes: exprState.eyes(),
        glow: null,
        inspectWeight: exprState.inspectWeight(),
        bodies: getBlendedBodies(),
        morph: null
      };
    }
  };
}
