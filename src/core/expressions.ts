import type { Expression, PokeType } from './types.js';

/**
 * 9 Standard facial expressions
 */
export const EXPRESSIONS: Expression[] = [
  'neutral',
  'happy',
  'surprised',
  'inspecting',
  'sad',
  'sleepy',
  'squinted',
  'calm',
  'confused'
];

/**
 * Expression aliases supported by the engine
 */
export const EXPRESSION_ALIASES: Record<string, Expression> = {
  strange: 'inspecting',
  inspect: 'inspecting',
  angry: 'neutral',
  idle: 'neutral',
  smile: 'happy',
  sleep: 'sleepy',
  squint: 'squinted'
};

/**
 * Valid poke animation actions
 */
export const POKE_TYPES: PokeType[] = [
  'spin',
  'bounce',
  'nod',
  'shake',
  'wiggle',
  'hop',
  'tilt',
  'dizzy',
  'pulse',
  'wave',
  'recoil',
  'groove',
  'celebrate'
];

/**
 * Normalize an expression name using aliases if needed
 * @param expr - Expression string or alias
 * @returns Normalized expression name
 */
export function normalizeExpression(expr?: string | Expression | null): Expression {
  if (!expr) return 'neutral';
  const lower = String(expr).toLowerCase().trim();
  if (EXPRESSIONS.includes(lower as Expression)) return lower as Expression;
  if (EXPRESSION_ALIASES[lower]) return EXPRESSION_ALIASES[lower];
  return 'neutral';
}
