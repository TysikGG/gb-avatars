import assert from 'node:assert';
import {
  createMotion,
  renderSvgString,
  canonicalShape,
  createAppearance,
  computeGaze,
  OFFICIAL_SHAPES,
  EXTENDED_SHAPES,
  OFFICIAL_COLORS,
  DEFAULT_COLOR,
  getAvatarAppearance,
  resolveColorHex,
  resolveEyeColorHex,
  EXPRESSIONS,
  registerCustomShape,
  resolveShape
} from '../src/core/index';

console.log('🧪 Starting GB Avatars Test Suite...\n');

let passedTests = 0;

function it(desc: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Core Engine Verification
it('should verify essential engine exports', () => {
  assert.strictEqual(typeof createMotion, 'function');
  assert.strictEqual(typeof renderSvgString, 'function');
  assert.strictEqual(typeof canonicalShape, 'function');
  assert.strictEqual(typeof createAppearance, 'function');
  assert.strictEqual(typeof computeGaze, 'function');
  assert.strictEqual(typeof registerCustomShape, 'function');
});

// 2. Official Shapes
it('should render all 13 official shapes to valid SVG markup', () => {
  const app = createAppearance('#00C972', '#000000');
  assert.strictEqual(OFFICIAL_SHAPES.length, 13);

  for (const shape of OFFICIAL_SHAPES) {
    const motion = createMotion({ body: resolveShape(shape) });
    motion.advance(0.016);
    const svg = renderSvgString(motion.frame(), app, 100, `test-${shape}`);
    assert.ok(svg.startsWith('<svg'), `Shape ${shape} did not start with <svg`);
    assert.ok(svg.includes('</svg>'), `Shape ${shape} missing </svg>`);
    assert.ok(svg.length > 500, `Shape ${shape} SVG output unexpectedly small (${svg.length} bytes)`);
  }
});

// 3. Extended Shapes
it('should render all 13 extended shapes to valid SVG markup', () => {
  const app = createAppearance('#1084FE', '#000000');
  assert.strictEqual(EXTENDED_SHAPES.length, 13);

  for (const shape of EXTENDED_SHAPES) {
    const motion = createMotion({ body: resolveShape(shape) });
    motion.advance(0.016);
    const svg = renderSvgString(motion.frame(), app, 100, `test-${shape}`);
    assert.ok(svg.startsWith('<svg'), `Extended shape ${shape} did not start with <svg`);
    assert.ok(svg.includes('</svg>'), `Extended shape ${shape} missing </svg>`);
  }
});

// 4. Color Palette
it('should generate valid appearance for all 11 official colors', () => {
  assert.strictEqual(OFFICIAL_COLORS.length, 11);
  for (const col of OFFICIAL_COLORS) {
    const app = createAppearance(col.hex, col.eyeHex);
    assert.ok(app);
    assert.ok(app.inkPaint);
  }
});

// 5. Facial Expressions
it('should apply all 9 expressions without error', () => {
  const motion = createMotion({ body: 'sphere' });
  for (const expr of EXPRESSIONS) {
    motion.setExpression(expr);
    motion.advance(0.016);
    const frame = motion.frame();
    assert.ok(frame);
  }
});

// 6. Gaze Normalization
it('should accurately normalize pointer gaze in range [-1, 1]', () => {
  const rect = { left: 100, top: 100, width: 200, height: 200 };

  // Center pointer -> [0, 0]
  const centerGaze = computeGaze(rect, { x: 200, y: 200 }, 0.5);
  assert.ok(Math.abs(centerGaze[0]) < 1e-6);
  assert.ok(Math.abs(centerGaze[1]) < 1e-6);

  // Right pointer (X > center) -> positive X
  const rightGaze = computeGaze(rect, { x: 300, y: 200 }, 0.5);
  assert.strictEqual(rightGaze[0], 1);

  // Top pointer (Y < center, Y is inverted) -> positive Y
  const topGaze = computeGaze(rect, { x: 200, y: 100 }, 0.5);
  assert.strictEqual(topGaze[1], 1);
});

// 7. Custom Shape Registration
it('should register and render a custom 3D shape', () => {
  const customName = 'test-hexagon-shield';
  const registered = registerCustomShape(customName, {
    path: 'M 114.27 20 L 190 70 L 190 150 L 114.27 200 L 40 150 L 40 70 Z',
    scale: 1.25,
    eyeLayout: { width: 0.22, height: 0.45, gap: 0.5, shiftY: 0 }
  });

  assert.strictEqual(registered, customName);

  const motion = createMotion({ body: customName });
  motion.advance(0.016);
  motion.setGaze([0.5, 0.5]);

  const app = createAppearance('#FF6700', '#000000');
  const svg = renderSvgString(motion.frame(), app, 120, 'test-custom');
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('</svg>'));
  assert.ok(svg.length > 1000);
});

// 8. Poke Actions
it('should execute all 13 poke animations and blinking', () => {
  const motion = createMotion({ body: 'sphere' });
  const pokes = [
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

  for (const poke of pokes) {
    motion.poke(poke);
    motion.advance(0.1);
    assert.ok(motion.frame(), `Frame generation failed for poke: ${poke}`);
  }

  motion.blink();
  let minLidY = 1.0;
  for (let i = 0; i < 20; i++) {
    motion.advance(0.016);
    const f = motion.frame();
    minLidY = Math.min(minLidY, f.eyes[0].lidY);
  }
  assert.ok(minLidY < 0.1, `Blink failed to close eyelid (min lidY was ${minLidY})`);
  assert.strictEqual(motion.frame().eyes[0].lidY, 1.0, 'Blink failed to reopen eyelid to 1.0');
});

// 9. Color Resolution & ColorDefinition Support
it('should resolve colors from hex, color names, and ColorDefinition objects without crashing', () => {
  // Direct hex string
  assert.strictEqual(resolveColorHex('#FF0000'), '#FF0000');
  // Official color ID
  assert.strictEqual(resolveColorHex('red'), '#FF263C');
  assert.strictEqual(resolveColorHex('blue'), '#1084FE');
  // ColorDefinition object
  assert.strictEqual(resolveColorHex(DEFAULT_COLOR), DEFAULT_COLOR.hex);
  assert.strictEqual(resolveColorHex(OFFICIAL_COLORS[0]), OFFICIAL_COLORS[0].hex);
  // Custom object with hex
  assert.strictEqual(resolveColorHex({ hex: '#abcdef' } as any), '#abcdef');
  // Null / undefined fallback
  assert.strictEqual(resolveColorHex(undefined), '#00C972');

  // Eye color resolution
  assert.strictEqual(resolveEyeColorHex('#111111'), '#111111');
  assert.strictEqual(resolveEyeColorHex(OFFICIAL_COLORS[0]), OFFICIAL_COLORS[0].eyeHex);
  assert.strictEqual(resolveEyeColorHex(undefined, '#123456'), '#123456');

  // getAvatarAppearance with ColorDefinition
  for (const col of OFFICIAL_COLORS) {
    const app = getAvatarAppearance(col);
    assert.ok(app);
    assert.ok(app.inkPaint);
  }

  // getAvatarAppearance with color ID string
  const redApp = getAvatarAppearance('red');
  assert.ok(redApp);

  // getAvatarAppearance with mixed object and string
  const customApp = getAvatarAppearance(DEFAULT_COLOR, '#333333');
  assert.ok(customApp);
});

console.log(`\n🎉 All ${passedTests} tests passed successfully!`);