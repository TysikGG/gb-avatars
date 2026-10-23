import React from 'react';

export type OfficialShape =
  | 'blob'
  | 'cloud'
  | 'square'
  | 'sparkle'
  | 'clover'
  | 'heart'
  | 'flower'
  | 'teardrop'
  | 'tablet'
  | 'wedge'
  | 'house'
  | 'star'
  | 'hex';

export type ExtendedShape =
  | 'pebble'
  | 'bean'
  | 'egg'
  | 'squircle'
  | 'capsule'
  | 'cylinder'
  | 'gem'
  | 'crystal'
  | 'shield'
  | 'dome'
  | 'arch'
  | 'leaf'
  | 'pumpkin';

export type BuiltinShape = OfficialShape | ExtendedShape;

export type Expression =
  | 'neutral'
  | 'happy'
  | 'surprised'
  | 'inspecting'
  | 'sad'
  | 'sleepy'
  | 'squinted'
  | 'calm'
  | 'confused';

export type PokeType =
  | 'spin'
  | 'bounce'
  | 'nod'
  | 'shake'
  | 'wiggle'
  | 'hop'
  | 'tilt'
  | 'dizzy'
  | 'pulse'
  | 'wave'
  | 'recoil'
  | 'groove'
  | 'celebrate'
  | (string & {});

export interface AnimationResult {
  pitch?: number; // Euler X angle in degrees
  yaw?: number;   // Euler Y angle in degrees
  roll?: number;  // Euler Z angle in degrees
  lift?: number;  // Vertical offset units
  squash?: [number, number]; // [scaleX, scaleY] multipliers
}

export interface AnimationDefinition {
  duration: number | ((turns: number) => number);
  evaluate: (progress: number, turns?: number) => AnimationResult;
  label?: string;
}

export interface EyeLayout {
  width?: number;
  height?: number;
  gap?: number;
  shiftY?: number;
}

export interface CustomShapeOptions {
  path: string | (() => string);
  scale?: number;
  eyeLayout?: EyeLayout;
  label?: string;
  isInternal?: boolean;
}

export interface Appearance {
  ink: [number, number, number];
  spot: [number, number, number];
  cutout: boolean;
  inkPaint: string;
  spotPaint?: string;
}

export interface ColorDefinition {
  id: string;
  label: string;
  hex: string;
  eyeHex: string;
}

export interface MotionInstance {
  readonly isPlaying: boolean;
  readonly time: number;
  readonly duration: number;
  readonly loopCount: number;
  readonly face: string;
  readonly isSettled: boolean;
  advance(dt: number): void;
  frame(): any;
  setBody(body: string, options?: { isInstant?: boolean }): void;
  setExpression(expr: string, options?: { isThroughBlink?: boolean }): void;
  setGaze(gaze: [number, number] | null): void;
  setGazeAlways?(always: boolean): void;
  look?(target: string): void;
  poke(type: PokeType | string, options?: { turns?: number }): void;
  blink(): void;
  play?(): void;
  pause?(): void;
  stop?(): void;
  rest?(): void;
  seek?(time: number): void;
  load?(clipData: any, options?: any): void;
  holdFace?(expr: string | null): void;
  setMorph?(options?: any): void;
  setInspect?(options?: any): void;
  setGlow?(glow: any): void;
  lookAtCoords?(coords: [number, number], options?: any): void;
  cancelLookAt?(): void;
  setZoom?(zoom: number): void;
}

export interface AvatarHandle {
  poke(type?: PokeType | string): void;
  blink(): void;
  setExpression(expression: Expression | string): void;
  setGaze(gaze: [number, number] | null): void;
  resetGaze(): void;
  getMotion(): MotionInstance | null;
}

export type GbAvatarHandle = AvatarHandle;
export type GravatarHandle = AvatarHandle;

export interface AvatarProps {
  shape?: BuiltinShape | string;
  svg?: string | SVGElement | null;
  scale?: number;
  eyeGap?: number;
  eyeShiftY?: number;
  color?: string | ColorDefinition;
  eyeColor?: string | ColorDefinition;
  size?: number;
  expression?: Expression | string;
  isFollowingPointer?: boolean;
  lookAt?: [number, number] | null;
  isStatic?: boolean;
  autoBlink?: boolean;
  interactive?: boolean;
  pokeOnClick?: PokeType | string | false;
  onPoke?: (type: PokeType | string) => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export type GbAvatarProps = AvatarProps;
export type GravatarProps = AvatarProps;
