import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useId,
  useCallback
} from 'react';
import {
  createMotion,
  renderSvgString,
  computeGaze
} from '../core/engine';
import { getEngineConfig } from '../core/config';
import {
  resolveShape,
  registerCustomShape,
  normalizeSvgPathToMotionLab
} from '../core/shapes.js';
import { getAvatarAppearance } from '../core/colors.js';
import { normalizeExpression } from '../core/expressions.js';
import type {
  AvatarProps,
  AvatarHandle,
  GbAvatarProps,
  GbAvatarHandle,
  GravatarProps,
  GravatarHandle,
  MotionInstance,
  PokeType,
  Expression
} from '../core/types.js';

export type {
  AvatarProps,
  AvatarHandle,
  GbAvatarProps,
  GbAvatarHandle,
  GravatarProps,
  GravatarHandle,
  MotionInstance,
  PokeType,
  Expression
};

const inlineSvgCache = new Map<string, string>();

function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function extractSvgString(input: any): string | null {
  if (!input) return null;
  if (typeof input === 'string') return input;
  if (typeof Element !== 'undefined' && input instanceof Element) {
    return input.outerHTML;
  }
  return null;
}

function isSvgInput(val: any): boolean {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  return (
    s.includes('<svg') ||
    s.includes('<path') ||
    s.includes('<polygon') ||
    s.includes('<circle') ||
    s.includes('<rect') ||
    /^[Mm]\s*[\d.-]/.test(s)
  );
}

function resolveAvatarShape(
  shape: string | undefined,
  svg: string | SVGElement | null | undefined,
  scale: number | undefined,
  eyeGap: number | undefined,
  eyeShiftY: number | undefined
): string {
  const directSvg = extractSvgString(svg) || (isSvgInput(shape) ? extractSvgString(shape) : null);

  if (directSvg) {
    const cfg = getEngineConfig();
    const sc = typeof scale === 'number' ? scale : (cfg?.mesh?.defaultScale ?? 1.2);
    const gap = typeof eyeGap === 'number' ? eyeGap : (cfg?.eyes?.baseEyeGap ?? 0.64);
    const sy = typeof eyeShiftY === 'number' ? eyeShiftY : (cfg?.eyes?.eyeShiftY ?? 0);
    const cacheKey = `svg_${hashString(directSvg)}_${sc}_${gap}_${sy}`;

    if (!inlineSvgCache.has(cacheKey)) {
      try {
        const normalized = normalizeSvgPathToMotionLab(directSvg);
        registerCustomShape(cacheKey, {
          path: normalized,
          scale: sc,
          eyeLayout: { width: 0.22, height: 0.48, gap, shiftY: sy },
          isInternal: true
        });
        inlineSvgCache.set(cacheKey, cacheKey);
      } catch (err) {
        console.warn('Could not parse inline SVG in GbAvatar:', err);
        return 'sphere';
      }
    }
    return inlineSvgCache.get(cacheKey)!;
  }

  return resolveShape(shape || 'sparkle');
}

/**
 * GB Avatars — 3D Vector Avatar Component (Avatar)
 *
 * A high-performance 3D vector avatar rendered using pure SVG mathematics.
 * Features real-time perspective eye tracking, natural blinking, 9 expressions,
 * and poke animations (spin, bounce, nod).
 *
 * Supports passing any SVG string / XML directly via shape or svg prop!
 */
