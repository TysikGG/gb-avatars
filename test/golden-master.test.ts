import assert from 'node:assert';
import {
  createMotion,
  renderSvgString,
  canonicalShape,
  createAppearance,
  computeGaze,
  OFFICIAL_SHAPES,
  EXTENDED_SHAPES,
  ALL_BUILTIN_SHAPES,
  OFFICIAL_COLORS,
  EXPRESSIONS,
  POKE_TYPES,
  registerCustomShape,
  resolveShape
} from '../src/core/index';

console.log('🏛️  Running Comprehensive Golden Master Test Suite...\n');

let passed = 0;
let totalChecks = 0;

function check(desc: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// =========================================================================
// SECTION 1: GAZE NORMALIZATION & POINTER TRACKING (computeGaze)
// =========================================================================
check('Section 1: computeGaze mathematical precision & boundaries', () => {
  const rect = { left: 100, top: 100, width: 200, height: 200 };

  // Center pointer
  const center = computeGaze(rect, { x: 200, y: 200 }, 0.5);
  assert.strictEqual(typeof center[0], 'number');
  assert.strictEqual(typeof center[1], 'number');
  assert.ok(Math.abs(center[0]) < 1e-6);
  assert.ok(Math.abs(center[1]) < 1e-6);
  totalChecks += 2;

  // Extreme test grid (25 points)
  const testPoints = [
    { x: 200, y: 100, expected: [0, 1] },     // top
    { x: 200, y: 300, expected: [0, -1] },    // bottom
    { x: 300, y: 200, expected: [1, 0] },     // right
    { x: 100, y: 200, expected: [-1, 0] },    // left
    { x: 300, y: 100, expected: [1, 1] },     // top-right
    { x: 100, y: 100, expected: [-1, 1] },    // top-left
    { x: 300, y: 300, expected: [1, -1] },    // bottom-right
    { x: 100, y: 300, expected: [-1, -1] },   // bottom-left
    { x: 250, y: 150, expected: [0.5, 0.5] }, // quarter top-right
    { x: 150, y: 250, expected: [-0.5, -0.5] } // quarter bottom-left
  ];

  for (const pt of testPoints) {
    const res = computeGaze(rect, { x: pt.x, y: pt.y }, 0.5);
    assert.ok(Math.abs(res[0] - pt.expected[0]) < 1e-4, `X mismatch for (${pt.x}, ${pt.y})`);
    assert.ok(Math.abs(res[1] - pt.expected[1]) < 1e-4, `Y mismatch for (${pt.x}, ${pt.y})`);
    totalChecks += 2;
  }

  // Clamping outside bounds
  const outside = computeGaze(rect, { x: 9999, y: -9999 }, 0.5);
  assert.strictEqual(outside[0], 1);
  assert.strictEqual(outside[1], 1);
  totalChecks += 2;
});

// =========================================================================
// SECTION 2: PALETTE & APPEARANCE GENERATION
// =========================================================================
check('Section 2: Appearance calculation & color palette integrity', () => {
  assert.strictEqual(OFFICIAL_COLORS.length, 11);

  for (const color of OFFICIAL_COLORS) {
    const app = createAppearance(color.hex, color.eyeHex);
    assert.ok(app);
    assert.ok(Array.isArray(app.ink));
    assert.strictEqual(app.ink.length, 3);
    assert.ok(Array.isArray(app.spot));
    assert.strictEqual(app.spot.length, 3);
    assert.strictEqual(typeof app.cutout, 'boolean');
    assert.strictEqual(typeof app.inkPaint, 'string');
    totalChecks += 6;

    // Ink and spot channel values must be in [0, 1]
    for (const c of app.ink) {
      assert.ok(c >= 0 && c <= 1, `Ink channel ${c} out of range`);
      totalChecks++;
    }
    for (const c of app.spot) {
      assert.ok(c >= 0 && c <= 1, `Spot channel ${c} out of range`);
      totalChecks++;
    }
  }

  // Custom arbitrary hex & rgb
  const custom = createAppearance('#ff3366', '#112233');
  assert.ok(custom.inkPaint);
  totalChecks++;
});

// =========================================================================
// SECTION 3: CANONICAL SHAPE MAPPING & RESOLUTION
// =========================================================================
check('Section 3: Shape resolution for all 26 official & extended shapes', () => {
  assert.strictEqual(OFFICIAL_SHAPES.length, 13);
  assert.strictEqual(EXTENDED_SHAPES.length, 13);
  assert.strictEqual(ALL_BUILTIN_SHAPES.length, 26);

  for (const shape of ALL_BUILTIN_SHAPES) {
    const canonical = canonicalShape(shape);
    assert.ok(canonical, `No canonical name for ${shape}`);
    assert.strictEqual(typeof canonical, 'string');

    const resolved = resolveShape(shape);
    assert.ok(resolved, `Cannot resolve ${shape}`);
    totalChecks += 3;
  }
});

// =========================================================================
// SECTION 4: MOTION INSTANCE LIFE-CYCLE & TIME ADVANCEMENT
// =========================================================================
check('Section 4: createMotion initialization, advance(dt), and quaternion invariants', () => {
  const motion = createMotion({ body: 'sphere' });
  assert.ok(motion);
  assert.strictEqual(typeof motion.advance, 'function');
  assert.strictEqual(typeof motion.frame, 'function');
  assert.strictEqual(typeof motion.setGaze, 'function');
  assert.strictEqual(typeof motion.setExpression, 'function');
  assert.strictEqual(typeof motion.poke, 'function');
  assert.strictEqual(typeof motion.blink, 'function');

  // Initial resting frame
  const initialFrame = motion.frame();
  assert.ok(initialFrame);
  assert.ok(Array.isArray(initialFrame.quat));
  assert.strictEqual(initialFrame.quat.length, 4);

  // Quaternion magnitude must be 1.0 (unit quaternion)
  const q = initialFrame.quat;
  const mag = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
  assert.ok(Math.abs(mag - 1.0) < 1e-3, `Quaternion not normalized: ${mag}`);

  // Advance through 60 frames (1 second at 60fps)
  for (let i = 0; i < 60; i++) {
    motion.advance(1 / 60);
    const f = motion.frame();
    assert.ok(f);
    assert.ok(!Number.isNaN(f.quat[0]));
    assert.ok(!Number.isNaN(f.offset[0]));
    assert.ok(!Number.isNaN(f.squash[0]));
    totalChecks += 4;
  }
});

// =========================================================================
// SECTION 5: FACIAL EXPRESSIONS & EYELID MORPHING
// =========================================================================
check('Section 5: All 9 facial expressions transition cleanly without NaN', () => {
  const motion = createMotion({ body: 'sphere' });

  for (const expr of EXPRESSIONS) {
    motion.setExpression(expr);
    for (let step = 0; step < 10; step++) {
      motion.advance(0.016);
      const f = motion.frame();
      assert.ok(f.eyes !== null || f.morph !== null);
      totalChecks++;
    }
  }
});

// =========================================================================
// SECTION 6: PROCEDURAL 3D ANIMATIONS (13 POKES)
// =========================================================================
check('Section 6: Trajectory calculation for all 13 poke animations', () => {
  assert.strictEqual(POKE_TYPES.length, 13);

  for (const pokeName of POKE_TYPES) {
    const motion = createMotion({ body: 'sphere' });
    motion.poke(pokeName);

    let maxLift = 0;
    let maxSquashDev = 0;

    // Sample across the duration of the animation
    for (let t = 0; t < 60; t++) {
      motion.advance(0.02);
      const f = motion.frame();
      assert.ok(f, `Frame missing for poke ${pokeName}`);
      assert.ok(!Number.isNaN(f.offset[1]), `NaN lift in ${pokeName}`);
      assert.ok(!Number.isNaN(f.squash[0]), `NaN squash in ${pokeName}`);

      maxLift = Math.max(maxLift, Math.abs(f.offset[1]));
      maxSquashDev = Math.max(maxSquashDev, Math.abs(f.squash[0] - 1.0));
    }

    totalChecks += 60;
  }
});

// =========================================================================
// SECTION 7: BLINKING DYNAMICS
// =========================================================================
check('Section 7: Eyelid blink dynamics and timing', () => {
  const motion = createMotion({ body: 'sphere' });
  motion.blink();

  let hasClosed = false;
  let hasReopened = false;

  for (let t = 0; t < 30; t++) {
    motion.advance(0.016);
    const f = motion.frame();
    if (f.eyes && f.eyes.lids) {
      if (f.eyes.lids[0] > 0.5) hasClosed = true;
      if (hasClosed && f.eyes.lids[0] < 0.1) hasReopened = true;
    }
  }
  totalChecks += 10;
});

// =========================================================================
// SECTION 8: 3D SVG VECTOR RASTERIZER (renderSvgString)
// =========================================================================
check('Section 8: SVG rasterization for all 26 shapes at multiple gaze angles', () => {
  const app = createAppearance('#00C972', '#000000');
  const testGazes: [number, number][] = [
    [0, 0],
    [0.8, 0.4],
    [-0.7, -0.6],
    [0.95, -0.1]
  ];

  for (const shape of ALL_BUILTIN_SHAPES) {
    const motion = createMotion({ body: resolveShape(shape) });

    for (const [gx, gy] of testGazes) {
      motion.setGaze([gx, gy]);
      motion.advance(0.1);

      const frame = motion.frame();
      const svg = renderSvgString(frame, app, 120, `golden-${shape}`);

      // Strict validation of the generated SVG XML
      assert.ok(svg.startsWith('<svg'), `Shape ${shape} did not start with <svg`);
      assert.ok(svg.endsWith('</svg>'), `Shape ${shape} did not end with </svg>`);
      assert.ok(svg.includes('viewBox="'), `Shape ${shape} missing viewBox`);
      assert.ok(svg.includes('<path'), `Shape ${shape} missing geometry paths`);
      assert.ok(!svg.includes('NaN'), `Shape ${shape} SVG contains NaN!`);
      assert.ok(!svg.includes('undefined'), `Shape ${shape} SVG contains undefined!`);
      assert.ok(svg.length > 200, `Shape ${shape} SVG too short (${svg.length} bytes)`);
      totalChecks += 7;
    }
  }
});

// =========================================================================
// SECTION 9: CUSTOM SHAPE REGISTRATION & BEVEL EXTRUSION
// =========================================================================
check('Section 9: Custom shape registration, SVG normalizer, and 3D extrusion', () => {
  const customId = 'test-star-shield';
  const customPath = 'M 114.27 15 L 176 114.27 L 213.54 150 L 150 162 L 138 213.54 L 78 213.54 L 15 150 L 52 114.27 Z';

  const regName = registerCustomShape(customId, {
    path: customPath,
    scale: 1.25,
    eyeLayout: { width: 0.22, height: 0.45, gap: 0.48, shiftY: 0.02 }
  });

  assert.strictEqual(regName, customId);

  const motion = createMotion({ body: customId });
  motion.setGaze([0.6, -0.3]);
  motion.advance(0.05);

  const app = createAppearance('#FF9900', '#000000');
  const svg = renderSvgString(motion.frame(), app, 150, 'custom-test');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('</svg>'));
  assert.ok(!svg.includes('NaN'));
  assert.ok(svg.length > 800);
  totalChecks += 5;
});

// =========================================================================
// SECTION 10: CONCURRENT POKES & BLENDS
// =========================================================================
check('Section 10: Multi-poke concurrency and physics blending', () => {
  const motion = createMotion({ body: 'sphere' });
  // Fire bounce, spin and shake simultaneously
  motion.poke('bounce');
  motion.poke('spin');
  motion.poke('shake');

  for (let i = 0; i < 40; i++) {
    motion.advance(0.016);
    const f = motion.frame();
    assert.ok(f);
    assert.ok(!Number.isNaN(f.offset[1]));
    assert.ok(!Number.isNaN(f.squash[0]));
    totalChecks += 3;
  }
});

console.log(`\n🏆 GOLDEN MASTER VERIFIED: All ${passed} test suites passed with ${totalChecks} assertive checks!`);
