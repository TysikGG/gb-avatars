/**
 * Agent State Machine Coordinator
 *
 * Implements the official Grok Bot state transition machine:
 * - Dynamic clip queue with Mulberry32 PRNG Fisher-Yates shuffle
 * - Support for 53 distinct lifecycle, emotional, and morph states
 * - Automatic transition timer (holdSeconds -> next state)
 * - Coordinated facial expressions and morph modes
 */

import type { MotionInstance } from '../types.js';
import type { AgentState, AgentStateMachine, AgentStateMachineOptions } from './types.js';
import { RECIPES_STATES, getClipByName } from './recipes.js';

/**
 * 32-bit Mulberry PRNG
 */
function createPRNG(seed: number = 1): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle without immediate repeating first element
 */
function shuffleClips(clips: string[], prng: () => number, lastClip: string | null): string[] {
  const arr = [...clips];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  // Ensure the new first element doesn't repeat the previous last played clip if array has > 1 items
  if (lastClip && arr.length > 1 && arr[0] === lastClip) {
    const swapIdx = arr.findIndex((c) => c !== lastClip);
    if (swapIdx > 0) {
      const tmp = arr[0];
      arr[0] = arr[swapIdx];
      arr[swapIdx] = tmp;
    }
  }
  return arr;
}

export function createAgentStateMachine(
  motion: MotionInstance,
  initialState: AgentState = 'idle',
  options: AgentStateMachineOptions = {}
): AgentStateMachine {
  const prng = createPRNG(options.seed ?? 1);
  const queueMap = new Map<string, string[]>();

  let isCompact = options.isCompact ?? false;
  let isResting = options.isResting ?? false;
  let isEmphasis = false;
  let currentState: AgentState = initialState;
  let currentRecipe = RECIPES_STATES[initialState] ?? RECIPES_STATES.idle;
  let stateElapsed = 0;
  let stepIndex = 0;
  let lastLoopCount = motion.loopCount;
  let currentClipName: string | null = null;

  const getAvailableClips = (): string[] => {
    if (isCompact && currentRecipe.compactClips && currentRecipe.compactClips.length > 0) {
      return currentRecipe.compactClips;
    }
    return currentRecipe.clips || ['Idle_B'];
  };

  const isFixedSequence = (): boolean => {
    return currentRecipe.next != null && currentRecipe.holdSeconds == null;
  };

  const getNextClipName = (): string => {
    const clips = getAvailableClips();
    const queueKey = clips.join('|');
    let queue = queueMap.get(queueKey);
    if (!queue || queue.length === 0) {
      queue = shuffleClips(clips, prng, currentClipName);
      queueMap.set(queueKey, queue);
    }
    return queue.shift() || clips[0];
  };

  const syncFace = () => {
    const face = currentRecipe.face ?? (isEmphasis ? 'surprised' : null);
    if (motion.holdFace) {
      motion.holdFace(face);
    } else if (face) {
      motion.setExpression(face);
    }
  };

  const playNextClip = () => {
    const nextClipName = isFixedSequence()
      ? getAvailableClips()[stepIndex] || getAvailableClips()[0]
      : getNextClipName();

    lastLoopCount = motion.loopCount;
    if (!nextClipName || nextClipName === currentClipName) {
      return;
    }

    const clipRecipe = getClipByName(nextClipName);
    if (!clipRecipe) {
      return;
    }

    currentClipName = nextClipName;
    if (motion.load) {
      const isStartPhase = isResting || isFixedSequence();
      const phase = isStartPhase ? 0 : (options.firstPhase ?? prng());
      motion.load(clipRecipe, { phase, isPlaying: true });
    }
    lastLoopCount = motion.loopCount;
  };

  const transitionTo = (nextState: AgentState) => {
    const prevState = currentState;
    const nextRecipe = RECIPES_STATES[nextState] ?? RECIPES_STATES.idle;

    currentState = nextState;
    currentRecipe = nextRecipe;
    stateElapsed = 0;
    stepIndex = 0;

    if (motion.setMorph) {
      motion.setMorph(currentRecipe.morph ?? null);
    }

    syncFace();

    if (!isResting) {
      playNextClip();
    }

    if (options.onStateChange && nextState !== prevState) {
      options.onStateChange(nextState, prevState);
    }
  };

  // Initial setup
  if (isResting && motion.rest) {
    motion.rest();
  } else {
    transitionTo(initialState);
  }

  return {
    get state() {
      return currentState;
    },
    get clip() {
      return currentClipName;
    },
    setState(newState: AgentState) {
      if (newState !== currentState && RECIPES_STATES[newState]) {
        transitionTo(newState);
      }
    },
    setCompact(compact: boolean) {
      isCompact = compact;
    },
    setEmphasis(emphasis: boolean) {
      if (emphasis !== isEmphasis) {
        isEmphasis = emphasis;
        syncFace();
      }
    },
    setResting(resting: boolean) {
      if (resting !== isResting) {
        isResting = resting;
        if (!isResting) {
          playNextClip();
        } else if (motion.rest) {
          motion.rest();
          currentClipName = null;
        }
      }
    },
    advance(dt: number) {
      if (isResting) return;
      stateElapsed += dt;

      // Handle timed transitions (e.g. state holds for 3.5s then switches to next state)
      const next = currentRecipe.next;
      if (next != null && currentRecipe.holdSeconds != null && stateElapsed >= currentRecipe.holdSeconds) {
        transitionTo(next as AgentState);
        return;
      }

      // Handle clip loop completion
      if (motion.loopCount !== lastLoopCount) {
        if (next != null && currentRecipe.holdSeconds == null) {
          stepIndex++;
          if (stepIndex >= getAvailableClips().length) {
            transitionTo(next as AgentState);
            return;
          }
        }
        playNextClip();
      }
    }
  };
}
