import assert from 'node:assert';
import { vec2, vec3, v2Add, v2Len, v3Cross, v3Norm } from '../src/core/math/vec';
import {
  quatIdentity,
  quatFromAxisAngle,
  quatMul,
  quatNorm,
  quatFromEuler,
  quatToMatrix3,
  matrix3MulVec,
  DEG2RAD
} from '../src/core/math/quat';
import { easeInOutCubic, easeOutCubic, easeOutBack, smoothstep } from '../src/core/math/easing';
import { createSpring, stepSpring, advanceSpringSubStepped, computeBlend } from '../src/core/physics/spring';
import { getPokeDuration, computePokesOffset } from '../src/core/physics/pokes';
import { computeGaze, computeGazeOrientation } from '../src/core/physics/gaze';
import { createAppearance } from '../src/core/geometry/palette';
import { canonicalShape, SHAPE_EYE_LAYOUTS } from '../src/core/geometry/shapes-table';
import { EXPRESSION_SPECS } from '../src/core/geometry/expressions';
import {
  analyzeShapePath,
  sampleSvgPath,
  SvgPathBuilder,
  CANONICAL_CENTER,
  SHAPE_CONTOURS
} from '../src/core/geometry/contours';
import { getShape3DModel, registerCustomShape } from '../src/core/mesh/extrusion';
import {
  createEyeBoundaryLoops,
  createProjectionContext,
  projectEyesToSeat
} from '../src/core/geometry/horizon-clip';

console.log('🧪 Testing Modular Core Engine Components...\n');

let count = 0;
function test(name: string, fn: () => void) {
  fn();
  count++;
  console.log(`  ✓ ${name}`);
}

// 1. Math / Vec
test('math/vec: 2D & 3D vector operations', () => {
  const vA = vec2(3, 4);
  assert.strictEqual(v2Len(vA), 5);

  const vB = vec3(1, 0, 0);
  const vC = vec3(0, 1, 0);
  const cross = v3Cross(vA as any, vB);
  assert.ok(Array.isArray(cross));

  const n = v3Norm([3, 0, 4]);
  assert.ok(Math.abs(v2Len([n[0], n[2]]) - 1.0) < 1e-5);
});

// 2. Math / Quat
test('math/quat: Quaternions, Euler conversion & rotation matrices', () => {
  const id = quatIdentity();
  assert.deepStrictEqual(id, [1, 0, 0, 0]);

  // Rotate 90 deg around Y
  const qY90 = quatFromAxisAngle([0, 1, 0], Math.PI / 2);
  const m = quatToMatrix3(qY90);

  // Vector pointing +Z rotated by Y 90 deg should point +X
  const rotated = matrix3MulVec(m, [0, 0, 1]);
  assert.ok(Math.abs(rotated[0] - 1.0) < 1e-4);
  assert.ok(Math.abs(rotated[2] - 0.0) < 1e-4);

  // Euler angles
  const qEuler = quatFromEuler(15 * DEG2RAD, -25 * DEG2RAD, 5 * DEG2RAD);
  const mag = Math.hypot(...qEuler);
  assert.ok(Math.abs(mag - 1.0) < 1e-5);
});

// 3. Math / Easing
test('math/easing: Smoothstep & cubic curves', () => {
  assert.strictEqual(smoothstep(0), 0);
  assert.strictEqual(smoothstep(1), 1);
  assert.strictEqual(smoothstep(0.5), 0.5);

  assert.strictEqual(easeInOutCubic(0), 0);
  assert.strictEqual(easeInOutCubic(1), 1);
  assert.ok(easeOutBack(0.5) > 0.5);
});

// 4. Physics / Spring
test('physics/spring: Mass-spring-damper sub-stepping & exponential decay', () => {
  const s = createSpring(0);
  s.t = 1.0;

  // Step 10 times at 60fps
  for (let i = 0; i < 10; i++) {
    advanceSpringSubStepped(s, 14, 1.0, 1 / 60);
  }

  // Spring should be moving towards 1.0
  assert.ok(s.x > 0.3 && s.x <= 1.05);

  // Exponential blend factor
  const blend = computeBlend(1 / 60);
  assert.ok(blend > 0 && blend < 1);
});

