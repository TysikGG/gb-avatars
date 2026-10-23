/**
 * 3D Quaternion and Rotation Math
 * Quaternions are represented in scalar-first format: [w, x, y, z]
 */

import { Vec3, vec3 } from './vec';

export type Quat = [number, number, number, number];

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function quatIdentity(): Quat {
  return [1, 0, 0, 0];
}

/**
 * Creates a quaternion from an axis and rotation angle (in radians).
 */
export function quatFromAxisAngle(axis: Vec3, angleRad: number): Quat {
  const half = angleRad / 2;
  const s = Math.sin(half);
  return [Math.cos(half), axis[0] * s, axis[1] * s, axis[2] * s];
}

/**
 * Multiplies two quaternions (Hamilton product): a * b
 */
export function quatMul(a: Quat, b: Quat): Quat {
  const [w1, x1, y1, z1] = a;
  const [w2, x2, y2, z2] = b;
  return [
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2
  ];
}

/**
 * Normalizes a quaternion to have unit length.
 */
export function quatNorm(q: Quat): Quat {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

/**
 * Creates a rotation quaternion from Euler angles (pitch, yaw, roll) in radians.
 * Rotation order: Z (roll) * Y (yaw) * X (pitch).
 */
export function quatFromEuler(pitchRad: number, yawRad: number, rollRad: number): Quat {
  const qRoll = quatFromAxisAngle([0, 0, 1], rollRad);
  const qYaw = quatFromAxisAngle([0, 1, 0], yawRad);
  const qPitch = quatFromAxisAngle([1, 0, 0], pitchRad);
  return quatMul(qRoll, quatMul(qYaw, qPitch));
}

/**
 * Converts a quaternion to a 3x3 column-major / row-major rotation matrix (9 elements).
 */
export function quatToMatrix3(q: Quat): number[] {
  const [w, x, y, z] = q;
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y - w * z),
    2 * (x * z + w * y),
    2 * (x * y + w * z),
    1 - 2 * (x * x + z * z),
    2 * (y * z - w * x),
    2 * (x * z - w * y),
    2 * (y * z + w * x),
    1 - 2 * (x * x + y * y)
  ];
}

/**
 * Multiplies a 3x3 matrix by a 3D vector.
 */
export function matrix3MulVec(m: number[], v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
  ];
}

/**
 * Extracts Euler angles [pitch, yaw, roll] in radians from a 3x3 rotation matrix.
 */
export function matrix3ToEuler(m: number[]): Vec3 {
  const m00 = m[0], m10 = m[3], m20 = m[6];
  const m12 = m[5], m11 = m[4], m21 = m[7], m22 = m[8];

  const sinPitch = Math.max(-1, Math.min(1, -m20));
  const pitch = Math.asin(sinPitch);

  if (Math.abs(sinPitch) > 0.999999) {
    // Gimbal lock
    return [Math.atan2(-m12, m11), pitch, 0];
  }

  return [
    Math.atan2(m21, m22),
    pitch,
    Math.atan2(m10, m00)
  ];
}

/**
 * Converts a quaternion directly to Euler angles [pitch, yaw, roll] in radians.
 */
export function quatToEuler(q: Quat): Vec3 {
  return matrix3ToEuler(quatToMatrix3(q));
}
