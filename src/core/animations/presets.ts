/**
 * Built-in Preset Animations for GB Avatars
 *
 * Implements mathematical trajectories for the 13 default interactive avatar actions.
 */

import { registerAnimation } from './registry';
import { clamp } from '../math/easing';
import type { AnimationDefinition } from '../types';

function bellCurve(t: number, start: number, end: number): number {
  if (t <= start || t >= end) return 0;
  return Math.sin((Math.PI * (t - start)) / (end - start)) ** 2;
}

const LIFT_SCALE = 0.3;
const NOD_PITCH = 16;

export const PRESET_ANIMATIONS: Record<string, AnimationDefinition> = {
  spin: {
    duration: (turns: number = 1) => 0.6 + 0.4 * (Math.max(1, Math.round(turns)) - 1),
    evaluate: (p, turns = 1) => ({
      yaw: 180 * Math.max(1, Math.round(turns)) * (1 - Math.cos(Math.PI * p))
    }),
    label: 'Spin'
  },

  bounce: {
    duration: 0.62,
    evaluate: (p) => {
      const contact = bellCurve(p, 0, 0.18) + bellCurve(p, 0.82, 1);
      const apex = bellCurve(p, 0.18, 0.82);
      const lift = LIFT_SCALE * Math.sin(Math.PI * clamp((p - 0.14) / 0.72, 0, 1));
      return {
        lift,
        squash: [1 + 0.08 * contact - 0.04 * apex, 1 - 0.1 * contact + 0.06 * apex]
      };
    },
    label: 'Bounce'
  },

  nod: {
    duration: 0.5,
    evaluate: (p) => ({
      pitch: NOD_PITCH * bellCurve(p, 0, 1)
    }),
    label: 'Nod'
  },

  shake: {
    duration: 0.6,
    evaluate: (p) => {
      const w = Math.sin(Math.PI * p * 4.5) * (1 - p);
      return {
        yaw: 26 * w,
        pitch: 4 * Math.sin(Math.PI * p * 2.25) * (1 - p)
      };
    },
    label: 'Shake'
  },

  wiggle: {
    duration: 0.65,
    evaluate: (p) => {
      const w = Math.sin(Math.PI * p * 5) * (1 - p);
      return {
        yaw: 14 * w,
        squash: [1 + 0.18 * w, 1 - 0.18 * w]
      };
    },
    label: 'Wiggle'
  },

  hop: {
    duration: 0.7,
    evaluate: (p) => {
      const phase = (p * 2) % 1;
      const hopLift = Math.sin(Math.PI * phase);
      const decay = 1 - p * 0.35;
      const lift = LIFT_SCALE * 1.1 * hopLift * decay;
      const sq = Math.cos(Math.PI * phase) * 0.12 * decay;
      return {
        lift,
        squash: [1 - sq, 1 + sq]
      };
    },
    label: 'Hop'
  },

  tilt: {
    duration: 0.75,
    evaluate: (p) => {
      const w = Math.sin(Math.PI * p) * (1 - p * 0.2);
      return {
        yaw: 22 * Math.sin(Math.PI * 1.5 * p),
        pitch: -14 * w,
        squash: [1 + 0.08 * w, 1]
      };
    },
    label: 'Tilt'
  },

  dizzy: {
    duration: 1.2,
    evaluate: (p) => {
      const decay = Math.pow(1 - p, 1.2);
      const angle = p * Math.PI * 6;
      return {
        yaw: Math.cos(angle) * 32 * decay,
        pitch: Math.sin(angle) * 20 * decay,
        squash: [1 + 0.09 * Math.sin(angle * 2) * decay, 1 - 0.09 * Math.sin(angle * 2) * decay]
      };
    },
    label: 'Dizzy'
  },

  pulse: {
    duration: 0.55,
    evaluate: (p) => {
      const w = Math.sin(Math.PI * p) * Math.cos(Math.PI * p * 1.5);
      const scale = 0.24 * Math.max(0, w);
      return {
        lift: 0.08 * Math.sin(Math.PI * p),
        squash: [1 + scale, 1 + scale]
      };
    },
    label: 'Pulse'
  },

  wave: {
    duration: 0.85,
    evaluate: (p) => {
      const w = Math.sin(Math.PI * p * 3.5) * (1 - p);
      return {
        yaw: 30 * w,
        lift: 0.15 * Math.sin(Math.PI * p),
        pitch: 8 * Math.sin(Math.PI * p * 2) * (1 - p)
      };
    },
    label: 'Wave'
  },

  recoil: {
    duration: 0.45,
    evaluate: (p) => {
      const w = Math.sin(Math.PI * p) * (1 - p * 0.5);
      return {
        pitch: -24 * w,
        lift: -0.15 * w,
        squash: [1 + 0.18 * w, 1 - 0.12 * w]
      };
    },
    label: 'Recoil'
  },

  groove: {
    duration: 1.0,
    evaluate: (p) => {
      const b = Math.sin(Math.PI * p * 4) * (1 - p * 0.3);
      return {
        pitch: 18 * Math.abs(b),
        yaw: 15 * Math.sin(Math.PI * p * 2),
        lift: 0.1 * Math.abs(b),
        squash: [1 + 0.08 * Math.abs(b), 1 - 0.08 * Math.abs(b)]
      };
    },
    label: 'Groove'
  },

  celebrate: {
    duration: 1.1,
    evaluate: (p) => {
      const hop = Math.sin(Math.PI * p);
      const sq = (hop > 0.8 ? -0.1 : 0.12) * hop;
      return {
        lift: LIFT_SCALE * 1.5 * hop,
        yaw: 360 * (1 - Math.cos(Math.PI * p)) * 0.5,
        squash: [1 - sq, 1 + sq]
      };
    },
    label: 'Celebrate'
  }
};

/**
 * Initializes and registers all built-in preset animations.
 */
export function initPresetAnimations(): void {
  for (const [name, def] of Object.entries(PRESET_ANIMATIONS)) {
    registerAnimation(name, def);
  }
}

// Auto-register default presets on load
initPresetAnimations();
