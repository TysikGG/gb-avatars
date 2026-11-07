import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentState } from '../core/types.js';

export interface UseAgentAvatarOptions {
  initialState?: AgentState;
  autoRevertDelay?: number;
  onStateChange?: (state: AgentState, prevState: AgentState) => void;
}

export interface UseAgentAvatarResult {
  state: AgentState;
  setState: (nextState: AgentState, options?: { revertAfterMs?: number }) => void;
  resetState: () => void;
  avatarProps: {
    state: AgentState;
    onStateChange: (state: AgentState, prevState: AgentState) => void;
  };
}

/**
 * React hook to reactively manage and choreograph an AI Agent avatar
 *
 * Supports timed temporary reactions (e.g. state reverts to 'idle' after celebration)
 */
export function useAgentAvatar(options: UseAgentAvatarOptions = {}): UseAgentAvatarResult {
  const { initialState = 'idle', autoRevertDelay, onStateChange } = options;
  const [state, setCurrentState] = useState<AgentState>(initialState);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handleStateChange = useCallback(
    (newState: AgentState, prevState: AgentState) => {
      if (onStateChange) {
        onStateChange(newState, prevState);
      }
    },
    [onStateChange]
  );

  const setState = useCallback(
    (nextState: AgentState, opts?: { revertAfterMs?: number }) => {
      clearTimer();
      setCurrentState(nextState);

      const delay = opts?.revertAfterMs ?? (nextState !== initialState ? autoRevertDelay : undefined);
      if (typeof delay === 'number' && delay > 0) {
        timerRef.current = window.setTimeout(() => {
          setCurrentState(initialState);
          timerRef.current = null;
        }, delay);
      }
    },
    [initialState, autoRevertDelay]
  );

  const resetState = useCallback(() => {
    clearTimer();
    setCurrentState(initialState);
  }, [initialState]);

  return {
    state,
    setState,
    resetState,
    avatarProps: {
      state,
      onStateChange: handleStateChange
    }
  };
}
