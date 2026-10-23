import test from 'node:test';
import assert from 'node:assert';
import {
  getEngineConfig,
  updateEngineConfig,
  resetEngineConfig,
  subscribeEngineConfig,
  getConfigDiff,
  DEFAULT_ENGINE_CONFIG
} from '../src/core/config';
import { computeGazeOrientation, computeGaze } from '../src/core/physics/gaze';
import { getSubStepCount } from '../src/core/physics/spring';
import { createExtrusionModel } from '../src/core/mesh/extrusion';
import { createMotion } from '../src/core/motion/motion';

test('⚙️ Engine Config Suite', async (t) => {
  // Ensure starting with clean defaults
  resetEngineConfig();

  await t.test('should initialize with standard default values', () => {
    const cfg = getEngineConfig();
    assert.strictEqual(cfg.physics.springSubStepDt, 1 / 120);
    assert.strictEqual(cfg.gaze.gazeFactor, 0.55);
    assert.strictEqual(cfg.gaze.maxPitchDeg, 19);
    assert.strictEqual(cfg.motion.blinkDuration, 0.26);
    assert.strictEqual(cfg.eyes.baseEyeGap, 0.64);
    assert.strictEqual(cfg.mesh.defaultHalfDepth, 0.36);
  });

  await t.test('should update single parameter and notify subscribers', () => {
    let notified = false;
    let receivedVal = 0;
    const unsub = subscribeEngineConfig((c) => {
      notified = true;
      receivedVal = c.gaze.gazeFactor;
    });

    const updated = updateEngineConfig({
      gaze: { gazeFactor: 1.25 }
    });

    assert.strictEqual(notified, true);
    assert.strictEqual(receivedVal, 1.25);
    assert.strictEqual(updated.gaze.gazeFactor, 1.25);
    assert.strictEqual(getEngineConfig().gaze.gazeFactor, 1.25);

    unsub();
  });

  await t.test('should dynamically alter computeGazeOrientation limits', () => {
    // Normal defaults: maxPitchDeg = 19
    resetEngineConfig('gaze');
    const standardOrient = computeGazeOrientation('sparkle', 0, 1);
    assert.strictEqual(standardOrient.rx, -19);

    // Dynamic update: maxPitchDeg = 35
    updateEngineConfig({ gaze: { maxPitchDeg: 35 } });
    const boostedOrient = computeGazeOrientation('sparkle', 0, 1);
    assert.strictEqual(boostedOrient.rx, -35);

    // Reset back
    resetEngineConfig('gaze');
    assert.strictEqual(computeGazeOrientation('sparkle', 0, 1).rx, -19);
  });

  await t.test('should dynamically alter spring substep frequency', () => {
    resetEngineConfig('physics');
    // Default: 1/120 -> 12 substeps for 0.1s
    assert.strictEqual(getSubStepCount(0.1), 12);

    // Change to 240Hz (dt = 1/240) -> 24 substeps for 0.1s
    updateEngineConfig({ physics: { springSubStepDt: 1 / 240 } });
    assert.strictEqual(getSubStepCount(0.1), 24);

    resetEngineConfig('physics');
    assert.strictEqual(getSubStepCount(0.1), 12);
  });

  await t.test('should dynamically alter 3D extrusion default bevel', () => {
    resetEngineConfig('mesh');
    const poly = [{ x: -0.5, y: -0.5, z: 0 }, { x: 0.5, y: -0.5, z: 0 }, { x: 0, y: 0.5, z: 0 }];
    const model1 = createExtrusionModel(1.2, poly);
    assert.strictEqual(model1.seat.faceZ, 0.36); // default halfDepth

    // Update halfDepth
    updateEngineConfig({ mesh: { defaultHalfDepth: 0.72 } });
    const model2 = createExtrusionModel(1.2, poly);
    assert.strictEqual(model2.seat.faceZ, 0.72);

    resetEngineConfig('mesh');
  });

  await t.test('should dynamically affect createMotion live gaze blending', () => {
    resetEngineConfig();
    const motion = createMotion({ body: 'sparkle', isGazeAlways: true });
    motion.play();
    motion.setGaze([0, 1]);

    // Advance 1 second to settle gaze
    for (let i = 0; i < 30; i++) {
      motion.advance(1 / 30);
    }

    const frameDefault = motion.frame();
    // Default quat rotated with gazeFactor = 0.55

    // Change gazeFactor to 0 (completely disable gaze influence)
    updateEngineConfig({ gaze: { gazeFactor: 0 } });
    const frameZeroGaze = motion.frame();

    // Rotations must differ
    assert.notDeepStrictEqual(frameDefault.quat, frameZeroGaze.quat);

    resetEngineConfig();
  });

  await t.test('should reset specific category while preserving other categories', () => {
    updateEngineConfig({
      physics: { bodyBlendSpeed: 25 },
      gaze: { maxYawDeg: 55 }
    });

    assert.strictEqual(getEngineConfig().physics.bodyBlendSpeed, 25);
    assert.strictEqual(getEngineConfig().gaze.maxYawDeg, 55);

    // Reset ONLY gaze
    resetEngineConfig('gaze');
    assert.strictEqual(getEngineConfig().gaze.maxYawDeg, 26);
    // Physics must remain modified
    assert.strictEqual(getEngineConfig().physics.bodyBlendSpeed, 25);

    // Full reset
    resetEngineConfig();
    assert.strictEqual(getEngineConfig().physics.bodyBlendSpeed, 10);
  });

  await t.test('should reject non-finite and NaN values safely', () => {
    const originalSpeed = getEngineConfig().physics.bodyBlendSpeed;
    updateEngineConfig({
      physics: { bodyBlendSpeed: NaN, decayBase: Infinity }
    });

    assert.strictEqual(getEngineConfig().physics.bodyBlendSpeed, originalSpeed);
    assert.strictEqual(getEngineConfig().physics.decayBase, 0.86);
  });

  await t.test('should accurately calculate delta diff for custom configurations', () => {
    resetEngineConfig();
    assert.strictEqual(getConfigDiff(), null);

    // Modify eyeGap and eyeShiftY
    updateEngineConfig({
      eyes: { baseEyeGap: 0.62, eyeShiftY: 0.04 }
    });

    const diff = getConfigDiff();
    assert.ok(diff);
    assert.deepStrictEqual(diff.eyes, {
      baseEyeGap: 0.62,
      eyeShiftY: 0.04
    });
    assert.strictEqual(diff.physics, undefined);
    assert.strictEqual(diff.gaze, undefined);

    resetEngineConfig();
    assert.strictEqual(getConfigDiff(), null);
  });
});
