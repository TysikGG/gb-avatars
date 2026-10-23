import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { computeGaze } from '../core/engine';

export interface UseAvatarGazeOptions {
  enabled?: boolean;
  global?: boolean;
  gazeScale?: number;
}

/**
 * React hook to calculate normalized gaze coordinates from pointer movement.
 *
 * @param targetRef - Ref of the avatar element
 * @param options - Configuration options
 * @returns Normalized gaze [dx, dy] in range [-1, 1], or null if inactive
 */
export function useAvatarGaze(
  targetRef: RefObject<HTMLElement | null>,
  options: UseAvatarGazeOptions = {}
): [number, number] | null {
  const {
    enabled = true,
    global = true,
    gazeScale = 0.5
  } = options;

  const [gaze, setGaze] = useState<[number, number] | null>(null);
  const gazeRef = useRef<[number, number] | null>(null);

  const updateGaze = useCallback((newGaze: [number, number] | null) => {
    if (
      (gazeRef.current === null && newGaze === null) ||
      (gazeRef.current &&
        newGaze &&
        Math.abs(gazeRef.current[0] - newGaze[0]) < 0.005 &&
        Math.abs(gazeRef.current[1] - newGaze[1]) < 0.005)
    ) {
      return;
    }
    gazeRef.current = newGaze;
    setGaze(newGaze);
  }, []);

  useEffect(() => {
    if (!enabled) {
      updateGaze(null);
      return;
    }

    const onPointerMove = (e: PointerEvent | MouseEvent) => {
      const el = targetRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (!global) {
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (!isInside) {
          updateGaze(null);
          return;
        }
      }

      const point = { x: e.clientX, y: e.clientY };
      const computed = computeGaze(rect, point, gazeScale);
      updateGaze(computed);
    };

    const onPointerLeave = () => {
      updateGaze(null);
    };

    const target: Window | HTMLElement | null = global ? window : targetRef.current;
    if (target) {
      target.addEventListener('pointermove', onPointerMove as EventListener, { passive: true });
      target.addEventListener('pointerleave', onPointerLeave as EventListener);
    }

    return () => {
      if (target) {
        target.removeEventListener('pointermove', onPointerMove as EventListener);
        target.removeEventListener('pointerleave', onPointerLeave as EventListener);
      }
    };
  }, [enabled, global, gazeScale, targetRef, updateGaze]);

  return gaze;
}
