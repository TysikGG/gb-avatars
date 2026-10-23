/**
 * Custom Animation Registry for GB Avatars Engine
 *
 * Decouples interactive animation logic from the low-level rendering kernel.
 * Allows users to register arbitrary procedural 3D animations at runtime.
 */

import type { AnimationDefinition } from '../types';

const animationsRegistry = new Map<string, AnimationDefinition>();

/**
 * Registers a new procedural animation or overrides an existing one.
 *
 * @param name - Unique animation identifier (e.g. 'backflip', 'shiver')
 * @param definition - Duration and analytical trajectory evaluation function
 */
export function registerAnimation(name: string, definition: AnimationDefinition): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Animation name must be a non-empty string');
  }
  if (!definition || typeof definition.evaluate !== 'function') {
    throw new Error(`Animation "${name}" must provide an evaluate(progress, turns) function`);
  }
  animationsRegistry.set(name, definition);
}

/**
 * Retrieves an animation definition by name.
 */
export function getAnimation(name: string): AnimationDefinition | undefined {
  return animationsRegistry.get(name);
}

/**
 * Checks if an animation is registered.
 */
export function hasAnimation(name: string): boolean {
  return animationsRegistry.has(name);
}

/**
 * Returns a list of all currently registered animation names.
 */
export function getRegisteredAnimations(): string[] {
  return Array.from(animationsRegistry.keys());
}
