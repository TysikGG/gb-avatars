/**
 * Agent Lifecycle, Emotion & Morph State Definitions
 */

export type AgentLifecycleState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'streaming'
  | 'searching'
  | 'reading'
  | 'working'
  | 'coding'
  | 'running'
  | 'computing'
  | 'controlling'
  | 'waiting'
  | 'blocked'
  | 'finished'
  | 'failed'
  | 'sleeping'
  | 'waking';

export type AgentReactionState =
  | 'happy'
  | 'excited'
  | 'laughing'
  | 'proud'
  | 'curious'
  | 'playful'
  | 'shy'
  | 'surprised'
  | 'suspicious'
  | 'angry'
  | 'confused'
  | 'sad'
  | 'drowsy'
  | 'bored'
  | 'scared'
  | 'celebrate'
  | 'approving';

export type AgentMorphState =
  | 'orbit'
  | 'radar'
  | 'progress'
  | 'spawning'
  | 'loading'
  | 'dictating'
  | 'sending'
  | 'receiving'
  | 'uploading'
  | 'writing'
  | 'alerting'
  | 'bouncing'
  | 'powering-down';

export type AgentProductState = 'humming' | 'notifying' | 'dragging';
export type AgentBrandState = 'logo' | 'showcase' | 'turntable';

export type AgentState =
  | AgentLifecycleState
  | AgentReactionState
  | AgentMorphState
  | AgentProductState
  | AgentBrandState
  | (string & {});

export interface LifecycleGroup {
  label: string;
  states: AgentState[];
}

export interface StateRecipe {
  clips: string[];
  compactClips?: string[];
  face?: string;
  morph?: string;
  next?: string;
  holdSeconds?: number;
}

export interface KeyframePoint<T> {
  t: number;
  v: T;
  ease?: [number, number, number, number];
  cut?: boolean;
}

export interface ClipRecipe {
  name: string;
  duration: number;
  body?: string;
  squashAnchor?: number;
  workArea?: { start: number; end: number } | null;
  inspect?: { bias?: number; follow?: boolean };
  tracks: {
    position?: KeyframePoint<[number, number]>[];
    rotation?: KeyframePoint<[number, number, number]>[];
    squash?: KeyframePoint<[number, number]>[];
    scale?: KeyframePoint<[number]>[];
    zoom?: KeyframePoint<[number]>[];
    lids?: KeyframePoint<[number]>[];
    expression?: KeyframePoint<string>[];
  };
}

export interface AgentStateMachineOptions {
  seed?: number;
  isCompact?: boolean;
  isResting?: boolean;
  firstPhase?: number;
  onStateChange?: (state: AgentState, prevState: AgentState) => void;
}

export interface AgentStateMachine {
  readonly state: AgentState;
  readonly clip: string | null;
  setState(state: AgentState): void;
  setCompact(compact: boolean): void;
  setEmphasis(emphasis: boolean): void;
  setResting(resting: boolean): void;
  advance(dt: number): void;
}