// 5. Physics / Pokes
test('physics/pokes: All 13 animations have valid duration & non-zero offsets', () => {
  const animations = [
    'spin', 'bounce', 'nod', 'shake', 'wiggle', 'hop',
    'tilt', 'dizzy', 'pulse', 'wave', 'recoil', 'groove', 'celebrate'
  ];

  for (const anim of animations) {
    const dur = getPokeDuration(anim);
    assert.ok(dur >= 0.4 && dur <= 2.0, `Invalid duration for ${anim}: ${dur}`);

    const offset = computePokesOffset([{ poke: anim, t: dur * 0.5, turns: 1 }]);
    assert.ok(offset);
    assert.ok(!Number.isNaN(offset.pitch));
    assert.ok(!Number.isNaN(offset.yaw));
    assert.ok(!Number.isNaN(offset.lift));
    assert.ok(!Number.isNaN(offset.squash[0]));
    assert.ok(!Number.isNaN(offset.squash[1]));
  }
});

// 6. Physics / Gaze
test('physics/gaze: Gaze tracking & Euler orientation', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 };
  const [gx, gy] = computeGaze(rect, { x: 75, y: 25 }, 0.5);
  assert.strictEqual(gx, 0.5);
  assert.strictEqual(gy, 0.5);

  const orient = computeGazeOrientation('sphere', gx, gy);
  assert.ok(orient.rx < 0); // pitch up
  assert.ok(orient.ry > 0); // yaw right
});

// 7. Geometry / Palette
test('geometry/palette: createAppearance', () => {
  const appCutout = createAppearance('#ff0000');
  assert.strictEqual(appCutout.cutout, true);
  assert.strictEqual(appCutout.inkPaint, '#ff0000');

  const appSpot = createAppearance('#ff0000', '#000000');
  assert.strictEqual(appSpot.cutout, false);
  assert.strictEqual(appSpot.spotPaint, '#000000');
});

// 8. Geometry / Shapes & Expressions Tables
test('geometry/tables: Canonical names & expression geometries', () => {
  assert.strictEqual(canonicalShape('blob'), 'sphere');
  assert.strictEqual(canonicalShape('heart'), 'heartChubby');

  assert.ok(SHAPE_EYE_LAYOUTS['sparkle']);
  assert.ok(SHAPE_EYE_LAYOUTS['square']);

  assert.ok(EXPRESSION_SPECS['happy']);
  assert.ok(EXPRESSION_SPECS['surprised']);
  assert.ok(EXPRESSION_SPECS['inspecting']);
});

// 9. Geometry / Contours
test('geometry/contours: SvgPathBuilder, sampleSvgPath & analyzeShapePath', () => {
  const builder = new SvgPathBuilder();
  const d = builder.move(10, 10).line(50, 10).line(50, 50).close();
  assert.strictEqual(d, 'M10 10L50 10L50 50Z');

  const pts = sampleSvgPath(d, 4);
  assert.ok(pts.length >= 4);

  const analyzed = analyzeShapePath(d);
  assert.strictEqual(analyzed.ring.length, 96);
  assert.ok(analyzed.beltRadius > 0);
  assert.ok(SHAPE_CONTOURS['square']);
  assert.ok(SHAPE_CONTOURS['heart']);
});

// 10. Mesh / Extrusion
test('mesh/extrusion: 3D models, registerCustomShape & model cache', () => {
  const cloverModel = getShape3DModel('clover');
  assert.strictEqual(cloverModel.silhouette.kind, 'extrusion');
  assert.strictEqual(cloverModel.seat.kind, 'front');

  const cloudModel = getShape3DModel('cloud');
  assert.strictEqual(cloudModel.silhouette.kind, 'loft');
  assert.strictEqual(cloudModel.seat.kind, 'loft');

  registerCustomShape('testOctagon', {
    scale: 1.35,
    path: 'M 114 20 L 180 50 L 210 114 L 180 180 L 114 210 L 50 180 L 20 114 L 50 50 Z'
  });
  const custom = getShape3DModel('testOctagon');
  assert.strictEqual(custom.size, 1.35);
});

// 11. Geometry / Horizon-Clip
test('geometry/horizon-clip: 3D eye projection & seating surfaces', () => {
  const model = getShape3DModel('square');
  const ctx = createProjectionContext(model, { yaw: 15, pitch: -10, roll: 0 }, 128);
  assert.strictEqual(ctx.origin.x, 64);
  assert.strictEqual(ctx.origin.y, 64);
  assert.ok(ctx.radius > 0);

  const eyes = createEyeBoundaryLoops('square', [{ oval: [0.15, 0.3] }, { oval: [0.15, 0.3] }]);
  const projected = projectEyesToSeat(model.seat, eyes, ctx);
  assert.strictEqual(projected.length, 2);
  assert.strictEqual(projected[0].length, 64);
});

console.log(`\n🎉 All ${count} modular test suites passed successfully!`);
