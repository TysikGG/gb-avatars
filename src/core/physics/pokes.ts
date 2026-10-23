/**
 * Procedural 3D Physics Animations (Poke Dynamics)
 *
 * Evaluates active animations using the extensible animation registry.
 * All built-in and user-registered animations are evaluated dynamically.
 */

import { getAnimation } from '../animations/registry';
import '../animations/presets'; // Ensure default presets are registered

export interface PokeState {
  poke: string;
  t: number;
  turns: number;
}

export type ActivePoke = PokeState;

export interface PokeOffset {
  pitch: number;
  yaw: number;
  lift: number;
  squash: [number, number];
}

/**
 * Returns the duration of an animation in seconds from the registry.
 */
export function getPokeDuration(poke: string, turns: number = 1): number {
  const anim = getAnimation(poke);
  if (!anim) return 0.5;
  return typeof anim.duration === 'function' ? anim.duration(turns) : anim.duration;
}

/**
 * Calculates blended pitch, yaw, lift, and squash deformations across all active pokes.
 */
export function computePokesOffset(pokes: PokeState[]): PokeOffset {
  let pitch = 0;
  let yaw = 0;
  let lift = 0;
  let squashX = 1;
  let squashY = 1;

  for (const item of pokes) {
    const anim = getAnimation(item.poke);
    if (!anim) continue;

    const duration = typeof anim.duration === 'function' ? anim.duration(item.turns) : anim.duration;
    const progress = Math.min(1, item.t / duration);

    const res = anim.evaluate(progress, item.turns);
    if (res.pitch) pitch += res.pitch;
    if (res.yaw) yaw += res.yaw;
    if (res.lift) lift += res.lift;
    if (res.squash) {
      squashX *= res.squash[0];
      squashY *= res.squash[1];
    }
  }

  return {
    pitch,
    yaw,
    lift,
    squash: [squashX, squashY]
  };
}
