# GB Avatars (gb-avatars) 🤖

> **High-Performance Procedural 3D Vector Avatar Engine & React Library.**  
> Pure CPU mathematical SVG rasterization, dynamic perspective eye tracking, natural blinking, 9 facial expressions, 120Hz sub-stepped spring physics, dynamic runtime config, and extensible Custom Shape & Animation APIs.  
> **Zero Canvas. Zero WebGL. 100% Scalable Vector Graphics.**

👉 **[Live Demo](https://tysikgg.github.io/gb-avatars/)**

[![React](https://img.shields.io/badge/React-18%20%2F%2019-61dafb?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25%20Strict-3178c6?logo=typescript&logoColor=white)](./src/core/types.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/Tests-2208%2B%20Passing-brightgreen)](./test/golden-master.test.ts)

---

## ✨ Key Features

- 📐 **Zero Canvas / Zero WebGL**: 100% pure SVG `<path>` rasterization computed analytically on the CPU. Ultra-crisp at any resolution (Retina, 4K, 8K), zero GPU context switching, instant DOM hydration, CSS-styleable, and inspectable.
- 👁️ **Dynamic Perspective Eye Dilation**: When the avatar rotates in 3D, the eye closer to the camera expands while the receding eye contracts according to a non-linear power-law ratio $(s/c)^l$.
- 🌐 **Geodesic Surface Projection & Horizon Clipping**: Eyes wrap smoothly along curved 3D surfaces in camera space and clip against the $Z \le 0$ horizon plane using great-circle arc clipping, preventing eyes from clipping backwards through the head.
- ⚡ **120Hz Sub-Stepped Spring Physics**: Head tilts, gaze recovery, and pokes integrate via damped harmonic oscillators numerically evaluated at $120\,\text{Hz}$ ($\Delta t = 8.33\,\text{ms}$) to guarantee energy conservation and prevent numerical divergence.
- 🎨 **26 Built-in 3D Shapes**:
  - **13 Official Shapes**: `blob`, `cloud`, `square`, `sparkle`, `clover`, `heart`, `flower`, `teardrop`, `tablet`, `wedge`, `house`, `star`, `hex`.
  - **13 Extended Shapes**: `pebble`, `bean`, `egg`, `squircle`, `capsule`, `cylinder`, `gem`, `crystal`, `shield`, `dome`, `arch`, `leaf`, `pumpkin`.
- 🌈 **11 Curated Color Palettes**: `white`, `brown`, `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `violet`, `magenta`, and `gray`, plus arbitrary custom HEX/RGB/CSS colors with procedural dual-tone lighting.
- 🎭 **9 Facial Expressions**: `neutral`, `happy`, `surprised`, `inspecting`, `sad`, `sleepy`, `squinted`, `calm`, and `confused`.
- 💫 **13 Interactive Poke Animations**: `spin`, `bounce`, `nod`, `shake`, `wiggle`, `hop`, `tilt`, `dizzy`, `pulse`, `wave`, `recoil`, `groove`, and `celebrate`.
- 👁️‍🗨️ **Organic Spontaneous Blinking**: Periodic randomized eyelid closing with smoothstep easing, peak hold, and elastic bounce reopening.
- 🛠️ **Direct SVG & Custom Shape Extrusion**: Supply raw SVG strings, paths, or use `registerCustomShape` to extrude 2D vectors into full 3D beveled meshes with custom eye placement.
- ⚙️ **Reactive Dynamic Engine Config**: 38 behavioral, temporal, and geometric parameters tunable in real-time via `updateEngineConfig()`.
- 🧩 **Extensible Custom Animation Registry**: Register user-defined procedural 3D animations at runtime without altering engine internals.
- 🔄 **Backward Compatibility**: `GbAvatar` and `Gravatar` aliases are exported for seamless drop-in replacement.

---

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install gb-avatars

# Using pnpm
pnpm add gb-avatars

# Using yarn
yarn add gb-avatars
```

*(React 18 or 19 is a peer dependency)*

### Basic React Usage

```tsx
import React from 'react';
import { Avatar } from 'gb-avatars';

export function UserProfile() {
  return (
    <Avatar
      shape="sparkle"
      color="#00C972"
      size={140}
      isFollowingPointer
      interactive
    />
  );
}
```

> **Note**: For backward compatibility, `import { GbAvatar, Gravatar } from 'gb-avatars'` are exported as aliases for `Avatar`.

---

## 📖 Component API

### `<Avatar />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `shape` | `BuiltinShape \| string` | `'sparkle'` | 3D shape name, custom registered shape ID, or raw SVG markup/path. |
| `svg` | `string \| SVGElement` | `null` | Optional direct SVG icon markup to parse and extrude into a 3D avatar. |
| `scale` | `number` | `1.2` | 3D model scale factor for custom SVG shapes. |
| `eyeGap` | `number` | `0.48` | Distance between the left and right eyes. |
| `eyeShiftY` | `number` | `0` | Vertical offset of the eyes along the face surface. |
| `color` | `string` | `'#00C972'` | Primary body color (hex, rgb, or named CSS color). |
| `eyeColor` | `string` | `'#000000'` | Eye contour and pupil color. |
| `size` | `number` | `120` | Canvas width and height in pixels. |
| `expression` | `Expression` | `'neutral'` | Facial expression (`neutral`, `happy`, `surprised`, `inspecting`, `sad`, `sleepy`, `squinted`, `calm`, `confused`). |
| `isFollowingPointer` | `boolean` | `false` | When true, avatar gaze dynamically tracks cursor movement across the window. |
| `lookAt` | `[number, number] \| null` | `null` | Explicit manual normalized gaze `[x, y]` in range `[-1, 1]` ($+y$ is up). |
| `isStatic` | `boolean` | `false` | When true, renders a single static resting frame without starting a `requestAnimationFrame` loop. Ideal for lists and avatar thumbnails. |
| `autoBlink` | `boolean` | `true` | Enables spontaneous natural eyelid blinking. |
| `interactive` | `boolean` | `true` | When true, clicking triggers poke animations. |
| `pokeOnClick` | `PokeType \| string \| false` | `'spin'` | Animation triggered on click (`spin`, `bounce`, `nod`, `shake`, etc., or `false` to disable). |
| `onPoke` | `(type: string) => void` | `undefined` | Callback fired when a poke animation starts. |
| `className` | `string` | `''` | CSS class name applied to container element. |
| `style` | `React.CSSProperties` | `{}` | Inline CSS styling applied to container element. |

---

### Imperative Ref Handle (`AvatarHandle`)

Control avatar state, trigger animations, or query the motion engine imperatively:

```tsx
import React, { useRef } from 'react';
import { Avatar, AvatarHandle } from 'gb-avatars';

export function InteractiveBot() {
  const avatarRef = useRef<AvatarHandle>(null);

  return (
    <div>
      <Avatar ref={avatarRef} shape="clover" color="#1084FE" size={160} />

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button onClick={() => avatarRef.current?.poke('spin')}>💫 Spin</button>
        <button onClick={() => avatarRef.current?.poke('bounce')}>🏀 Bounce</button>
        <button onClick={() => avatarRef.current?.poke('nod')}>👇 Nod</button>
        <button onClick={() => avatarRef.current?.blink()}>👁️ Blink</button>
        <button onClick={() => avatarRef.current?.setExpression('happy')}>😊 Happy</button>
        <button onClick={() => avatarRef.current?.setGaze([0.7, -0.3])}>👀 Look</button>
        <button onClick={() => avatarRef.current?.resetGaze()}>🔄 Reset Gaze</button>
      </div>
    </div>
  );
}
```

---

## 🪝 React Hooks

### `useAvatarGaze`

Allows any component or UI element to compute normalized avatar gaze coordinates from window mouse or touch events:

```tsx
import { useAvatarGaze } from 'gb-avatars';

function CustomGazeTracker() {
  const { gaze, containerRef } = useAvatarGaze({
    invertY: true,
    smooth: true,
    decayBase: 0.86
  });

  return (
    <div ref={containerRef}>
      <p>Current Gaze: X={gaze[0].toFixed(2)}, Y={gaze[1].toFixed(2)}</p>
    </div>
  );
}
```

### `useEngineConfig`

Subscribes to live engine configuration changes for dynamic UI studio controls:

```tsx
import { useEngineConfig, updateEngineConfig } from 'gb-avatars';

function GazeRangeControl() {
  const config = useEngineConfig();

  return (
    <div>
      <label>Yaw Limit: {config.gaze.maxYawDeg}°</label>
      <input
        type="range"
        min="10"
        max="45"
        value={config.gaze.maxYawDeg}
        onChange={(e) => updateEngineConfig({
          gaze: { maxYawDeg: Number(e.target.value) }
        })}
      />
    </div>
  );
}
```

---

## 🛠️ Custom Shapes & Direct SVG Extrusion

### 1. Direct SVG String or Element

Pass raw SVG markup directly into `<Avatar shape={...} />`:

```tsx
<Avatar
  shape={`<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`}
  color="#FF263C"
  size={140}
/>
```

### 2. Registering Named 3D Extruded Shapes

Register a custom vector silhouette once with custom scale and eye layout:

```typescript
import { registerCustomShape, Avatar } from 'gb-avatars';

// Register a 3D Diamond Gem
registerCustomShape('diamond', {
  path: 'M 114.27 15 L 213.54 114.27 L 114.27 213.54 L 15 114.27 Z',
  scale: 1.25,
  eyeLayout: {
    width: 0.22,
    height: 0.45,
    gap: 0.50,
    shiftY: 0.05
  }
});

// Now use it anywhere by name:
<Avatar shape="diamond" color="#9159FE" />
```

---

## 🎬 Custom 3D Procedural Animations

Register user-defined procedural animation trajectories that seamlessly blend into the avatar's physics:

```typescript
import { registerAnimation, Avatar } from 'gb-avatars';

// Register a 3D Backflip animation
registerAnimation('backflip', {
  duration: 0.85,
  label: 'Backflip',
  evaluate: (progress: number) => ({
    pitch: -360 * progress,
    lift: Math.sin(Math.PI * progress) * 0.5,
    squash: [
      1 - 0.25 * Math.sin(Math.PI * progress),
      1 + 0.25 * Math.sin(Math.PI * progress)
    ]
  })
});

// Trigger via click prop or imperative ref:
<Avatar pokeOnClick="backflip" />
```

---

## ⚙️ Dynamic Engine Configuration Reference

Every constant in the engine (except fundamental mathematical invariants like $\pi$) is fully reactive and configurable at runtime without re-mounting or restarting the avatar.

### Complete Parameters Reference Table

The configuration is organized into 5 categories: `physics`, `gaze`, `motion`, `eyes`, and `mesh`.

#### 1. `physics` (`PhysicsConfig`)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `springSubStepDt` | `number` | `0.008333` (`1/120`) | Substep delta time (in seconds) for numerical spring oscillator integration ($120\,\text{Hz}$). Prevents energy divergence. |
| `decayBase` | `number` | `0.86` | Exponential decay base $\beta$ for frame-rate independent pointer gaze smoothing. |
| `referenceDt` | `number` | `0.016667` (`1/60`) | Timestep reference denominator (in seconds) for exponential smoothing curves ($60\,\text{Hz}$). |
| `bodyBlendSpeed` | `number` | `10` | Angular stiffness frequency ($\text{rad/s}$) for morph transitions between 3D shapes. |
| `bodyBlendDamping` | `number` | `1.0` | Damping ratio $\zeta$ for body blend transitions ($1.0$ = critically damped, zero overshoot). |

#### 2. `gaze` (`GazeConfig`)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `gazeFactor` | `number` | `0.55` | Global weight factor controlling head orientation reaction to normalized pointer coordinates. |
| `defaultGazeScale` | `number` | `0.5` | Divisor factor applied to container bounding box radius when normalizing pointer coordinates. |
| `maxPitchDeg` | `number` | `19` | Maximum vertical pitch tilt angle (degrees) for extruded and non-sphere bodies. |
| `maxYawDeg` | `number` | `26` | Maximum horizontal yaw turn angle (degrees) for extruded and non-sphere bodies. |
| `maxPitchDegSphere` | `number` | `14` | Maximum vertical pitch tilt angle (degrees) for spherical bodies. |
| `maxYawDegSphere` | `number` | `18` | Maximum horizontal yaw turn angle (degrees) for spherical bodies. |
| `shiftX` | `number` | `0.07` | Horizontal head center translation offset factor during yaw turns (non-sphere). |
| `shiftY` | `number` | `0.055` | Vertical head center translation offset factor during pitch tilts (non-sphere). |
| `shiftXSphere` | `number` | `0.03` | Horizontal head center translation offset factor during yaw turns (sphere). |
| `shiftYSphere` | `number` | `0.024` | Vertical head center translation offset factor during pitch tilts (sphere). |

#### 3. `motion` (`MotionConfig`)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `defaultZoom` | `number` | `0.6` | Default baseline camera perspective zoom scale factor. |
| `minZoom` | `number` | `0.25` | Minimum allowable camera zoom boundary. |
| `maxZoom` | `number` | `2.5` | Maximum allowable camera zoom boundary. |
| `maxStepDt` | `number` | `0.1` | Maximum simulation timestep (in seconds) clamped per frame to prevent simulation runaway on lag spikes. |
| `blinkDuration` | `number` | `0.26` | Total eyelid blink duration in seconds (closing, holding, reopening). |
| `blinkBounce` | `number` | `1.06` | Elastic overshoot bounce multiplier when eyelids snap open. |
| `morphDuration` | `number` | `0.28` | Duration in seconds of facial expression morph transitions. |
| `lidMorphDuration` | `number` | `0.35` | Duration in seconds for expression transitions crossing through an eyelid blink. |
| `bridgeDuration` | `number` | `0.35` | Duration in seconds for animation clip cross-fade interpolation. |
| `lookTransitionDuration` | `number` | `0.5` | Duration in seconds for interpolating to new lookAt target coordinates. |
| `settleEpsilon` | `number` | `0.001` | Velocity magnitude threshold under which avatar motion state enters idle/settled resting mode. |

#### 4. `eyes` (`EyesConfig`)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `baseEyeGap` | `number` | `0.64` | Baseline horizontal separation distance between left and right eyes. |
| `eyeShiftY` | `number` | `0.0` | Baseline vertical shift offset for eye placement across the face surface ($+y$ moves eyes down). |
| `baseEyeWidth` | `number` | `0.22` | Baseline width radius of an individual eye oval contour. |
| `baseEyeHeight` | `number` | `0.48` | Baseline height radius of an individual eye oval contour. |
| `eyeLoopPoints` | `number` | `64` | Discretization resolution point count for generating analytical eye perimeter loops. |

#### 5. `mesh` (`MeshConfig`)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `defaultScale` | `number` | `1.2` | Baseline 3D model scale factor for custom extruded SVG silhouettes. |
| `defaultHalfDepth` | `number` | `0.36` | Half-depth thickness along $Z$-axis for 3D extruded bodies. |
| `defaultBevel` | `number` | `0.22` | Bevel curvature radius along extruded boundary edges. |
| `bevelSteps` | `number` | `4` | Number of subdivision steps for generating smooth curved bevel transitions. |
| `revolutionSegments` | `number` | `64` | Angular polygon segment count for revolving symmetrical 3D bodies. |
| `loftPower` | `number` | `0.72` | Non-linear heightfield interpolation exponent for front/back dome lofting. |
| `projectedRadiusFactor` | `number` | `0.30508` | Screen radius projection multiplier factor ($0.36 / 1.18$). |

---

### Custom Config Examples

#### 1. Applying a Custom Configuration (`updateEngineConfig`)

Pass any subset of nested keys to update the engine in real-time. Unspecified keys remain at their current or default values:

```typescript
import { updateEngineConfig } from 'gb-avatars';

// Apply custom physics, wider gaze range, and chunky 3D bevels
updateEngineConfig({
  physics: {
    decayBase: 0.92,          // Silky, extra-smooth pointer following
    springSubStepDt: 1 / 240  // Ultra-fine 240Hz physics integration
  },
  gaze: {
    maxYawDeg: 35,            // Wider horizontal turn angle
    maxPitchDeg: 24           // Wider vertical nod angle
  },
  eyes: {
    baseEyeGap: 0.52,         // Bring eyes closer together
    eyeShiftY: 0.04           // Slightly lower eye placement
  },
  mesh: {
    defaultBevel: 0.30        // Chunky rounded 3D bevel
  }
});
```

#### 2. Reading Current Config & Inspecting Delta Diffs

```typescript
import { getEngineConfig, getConfigDiff } from 'gb-avatars';

// Read current active configuration:
const current = getEngineConfig();
console.log('Current eye gap:', current.eyes.baseEyeGap);

// Get only the keys that differ from factory defaults (clean delta):
const diff = getConfigDiff();
console.log('Modified settings:', diff);
```

#### 3. Resetting Configuration (`resetEngineConfig`)

```typescript
import { resetEngineConfig } from 'gb-avatars';

// Reset only the gaze category back to factory defaults:
resetEngineConfig('gaze');

// Reset the entire engine configuration to factory defaults:
resetEngineConfig();
```

---

## 🔬 Technical Architecture & Mathematical Foundations

GB Avatars executes a complete real-time 3D vector graphics pipeline on the CPU, emitting valid, self-contained SVG strings on every frame. Below is the detailed mathematical formulation of each subsystem.

```
+-------------------------------------------------------------------------+
|                              INPUT LAYER                                |
|        Pointer (x, y)   *   Expression State   *   Poke Trajectory       |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                             PHYSICS ENGINE                              |
|   120Hz Sub-Stepped Harmonic Oscillators: d²x/dt² + 2ζω dx/dt + ω²x = 0 |
|   Frame-rate Independent Exponential Smoothing: ΔG = (G_t - G) * (1-β^k)|
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                             ROTATION & SO(3)                            |
|   Euler angles (p, y, r) -> Unit Quaternion q = [w, x, y, z]            |
|   Orthonormal Camera Basis: [M (forward), C (right), T (up)] in R³      |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         GEOMETRY & 3D PROJECTION                        |
|   - QuickHull 3D Mesh: Front Face + Bevel Contour + Back Face Extrusion |
|   - Dynamic Perspective Eye Dilation: Scale = (s/c)^l                   |
|   - Exponential Coordinates: P_surf = cos(l) M + (sin(l)/l)(x T + y C)  |
|   - Horizon Arc Clipping: Analytical Great-Circle Intersection at Z = 0 |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        ANALYTICAL SVG RASTERIZER                        |
|   - 2D Cubic Bézier Decomposition: [p0, p1, p2, p3]                     |
|   - Dual-Tone Dual Linear & Radial Gradient Lighting                    |
|   - Clean SVG String Serialization: <svg><path fill-rule="evenodd" ...  |
+-------------------------------------------------------------------------+
```

### 1. Pointer Normalization & Gaze Estimation

Given screen bounding rectangle dimensions $(w, h)$ and pointer coordinates $(x, y)$, normalized gaze coordinates $(G_x, G_y) \in [-1, 1]^2$ are derived using the avatar radius $r$:

$$r = \max(w, 1) \cdot \text{scale}$$

$$G_x = \text{clamp}\left(\frac{x - c_x}{r}, -1, 1\right), \quad G_y = \text{clamp}\left(-\frac{y - c_y}{r}, -1, 1\right)$$

*(Notice $G_y$ is inverted such that $+1$ represents looking upward).*

To guarantee buttery motion across variable refresh rates ($60\text{Hz}, 120\text{Hz}, 144\text{Hz}, 240\text{Hz}$), gaze is smoothed using frame-rate independent exponential decay:

$$\beta = 0.86, \quad \Delta t_{\text{ref}} = \frac{1}{60}\,\text{s}$$

$$\text{blend} = 1 - \beta^{\frac{\Delta t}{\Delta t_{\text{ref}}}}$$

$$G_{t} \leftarrow G_{t-1} + (G_{\text{target}} - G_{t-1}) \cdot \text{blend}$$

---

### 2. SO(3) Rotations & Quaternions

Head orientation is governed by Euler angles $(\text{pitch}, \text{yaw}, \text{roll})$ converted to a unit quaternion $\mathbf{q} \in \mathbb{H}$ to eliminate gimbal lock:

$$\mathbf{q} = \begin{bmatrix} w \\ x \\ y \\ z \end{bmatrix} = \begin{bmatrix}
\cos\frac{p}{2}\cos\frac{y}{2}\cos\frac{r}{2} + \sin\frac{p}{2}\sin\frac{y}{2}\sin\frac{r}{2} \\
\sin\frac{p}{2}\cos\frac{y}{2}\cos\frac{r}{2} - \cos\frac{p}{2}\sin\frac{y}{2}\sin\frac{r}{2} \\
\cos\frac{p}{2}\sin\frac{y}{2}\cos\frac{r}{2} + \sin\frac{p}{2}\cos\frac{y}{2}\sin\frac{r}{2} \\
\cos\frac{p}{2}\cos\frac{y}{2}\sin\frac{r}{2} - \sin\frac{p}{2}\sin\frac{y}{2}\cos\frac{r}{2}
\end{bmatrix}$$

From $\mathbf{q}$, the $3 \times 3$ orthonormal camera frame matrix is extracted:

$$\mathbf{R} = \begin{bmatrix} \mathbf{M} & \mathbf{C} & \mathbf{T} \end{bmatrix}$$

Where:
- $\mathbf{M} \in \mathbb{R}^3$: Major forward gaze vector (normal to face).
- $\mathbf{C} \in \mathbb{R}^3$: Co-tangent right vector.
- $\mathbf{T} \in \mathbb{R}^3$: Tangent up vector.

---

### 3. 120Hz Sub-Stepped Spring Oscillators

Physical reactions (bounces, head nods, pokes) are modeled by continuous damped harmonic oscillator differential equations:

$$\ddot{x} + 2\zeta\omega \dot{x} + \omega^2 (x - x_{\text{target}}) = 0$$

Where $\omega$ is natural angular frequency and $\zeta$ is damping ratio.

To prevent numerical energy explosion when frame times fluctuate (e.g. background tab switching), the engine runs a numerical sub-stepping loop with fixed $\Delta t_{\text{sub}} = 1/120\,\text{s} \approx 8.33\,\text{ms}$:

$$v_{t+\Delta t} = v_t + \left(-2\zeta\omega v_t - \omega^2 (x_t - x_{\text{target}})\right) \Delta t_{\text{sub}}$$

$$x_{t+\Delta t} = x_t + v_{t+\Delta t} \Delta t_{\text{sub}}$$

---

### 4. Dynamic Perspective Eye Dilation

A defining visual characteristic of the engine is perspective disparity: as the avatar turns left or right, the eye facing the observer dilates while the eye turned away contracts.

This is governed by an empirical power-law ratio parameterized by standard eye scale constants $s = 0.54$, $c = 0.36$, and yaw limit angle $X_r = 20^\circ$:

$$l = \frac{1 + \text{clamp}(\text{yaw} / X_r, -1, 1)}{2} \in [0, 1]$$

$$\text{scale}_{\text{left}} = \left(\frac{c}{s}\right)^l, \quad \text{scale}_{\text{right}} = \left(\frac{s}{c}\right)^l$$

*At maximum yaw turn, the near eye grows by factor $\times 1.5$ while the far eye shrinks to factor $\times 0.67$, creating pronounced 3D volumetric depth without any 3D perspective camera matrix.*

---

### 5. Geodesic Surface Projection & Horizon Arc Clipping

Eyes are not flat 2D decals; they are geodesically mapped onto the curved surface manifold using exponential map coordinates on the unit sphere $S^2$:

$$l = \sqrt{x^2 + y^2}, \quad m = \begin{cases} \frac{\sin(l)}{l} & l > 10^{-12} \\ 1 & l \le 10^{-12} \end{cases}, \quad h = \cos(l)$$

$$\mathbf{P}_{\text{surface}} = h \cdot \mathbf{M} + m \cdot (x \cdot \mathbf{T} + y \cdot \mathbf{C})$$

**Horizon Clipping**: If any vertex of an eye polygon rotates behind the silhouette horizon plane ($Z_{\text{camera}} \le 0$), it is analytically clipped against the great circle horizon arc:

$$\mathbf{P}_{\text{horizon}} = \frac{\mathbf{P} - (\mathbf{P} \cdot \mathbf{M})\mathbf{M}}{\|\mathbf{P} - (\mathbf{P} \cdot \mathbf{M})\mathbf{M}\|}$$

The resulting clipped polygon is dissolved and converted into a continuous SVG path, guaranteeing that eyes never glitch or penetrate backward through the head.

---

### 6. QuickHull 3D Mesh Extrusion & Beveling

For custom shapes or SVG paths, the engine generates full 3D geometry in memory:
1. **Contour Extraction**: The 2D path is discretized into $N$ boundary vertices.
2. **Bevel Loop Construction**: A concentric offset boundary is computed by displacing vertices along their vertex normals by bevel radius $b$.
3. **Face Construction**:
   - Front cap polygon at $+Z$.
   - Bevel quad strip bridging cap to bevel ring.
   - Side extrusion quad strip extending from front bevel to back bevel at $-Z$.
   - Back cap polygon at $-Z$.
4. **3D QuickHull**: A 3D convex hull algorithm triangulates non-convex geometries and generates continuous front/back boundary loops.

---

### 7. Natural Eyelid Blinking Mechanics

Eyelid state $y_{\text{lid}} \in [0.03, 1.0]$ scales vertical eye coordinates directly in the projection kernel:

$$y_{\text{projected}} = y \cdot y_{\text{lid}}$$

During an organic blink:
1. **Closing Phase**: Uses non-linear smoothstep cubic interpolation: $y_{\text{lid}}(t) = 1 - 0.97 \cdot (3t^2 - 2t^3)$.
2. **Peak Hold**: Clamps at minimum slit height $y_{\text{lid}} = 0.03$ for $35\,\text{ms}$.
3. **Reopening Bounce**: Uses an elastic overshoot curve reaching $y_{\text{lid}} = 1.06$ before settling back to $1.00$.

---

## 📁 Repository Structure

```
gb-avatars/
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions: Automated CI & GitHub Pages deploy
├── src/
│   ├── index.ts               # Root library entry point (exports React & Core)
│   ├── core/                  # Pure Vector Engine (zero-dependency ESM)
│   │   ├── engine.ts          # Microkernel facade
│   │   ├── types.ts           # Strict TypeScript interfaces & types
│   │   ├── config.ts          # Reactive dynamic configuration registry (38 parameters)
│   │   ├── shapes.ts          # 26 shape catalog & SVG normalizer
│   │   ├── colors.ts          # 11 color palettes & procedural dual-tone lighting
│   │   ├── expressions.ts     # 9 facial expressions & poke kinematics
│   │   ├── math/              # Vectors, Quaternions, Bézier curves, Easing
│   │   ├── physics/           # 120Hz sub-stepped springs, gaze smoothing, pokes
│   │   ├── geometry/          # Contours, horizon clipping, extrusion, tables
│   │   ├── animations/        # Custom animation registry & 13 built-in presets
│   │   ├── mesh/              # 3D models & QuickHull extrusion
│   │   └── rasterizer/        # Analytical 3D-to-SVG vector serialization
│   ├── react/                 # React 18/19 Library
│   │   ├── Avatar.tsx         # Primary <Avatar /> component (aliases: GbAvatar, Gravatar)
│   │   ├── useAvatarGaze.ts   # Pointer tracking hook
│   │   ├── useEngineConfig.ts # Reactive config subscription hook
│   │   └── index.ts           # React package exports
│   ├── demo/                  # Interactive Playground Studio (not part of library)
│   │   ├── AvatarPicker.tsx   # Demo shape and color picker
│   │   ├── ConfigStudio.tsx   # Real-time engine parameter hot-reloading studio
│   │   ├── CustomShapeStudio.tsx # Custom SVG icon live visualizer
│   │   ├── TelemetryHUD.tsx   # Real-time Euler angles & gaze telemetry
│   │   └── CodeSnippet.tsx    # Live React code generator with config diffs
│   ├── App.tsx                # Playground application
│   └── main.tsx               # Playground entry point
├── test/                      # Comprehensive Test Suites
│   ├── engine.test.ts         # Essential engine & SVG rendering verification
│   ├── golden-master.test.ts  # 2,208+ assertion mathematical invariant checks
│   ├── modules.test.ts        # Modular sub-system unit tests
│   ├── custom-animations.test.ts # Animation registry & lifecycle tests
│   └── config.test.ts         # Dynamic config delta & hot-reload tests
├── package.json               # Dual ESM/CJS packaging config
├── tsconfig.json              # Strict TypeScript settings
├── vite.config.ts             # Playground bundler config
└── vite.config.lib.ts         # Dual ESM/CommonJS library bundler config
```

---

## 🧪 Testing & Verification

The engine is protected by **5 independent test suites** with over **2,200 assertive checks**, guaranteeing mathematical precision and regression protection:

```bash
# Run complete test suite:
npm test

# Run TypeScript typecheck:
npm run typecheck

# Build interactive playground:
npm run build:pages

# Build production library bundle (ESM + CJS + Types):
npm run build:lib
```

All 5 test suites pass with 100% green:
- `engine.test.ts`: Renders all 26 shapes, 11 colors, 9 expressions, and custom 3D SVGs.
- `golden-master.test.ts`: Verifies 2,208 mathematical invariants, quaternion orientations, and eyelid dynamics.
- `modules.test.ts`: Unit tests for vectors, quaternions, spring sub-stepping, and horizon clipping.
- `custom-animations.test.ts`: Verifies dynamic registration and trajectory evaluation.
- `config.test.ts`: Verifies real-time config updates, delta diff computation, and subscriber notifications.

---

## 🧭 Origin & Attribution

This engine was created through clean-room reverse engineering and mathematical reconstruction of the procedural vector avatar system featured in **Grok Bot** (`x.ai`). 

By decompiling, formalizing, and generalizing its underlying geometric projection principles, **GB Avatars** extracts the proprietary vector rasterization techniques into an independent, modular, open-source microkernel architecture. It expands the original foundation with:
- Fully decoupled, zero-dependency mathematical sub-modules.
- 120Hz sub-stepped mass-spring-damper physics with exponential smoothing.
- QuickHull 3D convex hull extrusion from arbitrary 2D vector contours.
- Dynamic runtime configuration system with real-time parameter hot-reloading.
- Pluggable Custom Shape & Procedural Animation registries.
- First-class React 18/19 `<Avatar />` component, hooks, and interactive studio playground.

---

## 📜 License

MIT License. Open-source and free for personal and commercial projects.
