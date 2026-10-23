import assert from 'node:assert';
import {
  createMotion,
  registerAnimation,
  getAnimation,
  hasAnimation,
  getRegisteredAnimations,
  POKE_TYPES
} from '../src/core/index';

console.log('🎪 Testing Extensible Custom Animation System...\n');

let testsPassed = 0;
function test(name: string, fn: () => void) {
  fn();
  testsPassed++;
  console.log(`  ✓ ${name}`);
}

// 1. All default preset animations are registered
test('presets: all default 13 animations are pre-registered in registry', () => {
  const list = getRegisteredAnimations();
  assert.ok(list.length >= 13, `Expected at least 13 animations, got ${list.length}`);

  for (const name of POKE_TYPES) {
    assert.ok(hasAnimation(name), `Missing preset animation: ${name}`);
    const anim = getAnimation(name);
    assert.ok(anim, `Cannot retrieve animation: ${name}`);
    assert.strictEqual(typeof anim.evaluate, 'function');
  }
});

// 2. Registering a completely custom user animation
test('custom: register and execute "backflip" animation', () => {
  let evaluated = false;

  registerAnimation('backflip', {
    duration: 0.8,
    evaluate: (p) => {
      evaluated = true;
      const lift = Math.sin(Math.PI * p) * 0.5;
      const pitch = -360 * p;
      return {
        pitch,
        lift,
        squash: [1 - 0.2 * Math.sin(Math.PI * p), 1 + 0.2 * Math.sin(Math.PI * p)]
      };
    },
    label: 'Backflip'
  });

  assert.ok(hasAnimation('backflip'));
  const anim = getAnimation('backflip');
  assert.strictEqual(anim?.label, 'Backflip');

  const motion = createMotion({ body: 'sphere' });
  motion.poke('backflip');

  // Advance by half duration (apex of jump)
  motion.advance(0.4);
  const frame = motion.frame();

  assert.ok(evaluated, 'Custom evaluate function was not called!');
  assert.ok(frame, 'No frame generated');
  // At apex, lift should be positive and non-zero
  assert.ok(frame.offset[1] > 0.1, `Expected positive lift at apex, got ${frame.offset[1]}`);
});

// 3. Registering another custom animation: "jitter"
test('custom: register and execute "jitter" high-frequency wobble', () => {
  registerAnimation('jitter', {
    duration: 0.4,
    evaluate: (p) => {
      const decay = 1 - p;
      return {
        yaw: Math.sin(p * 40) * 15 * decay,
        pitch: Math.cos(p * 30) * 8 * decay
      };
    }
  });

  const motion = createMotion({ body: 'sphere' });
  motion.poke('jitter');
  motion.advance(0.1);

  const frame = motion.frame();
  assert.ok(frame);
  assert.ok(!Number.isNaN(frame.quat[0]));
});

// 4. Overriding existing animation
test('override: custom override of an existing animation', () => {
  let customSpinCalled = false;

  registerAnimation('spin', {
    duration: 1.0,
    evaluate: (p, turns = 1) => {
      customSpinCalled = true;
      return { yaw: 720 * p };
    }
  });

  const motion = createMotion({ body: 'sphere' });
  motion.poke('spin');
  motion.advance(0.2);
  const frame = motion.frame();
  assert.ok(frame);

  assert.ok(customSpinCalled, 'Overridden spin was not called');
});

// 5. Validation of invalid registration
test('validation: rejects invalid animation registrations', () => {
  assert.throws(() => {
    registerAnimation('', {} as any);
  });
  assert.throws(() => {
    registerAnimation('broken', {} as any);
  });
});

console.log(`\n🎉 All ${testsPassed} custom animation tests passed successfully!`);
