/**
 * 2D and 3D Vector Math Utilities
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export function vec2(x: number = 0, y: number = 0): Vec2 {
  return [x, y];
}

export function vec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
  return [x, y, z];
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function v2Add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function v2Sub(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function v2Scale(v: Vec2, s: number): Vec2 {
  return [v[0] * s, v[1] * s];
}

export function v2Dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function v2LenSq(v: Vec2): number {
  return v[0] * v[0] + v[1] * v[1];
}

export function v2Len(v: Vec2): number {
  return Math.hypot(v[0], v[1]);
}

export function v2Norm(v: Vec2): Vec2 {
  const len = v2Len(v);
  return len > 1e-9 ? [v[0] / len, v[1] / len] : [0, 0];
}

export function v3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function v3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function v3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function v3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function v3Cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

export function v3Len(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

export function v3Norm(v: Vec3): Vec3 {
  const len = v3Len(v);
  return len > 1e-9 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
}

export function v3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t)
  ];
}