export const Avatar = forwardRef<AvatarHandle, AvatarProps>(function Avatar(
  {
    shape = 'sparkle',
    svg = null,
    scale,
    eyeGap,
    eyeShiftY,
    color = '#00C972',
    eyeColor = '#000000',
    size = 120,
    expression = 'neutral',
    isFollowingPointer = false,
    lookAt = null,
    isStatic = false,
    autoBlink = true,
    interactive = true,
    pokeOnClick = 'spin',
    onPoke,
    className = '',
    style = {},
    onClick,
    ...rest
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<MotionInstance | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const uniqueId = useId().replace(/:/g, '_');

  const canonicalBody = resolveAvatarShape(shape, svg, scale, eyeGap, eyeShiftY);
  const appearance = getAvatarAppearance(color, eyeColor);
  const currentExpression = normalizeExpression(expression);

  // Initialize or update body
  useEffect(() => {
    if (motionRef.current) {
      motionRef.current.setBody(canonicalBody, { isInstant: true });
      if (isStatic && canvasRef.current) {
        for (let i = 0; i < 5; i++) motionRef.current.advance(0.016);
        const svgStr = renderSvgString(
          motionRef.current.frame(),
          appearance,
          size,
          `gb-avatar-${uniqueId}`
        );
        canvasRef.current.innerHTML = svgStr;
      }
      return;
    }

    const motion = createMotion({
      body: canonicalBody,
      isGazeAlways: isFollowingPointer || lookAt !== null
    });

    motion.setExpression(currentExpression);
    motionRef.current = motion;

    // Fast-forward 15 steps so the avatar rests smoothly in initial frame
    for (let i = 0; i < 15; i++) {
      motion.advance(0.016);
    }

    // Render initial frame
    if (canvasRef.current) {
      const svgStr = renderSvgString(
        motion.frame(),
        appearance,
        size,
        `gb-avatar-${uniqueId}`
      );
      canvasRef.current.innerHTML = svgStr;
    }

    return () => {
      motionRef.current = null;
    };
  }, [canonicalBody, uniqueId, isStatic, appearance, size]);

  // Update appearance or size immediately
  useEffect(() => {
    if (motionRef.current && canvasRef.current) {
      const svgStr = renderSvgString(
        motionRef.current.frame(),
        appearance,
        size,
        `gb-avatar-${uniqueId}`
      );
      canvasRef.current.innerHTML = svgStr;
    }
  }, [appearance, size, uniqueId]);

  // Update expression
  useEffect(() => {
    if (motionRef.current) {
      motionRef.current.setExpression(currentExpression);
    }
  }, [currentExpression]);

  // Handle manual lookAt gaze input
  useEffect(() => {
    if (motionRef.current && lookAt) {
      motionRef.current.setGaze(lookAt);
    }
  }, [lookAt]);

  // Continuous animation loop (only if not static)
  useEffect(() => {
    if (isStatic) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    function renderLoop(now: number) {
      const motion = motionRef.current;
      const canvas = canvasRef.current;

      if (motion && canvas) {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;

        motion.advance(dt);
        const svgStr = renderSvgString(
          motion.frame(),
          appearance,
          size,
          `gb-avatar-${uniqueId}`
        );
        canvas.innerHTML = svgStr;
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    }

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isStatic, appearance, size, uniqueId]);

  // Pointer tracking across window if isFollowingPointer is enabled
  useEffect(() => {
    if (!isFollowingPointer || isStatic) return;

    const onPointerMove = (e: MouseEvent | PointerEvent) => {
      const el = containerRef.current;
      const motion = motionRef.current;
      if (!el || !motion) return;

      const rect = el.getBoundingClientRect();
      const gaze = computeGaze(rect, { x: e.clientX, y: e.clientY }, 0.5);
      motion.setGaze(gaze);
    };

    const onPointerLeave = () => {
      if (motionRef.current) {
        motionRef.current.setGaze(null);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [isFollowingPointer, isStatic]);

  // Natural spontaneous blinking timer
  useEffect(() => {
    if (!autoBlink || isStatic) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleBlink(delay?: number) {
      const nextDelay = delay ?? (2500 + Math.random() * 3000);
      timeoutId = setTimeout(() => {
        if (motionRef.current) {
          motionRef.current.blink();
        }
        scheduleBlink();
      }, nextDelay);
    }

    // Trigger first spontaneous blink after 1.5s to show vitality
    scheduleBlink(1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [autoBlink, isStatic]);

  // Trigger poke animation
  const poke = useCallback(
    (type: PokeType | string = 'spin') => {
      if (motionRef.current) {
        motionRef.current.poke(type);
        if (onPoke) onPoke(type);
      }
    },
    [onPoke]
  );

  // Trigger blink animation
  const blink = useCallback(() => {
    if (motionRef.current) {
      motionRef.current.blink();
    }
  }, []);

  // Expose imperative handle via ref
  useImperativeHandle(
    ref,
    () => ({
      poke,
      blink,
      setExpression: (expr: Expression | string) => {
        if (motionRef.current) {
          motionRef.current.setExpression(normalizeExpression(expr));
        }
      },
      setGaze: (gaze: [number, number] | null) => {
        if (motionRef.current) {
          motionRef.current.setGaze(gaze);
        }
      },
      resetGaze: () => {
        if (motionRef.current) {
          motionRef.current.setGaze(null);
        }
      },
      getMotion: () => motionRef.current
    }),
    [poke, blink]
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactive && pokeOnClick) {
      poke(pokeOnClick);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`avatar-host gb-avatar-host gravatar-host ${className}`}
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        lineHeight: 0,
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: interactive ? 'pointer' : 'default',
        ...style
      }}
      {...rest}
    >
      <div
        ref={canvasRef}
        className="avatar-canvas gb-avatar-canvas gravatar-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
});

// Backwards compatibility aliases
export const GbAvatar = Avatar;
export const Gravatar = Avatar;


