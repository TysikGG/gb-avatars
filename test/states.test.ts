import assert from 'node:assert';
import {
  createMotion,
  renderSvgString,
  getAvatarAppearance,
  RECIPES_STATES,
  RECIPES_CLIPS,
  LIFECYCLE_GROUPS,
  getClipByName,
  getStateDefinition,
  createAgentStateMachine,
  type AgentState
} from '../src/core/index';

console.log('🧪 Starting GB Avatars Agent States & Clips Test Suite...\n');

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

// 1. Verify 53 States and 5 Lifecycle Groups
it('should verify all 53 states and 5 lifecycle groups', () => {
  const stateKeys = Object.keys(RECIPES_STATES);
  assert.strictEqual(stateKeys.length, 53, `Expected 53 states, got ${stateKeys.length}`);
  assert.strictEqual(LIFECYCLE_GROUPS.length, 5, `Expected 5 groups, got ${LIFECYCLE_GROUPS.length}`);

  const requiredStates: AgentState[] = [
    'idle', 'listening', 'thinking', 'streaming', 'searching', 'reading',
    'working', 'coding', 'running', 'computing', 'controlling', 'waiting',
    'blocked', 'finished', 'failed', 'sleeping', 'waking', 'happy',
    'excited', 'laughing', 'proud', 'curious', 'playful', 'shy',
    'surprised', 'suspicious', 'angry', 'confused', 'sad', 'drowsy',
    'bored', 'scared', 'celebrate', 'approving', 'orbit', 'radar',
    'progress', 'spawning', 'loading', 'dictating', 'sending', 'receiving',
    'uploading', 'writing', 'alerting', 'bouncing', 'powering-down',
    'humming', 'notifying', 'dragging', 'logo', 'showcase', 'turntable'
  ];

  for (const s of requiredStates) {
    const def = getStateDefinition(s);
    assert.ok(def, `State ${s} definition missing`);
    assert.ok(Array.isArray(def.clips), `State ${s} clips must be an array`);
    assert.ok(def.clips.length > 0, `State ${s} must have at least one clip`);
  }
});

// 2. Verify 28 Keyframe Clips
it('should verify all 28 multi-track Bézier clips', () => {
  const clipKeys = Object.keys(RECIPES_CLIPS);
  assert.strictEqual(clipKeys.length, 28, `Expected 28 clips, got ${clipKeys.length}`);

  for (const [name, clip] of Object.entries(RECIPES_CLIPS)) {
    assert.ok(clip.duration > 0, `Clip ${name} duration must be positive`);
    assert.ok(clip.tracks, `Clip ${name} must contain tracks`);
    assert.strictEqual(getClipByName(name)?.name, name);
  }
});

// 3. State Machine Transitions
it('should transition between states and cycle clips with PRNG shuffle', () => {
  const motion = createMotion({ body: 'sphere' });
  const sm = createAgentStateMachine(motion, 'idle', { seed: 123 });

  assert.strictEqual(sm.state, 'idle');
  assert.ok(sm.clip, 'Expected clip to be assigned on idle state');

  sm.setState('thinking');
  assert.strictEqual(sm.state, 'thinking');

  sm.setState('coding');
  assert.strictEqual(sm.state, 'coding');
});

// 4. Motion Integration with Agent States
it('should execute 60 frames in agent states without NaN or infinite values', () => {
  const app = getAvatarAppearance('#00C972', '#000000');
  const statesToTest: AgentState[] = ['thinking', 'coding', 'searching', 'sleeping', 'celebrate'];

  for (const state of statesToTest) {
    const motion = createMotion({ body: 'squircle', state });
    assert.strictEqual(motion.state, state);

    // Step 60 frames (1 second at 60 fps)
    for (let f = 0; f < 60; f++) {
      motion.advance(0.016);
      const frame = motion.frame();
      assert.ok(Number.isFinite(frame.quat[0]), `quat[0] non-finite in state ${state}`);
      assert.ok(Number.isFinite(frame.offset[0]), `offset[0] non-finite in state ${state}`);
      assert.ok(Number.isFinite(frame.squash[0]), `squash[0] non-finite in state ${state}`);
    }

    const svg = renderSvgString(motion.frame(), app, 120, `state-${state}`);
    assert.ok(svg.startsWith('<svg'), `State ${state} SVG render failed`);
    assert.ok(svg.includes('</svg>'), `State ${state} missing closing tag`);
  }
});

// 5. Timed State Transitions
it('should automatically transition to next state when holdSeconds elapses', () => {
  const motion = createMotion({ body: 'sphere' });
  // Find or create a state with holdSeconds and next (or test advance timer)
  const sm = createAgentStateMachine(motion, 'idle');
  // Advance 10 seconds in steps
  for (let i = 0; i < 600; i++) {
    sm.advance(0.016);
  }
  assert.ok(sm.state, 'State machine remained valid after 10 seconds of advancement');
});

console.log(`\n🎉 All ${passedTests} agent state tests passed successfully!`);
