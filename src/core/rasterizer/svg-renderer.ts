
// @ts-nocheck
/**
 * 3D Software Vector SVG Rasterizer Engine
 * 
 * Performs 3D vector graphics rendering directly to SVG markup:
 * - Analytical 3D sphere ray-intersection & horizon-arc clipping
 * - 3D extruded polygonal mesh perspective projection & hidden-edge removal
 * - Multi-body shape morphing & spring-weighted cross-fading
 * - Cutout (transparent eye holes) & spot (painted eyes) SVG mask generation
 */

import type { Appearance } from "../types";
import { canonicalShape, SHAPE_EYE_LAYOUTS } from "../geometry/shapes-table";
import { createAppearance } from "../geometry/palette";
import { computeGaze } from "../physics/gaze";
import { registerCustomShape as registerExtrusionShape } from "../mesh/extrusion";
import { getPokeDuration, computePokesOffset } from "../physics/pokes";
import { registerAnimation, getRegisteredAnimations } from "../animations/registry";
var zt = [`blob`, `cloud`, `square`, `sparkle`, `clover`, `heart`, `flower`, `teardrop`, `tablet`, `wedge`, `house`, `star`, `hex`];
var zn = (e) => ({ x: e, v: 0, t: e });
var Bn = (e, t, n, r) => {
  e.v += (-2 * n * t * e.v - t * t * (e.x - e.t)) * r, e.x += e.v * r, (!Number.isFinite(e.x) || !Number.isFinite(e.v)) && (e.x = e.t, e.v = 0);
};
var Vn = 1 / 120;
var Hn = (e) => Math.max(1, Math.ceil(e / Vn));
var F = (e, t, n) => Math.min(n, Math.max(t, e));
var Un = (e) => e < 0.5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2;
var I = (e) => 1 - (1 - e) ** 3;
var Wn = (e) => 1 + 2.70158 * (e - 1) ** 3 + 1.70158 * (e - 1) ** 2;
var Gn = (e) => e * e * (3 - 2 * e);
var Kn = [0.42, 0, 0.58, 1];
var qn = [0.4, 0.06, 0.18, 1];
var Jn = 0.28;
var Yn = 0.35;
var Xn = 0.26;
var Zn = 4.25 / 60;
var Qn = 2 / 60;
var $n = 1.06;
function er(e, t, n) {
  let r = 1 - e;
  return 3 * r * r * e * t + 3 * r * e * e * n + e * e * e;
}
function tr(e, t, n) {
  let r = 1 - e;
  return 3 * r * r * t + 6 * r * e * (n - t) + 3 * e * e * (1 - n);
}
function nr(e, t) {
  let [n, r, i, a] = t, o = e;
  for (let t2 = 0; t2 < 8; t2++) {
    let t3 = er(o, n, i) - e, r2 = tr(o, n, i);
    if (Math.abs(t3) < 1e-6 || Math.abs(r2) < 1e-6) break;
    o = Math.min(1, Math.max(0, o - t3 / r2));
  }
  return er(o, r, a);
}
function rr(e) {
  let t = Math.min(1, Math.max(0, e));
  return t * t * (3 - 2 * t);
}
function ir(e, t) {
  let n = Math.min(0.28, (e ? Qn : Zn) / Math.max(t, 0.05)), r = (1 - n) * 0.42;
  return { u1: r, u2: r + n };
}
function ar(e) {
  let t = Math.min(1, Math.max(0, e));
  if (t < 0.7) {
    let e2 = t / 0.7;
    return (1 - (1 - e2) * (1 - e2)) * $n;
  }
  return $n + -0.06000000000000005 * rr((t - 0.7) / 0.3);
}
function or(e, { u1: t, u2: n }) {
  return e < t ? rr(e / t) : e <= n ? 1 : 1 - rr((e - n) / Math.max(1e-6, 1 - n));
}
var sr = Math.PI / 180;
function cr(e, t) {
  return [e[0] * t[0] - e[1] * t[1] - e[2] * t[2] - e[3] * t[3], e[0] * t[1] + e[1] * t[0] + e[2] * t[3] - e[3] * t[2], e[0] * t[2] - e[1] * t[3] + e[2] * t[0] + e[3] * t[1], e[0] * t[3] + e[1] * t[2] - e[2] * t[1] + e[3] * t[0]];
}
function lr(e, t) {
  let n = Math.sin(t / 2);
  return [Math.cos(t / 2), e[0] * n, e[1] * n, e[2] * n];
}
function ur(e) {
  let t = Math.hypot(e[0], e[1], e[2], e[3]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t, e[3] / t];
}
function dr(e, t) {
  return ur([1 + (e[0] * t[0] + e[1] * t[1] + e[2] * t[2]), e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]]);
}
function fr(e) {
  let [t, n, r, i] = e;
  return [1 - 2 * (r * r + i * i), 2 * (n * r - t * i), 2 * (n * i + t * r), 2 * (n * r + t * i), 1 - 2 * (n * n + i * i), 2 * (r * i - t * n), 2 * (n * i - t * r), 2 * (r * i + t * n), 1 - 2 * (n * n + r * r)];
}
function pr(e, t, n) {
  return cr(lr([0, 0, 1], n), cr(lr([0, 1, 0], t), lr([1, 0, 0], e)));
}
function mr(e) {
  let t = e[0], n = e[3], r = e[5], i = e[4], a = e[6], o = e[7], s2 = e[8], c = Math.max(-1, Math.min(1, -a)), l = Math.asin(c);
  return Math.abs(c) > 0.999999 ? [Math.atan2(-r, i), l, 0] : [Math.atan2(o, s2), l, Math.atan2(n, t)];
}
function hr(e) {
  return mr(fr(e));
}
function L(e, t) {
  return [e[0] * t[0] + e[1] * t[1] + e[2] * t[2], e[3] * t[0] + e[4] * t[1] + e[5] * t[2], e[6] * t[0] + e[7] * t[1] + e[8] * t[2]];
}
var gr = 0.1305;
var _r = [{ A: [0.01722, 0.45638, 0.88962], B: [0.186, 0.20949, 0.95996], N: [0.82924, 0.4906, -0.26773] }, { A: [0.48863, 0.67924, 0.54762], B: [0.65674, 0.43195, 0.61815], N: [0.60389, 0.18972, -0.77416] }];
function vr(e) {
  let t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
}
var yr = (() => {
  let e = [0, 0, 0];
  for (let { A: t, B: n } of _r) {
    let r = vr([t[0] + n[0], t[1] + n[1], t[2] + n[2]]);
    e = [e[0] + r[0], e[1] + r[1], e[2] + r[2]];
  }
  return vr(e);
})();
var br = (() => {
  let e = dr(yr, [0, 0, 1]), t = fr(e), n = 0, r = 0;
  for (let { A: e2, B: i } of _r) {
    let a = L(t, [i[0] - e2[0], i[1] - e2[1], i[2] - e2[2]]);
    n += a[0], r += a[1];
  }
  return cr(lr([0, 0, 1], ((Math.PI / 2 - Math.atan2(r, n) + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2), e);
})();
var xr = (() => {
  let e = fr(br);
  return _r.map(({ A: t, B: n, N: r }) => ({ A: L(e, t), B: L(e, n), N: L(e, r) }));
})();
var Sr = [br[0], -br[1], -br[2], -br[3]];
var Cr = (() => {
  let e = ({ A: e2, B: t2 }) => {
    let n2 = vr([e2[0] + t2[0], e2[1] + t2[1], e2[2] + t2[2]]), r = t2[0] * n2[0] + t2[1] * n2[1] + t2[2] * n2[2], i = vr([t2[0] - r * n2[0], t2[1] - r * n2[1], t2[2] - r * n2[2]]);
    i[1] < 0 && (i = [-i[0], -i[1], -i[2]]);
    let a = [n2[1] * i[2] - n2[2] * i[1], n2[2] * i[0] - n2[0] * i[2], n2[0] * i[1] - n2[1] * i[0]];
    return a[0] * n2[0] < 0 && (a = [-a[0], -a[1], -a[2]]), { M: n2, T: i, C: a };
  }, [t, n] = xr;
  if (t == null || n == null) throw Error(`Motion Lab defines exactly two eye capsules`);
  return [e(t), e(n)];
})();
var wr = `sphere.cloud.square.sparkle.clover.heartChubby.starFlower.teardrop.tablet.wedge.house.star6.pebble.bean.egg.squircle.capsule.cylinder.hex.gem.crystal.shield.dome.arch.leaf.pumpkin`.split(`.`);
var Tr = /* @__PURE__ */ new Set([`pumpkin`]);
var Er = [`neutral`, `happy`, `surprised`, `sad`, `sleepy`, `squinted`, `calm`, `inspecting`, `confused`];
var Dr = 0.26;
var Or = 18;
var kr = /* @__PURE__ */ new Map([[`thinking`, `sad`], [`strange`, `inspecting`], [`angry`, `neutral`], [`inspect`, `inspecting`], [`squint`, `squinted`], [`idle`, `neutral`], [`smile`, `happy`], [`sleep`, `sleepy`]]);
var Ar = /* @__PURE__ */ new Set([`sad`, `happy`, `confused`, `squinted`, `sleepy`]);
function jr(e, t) {
  return [e[t * 6], e[t * 6 + 1]];
}
function Mr(e, t, n) {
  let r = n ? 4 : 2;
  return [e[t * 6] + e[t * 6 + r], e[t * 6 + 1] + e[t * 6 + r + 1]];
}
function Nr(e) {
  let t = [], n = (e2, n2, r, i, a) => {
    for (let o = a; o < 11; o++) {
      let a2 = o / 10, s2 = 1 - a2, c = s2 * s2 * s2, l = 3 * s2 * s2 * a2, u = 3 * s2 * a2 * a2, d = a2 * a2 * a2;
      t.push([c * e2[0] + l * n2[0] + u * r[0] + d * i[0], c * e2[1] + l * n2[1] + u * r[1] + d * i[1]]);
    }
  };
  return n(jr(e, 0), Mr(e, 0, true), Mr(e, 1, false), jr(e, 1), 0), n(jr(e, 1), Mr(e, 1, true), Mr(e, 2, false), jr(e, 2), 1), t;
}
function Pr({ p0: e, p1: t, p2: n, isArc: r }) {
  let [i, a] = e, [o, s2] = t, [c, l] = n, u = Array(Or).fill(0), d = (e2, t2) => {
    u[e2 * 6] = t2[0], u[e2 * 6 + 1] = t2[1];
  }, f2 = (e2, t2) => {
    u[e2 * 6 + 2] = t2[0] - u[e2 * 6], u[e2 * 6 + 3] = t2[1] - u[e2 * 6 + 1];
  }, p = (e2, t2) => {
    u[e2 * 6 + 4] = t2[0] - u[e2 * 6], u[e2 * 6 + 5] = t2[1] - u[e2 * 6 + 1];
  };
  if (r) {
    let e2 = 2 * (i * (s2 - l) + o * (l - a) + c * (a - s2));
    if (Math.abs(e2) > 1e-9) {
      let t3 = i * i + a * a, n2 = o * o + s2 * s2, r2 = c * c + l * l, m2 = (t3 * (s2 - l) + n2 * (l - a) + r2 * (a - s2)) / e2, h2 = (t3 * (c - o) + n2 * (i - c) + r2 * (o - i)) / e2, g2 = Math.hypot(i - m2, a - h2), _ = Math.atan2(a - h2, i - m2), v = Math.atan2(l - h2, c - m2), y = Math.atan2(s2 - h2, o - m2), b = Math.PI * 2, x = (v - _ + b) % b, S = (y - _ + b) % b <= x ? x : x - b, C = (e3) => [m2 + g2 * Math.cos(e3), h2 + g2 * Math.sin(e3)], w = (e3) => [-Math.sin(e3), Math.cos(e3)], T = S / 2, E2 = 4 / 3 * Math.tan(T / 4) * g2, D = [_, _ + T, _ + S];
      for (let e3 = 0; e3 < 3; e3++) {
        let t4 = C(D[e3]), n3 = w(D[e3]);
        d(e3, t4), e3 > 0 && f2(e3, [t4[0] - E2 * n3[0], t4[1] - E2 * n3[1]]), e3 < 2 && p(e3, [t4[0] + E2 * n3[0], t4[1] + E2 * n3[1]]);
      }
      return u;
    }
    let t2 = [(i + c) / 2, (a + l) / 2];
    return d(0, [i, a]), d(1, t2), d(2, [c, l]), p(0, [i + (t2[0] - i) / 3, a + (t2[1] - a) / 3]), f2(1, [t2[0] - (t2[0] - i) / 3, t2[1] - (t2[1] - a) / 3]), p(1, [t2[0] + (c - t2[0]) / 3, t2[1] + (l - t2[1]) / 3]), f2(2, [c - (c - t2[0]) / 3, l - (l - t2[1]) / 3]), u;
  }
  let m = [(i + o) / 2, (a + s2) / 2], h = [(o + c) / 2, (s2 + l) / 2], g = [(m[0] + h[0]) / 2, (m[1] + h[1]) / 2];
  return d(0, [i, a]), d(1, g), d(2, [c, l]), p(0, [i + 2 / 3 * (m[0] - i), a + 2 / 3 * (m[1] - a)]), f2(1, [g[0] + 2 / 3 * (m[0] - g[0]), g[1] + 2 / 3 * (m[1] - g[1])]), p(1, [g[0] + 2 / 3 * (h[0] - g[0]), g[1] + 2 / 3 * (h[1] - g[1])]), f2(2, [c + 2 / 3 * (h[0] - c), l + 2 / 3 * (h[1] - l)]), u;
}
function Fr(e, t, n, r, i) {
  let a = Pr(r);
  return { off: e, tilt: t, wid: n, lidY: 1, oval: i, ovalMix: 0, pts: Nr(a), path: a, fillRing: null };
}
function Ir(e, t, n, r, i) {
  let a = Math.max(0, (t - e) / 2), o = n * Math.PI / 180, s2 = Math.sin(o) * a, c = Math.cos(o) * a;
  return Fr(r, i, e / 2, { p0: [-s2, -c], p1: [0, 0], p2: [s2, c], isArc: false }, [0, 0]);
}
function Lr(e, t, n, r) {
  return Ir(e, t, n, [r, 0], 0);
}
function Rr(e, t, n) {
  let r = { p0: [-e, 0], p1: [0, 0], p2: [e, 0], isArc: false };
  return Fr([n, 0], 0, t, r, [e, t]);
}
function zr(e) {
  return [e, e];
}
var Br = { neutral: zr(Lr(Dr, 0.57, 0, 0)), happy: zr(Fr([0.03, 0.03], 0, gr, { p0: [0.16, -0.04], p1: [0, 0.12], p2: [-0.16, -0.04], isArc: true }, [0, 0])), surprised: zr(Lr(0.42, 0.86, 0, 0.03)), inspecting: [Lr(0.54, 0.54, 0, 0.04), Lr(0.36, 0.36, 0, 0.04)], sad: zr(Lr(Dr, 0.5, -28, -0.05)), sleepy: zr(Fr([0.01, 0], 0, Dr / 2, { p0: [-0.11, 0.025], p1: [0, -0.05], p2: [0.11, 0.025], isArc: false }, [0, 0])), squinted: zr(Lr(Dr, 0.5, 90, 0.01)), calm: zr(Rr(0.296, 0.247, 0.05)), confused: zr(Fr([-0.1, 0], 0, gr, { p0: [0.01, 0.16], p1: [-0.17, 0], p2: [0.01, -0.16], isArc: false }, [0, 0])) };
function Vr(e) {
  return Er.some((t) => t === e);
}
function Hr(e) {
  let t = e.trim().toLowerCase(), n = kr.get(t) ?? t;
  return Vr(n) ? n : `neutral`;
}
function Ur(e) {
  return Ar.has(e);
}
function Wr(e) {
  return !Ur(e) && !Br[e].some(Kr);
}
function R(e, t) {
  return [t(e[0], 0), t(e[1], 1)];
}
function Gr(e) {
  return { ...e, ovalMix: 0 };
}
function Kr(e) {
  return e.oval[0] > 1e-4 && e.oval[1] > 1e-4;
}
function qr(e) {
  if (Kr(e) || e.pts.length < 3) return false;
  let t = e.pts[0], n = e.pts[e.pts.length - 1], r = n[0] - t[0], i = n[1] - t[1], a = r * r + i * i;
  if (a < 1e-8) return false;
  let o = 0;
  for (let n2 of e.pts) {
    let e2 = ((n2[0] - t[0]) * r + (n2[1] - t[1]) * i) / a, s2 = t[0] + e2 * r, c = t[1] + e2 * i, l = Math.hypot(n2[0] - s2, n2[1] - c);
    l > o && (o = l);
  }
  return o > Math.max(0.012, e.wid * 0.2);
}
var Jr = 0.03;
var Yr = 0.42;
var Xr = 20;
function Zr(e, t, n) {
  return e + (t - e) * n;
}
function Qr(e, t, n) {
  return [Zr(e[0], t[0], n), Zr(e[1], t[1], n)];
}
function $r(e, t, n) {
  if (e.length === 0) return [0, 0];
  if (e.length === 1 || n <= 1) return e[0];
  let r = t / (n - 1) * (e.length - 1), i = Math.min(Math.floor(r), e.length - 2);
  return Qr(e[i], e[i + 1], r - i);
}
function ei(e, t, n) {
  let r = { off: Qr(e.off, t.off, n), tilt: Zr(e.tilt, t.tilt, n), wid: Zr(e.wid, t.wid, n), lidY: Zr(e.lidY, t.lidY, n), oval: Qr(e.oval, t.oval, n), ovalMix: 0, fillRing: null };
  if (e.path && t.path && e.path.length === t.path.length) {
    let i2 = t.path, a2 = e.path.map((e2, t2) => Zr(e2, i2[t2], n));
    return { ...r, path: a2, pts: Nr(a2) };
  }
  let i = Math.max(e.pts.length, t.pts.length, 2), a = [];
  for (let r2 = 0; r2 < i; r2++) a.push(Qr($r(e.pts, r2, i), $r(t.pts, r2, i), n));
  return { ...r, path: null, pts: a };
}
function ti(e) {
  if (Kr(e)) {
    let [t2, n2] = e.oval;
    return { cx: e.off[0], cy: e.off[1], ang: t2 >= n2 ? Math.PI / 2 : 0, halfLen: Math.max(t2, n2), halfW: Math.min(t2, n2) };
  }
  let t = e.wid;
  if (e.pts.length < 2) return { cx: e.off[0], cy: e.off[1], ang: e.tilt, halfLen: t, halfW: t };
  let n = e.pts[0], r = e.pts[e.pts.length - 1];
  return { cx: e.off[0] + (n[0] + r[0]) / 2, cy: e.off[1] + (n[1] + r[1]) / 2, ang: Math.atan2(r[0] - n[0], r[1] - n[1]) + e.tilt, halfLen: Math.hypot(r[0] - n[0], r[1] - n[1]) / 2 + t, halfW: t };
}
function ni(e, t) {
  let n = t.ang - e.ang;
  for (; n > Math.PI / 2; ) n -= Math.PI;
  for (; n < -Math.PI / 2; ) n += Math.PI;
  return n;
}
function ri(e, t, n) {
  let r = Math.max(0, e - t), i = Math.max(0, Math.min(1, n)), a = [];
  for (let n2 = 0; n2 < 48; n2++) {
    let o = n2 / 48 * Math.PI * 2, s2 = Math.cos(o), c = Math.sin(o), l = t * s2, u = e * c, d = t / Math.max(Math.abs(s2), 1e-6), f2;
    if (d * Math.abs(c) <= r + 1e-6 && Number.isFinite(d)) f2 = d;
    else {
      let e2 = (c >= 0 ? 1 : -1) * r * c, n3 = Math.max(0, e2 * e2 - r * r + t * t);
      f2 = e2 + Math.sqrt(n3);
    }
    let p = f2 * s2, m = f2 * c;
    a.push([p + (l - p) * i, m + (u - m) * i]);
  }
  return a;
}
function ii(e, t, n, r) {
  return Ir(Math.max(e, 1e-4), Math.max(t, e), 0, r, n);
}
function ai(e, t, n) {
  if (n <= 1e-4) return Gr(e);
  if (n >= 0.995) return Gr(t);
  let r = ti(e), i = ti(t), a = ni(r, i), o = Kr(t), s2 = o ? 1 - (1 - n) ** 3 : n * n * n, c = r.ang + a * n, l = Math.max(r.halfLen + (i.halfLen - r.halfLen) * n, 1e-4), u = Math.max(r.halfW + (i.halfW - r.halfW) * n, 1e-4), d = +!!Kr(e), f2 = d + (+!!o - d) * s2, p = ii(2 * u, 2 * l, c, [r.cx + (i.cx - r.cx) * n, r.cy + (i.cy - r.cy) * n]), m = f2 > 1e-4;
  return { ...p, oval: m ? [u, l] : p.oval, ovalMix: m ? f2 : 0, fillRing: ri(l, u, f2) };
}
function oi(e, t, n) {
  if (n >= 0.9999) return Gr(t);
  let r = ti(e), i = ti(t), a = r.ang + ni(r, i) * n, o = Math.max(1e-4, r.halfW + (i.halfW - r.halfW) * n), s2 = Math.max(0, r.halfLen - r.halfW) * (1 - n) + Math.max(0, i.halfLen - i.halfW) * n, c = [r.cx + (i.cx - r.cx) * n, r.cy + (i.cy - r.cy) * n];
  return Ir(2 * o, 2 * (s2 + o), a * 180 / Math.PI, c, 0);
}
function si(e) {
  let t = Kr(e);
  if (!(e.wid > 0) && !t) return null;
  let n = e.lidY, r = e.tilt * (180 / Math.PI);
  if (t) return { width: 2 * e.oval[0], height: 2 * e.oval[1] * n, tilt: r, cx: e.off[0], cy: e.off[1] };
  if (e.pts.length < 2) return null;
  let i = e.pts[0], a = e.pts[e.pts.length - 1], o = a[0] - i[0], s2 = a[1] - i[1], c = Math.hypot(o, s2), l = 2 * e.wid;
  return { width: l, height: (c + l) * n, tilt: 180 / Math.PI * Math.atan2(o, s2) + r, cx: e.off[0] + (i[0] + a[0]) / 2, cy: e.off[1] + (i[1] + a[1]) / 2 * n };
}
function ci(e) {
  let t = si(e);
  if (t == null) return { w: Dr, h: 0.57, cx: e.off[0], cy: e.off[1] };
  let n = t.tilt * Math.PI / 180, r = Math.abs(Math.cos(n)), i = Math.abs(Math.sin(n));
  return { w: t.width * r + t.height * i, h: t.width * i + t.height * r, cx: t.cx, cy: t.cy };
}
function li(e, t, n, r) {
  return t >= e ? ii(e, t, 0, [n, r]) : ii(t, e, Math.PI / 2, [n, r]);
}
function ui(e, t) {
  if (t <= 0) return e;
  let n = Math.min(1, t), r = ci(e), i = Math.max(r.w, 1e-4), a = Math.max(r.h, i);
  return li(i, a + (i * Yr - a) * n, r.cx, r.cy);
}
function di(e) {
  return { ...e, wid: 0, oval: [0, 0] };
}
function fi(e) {
  let t, n;
  if (Kr(e)) t = -e.oval[1], n = e.oval[1];
  else {
    let r = 1e9, i = -1e9;
    for (let t2 of e.pts) t2[1] < r && (r = t2[1]), t2[1] > i && (i = t2[1]);
    t = r - e.wid, n = i + e.wid;
  }
  return t + 0.4 * (n - t);
}
function pi(e) {
  if (e.pts.length < 2) return e;
  let t = e.pts[0], n = e.pts[e.pts.length - 1], r = n[0] - t[0], i = n[1] - t[1];
  if (Math.abs(i) < Math.abs(r)) return e;
  let a = Math.atan2(r, i);
  if (Math.abs(a) < 1e-5) return e;
  let o = Math.cos(a), s2 = Math.sin(a);
  return { ...e, tilt: e.tilt + a, pts: e.pts.map((e2) => [e2[0] * o - e2[1] * s2, e2[0] * s2 + e2[1] * o]) };
}
function mi(e, t) {
  if (t === 0) return e;
  let n = pi(e), r = Math.max(Jr, 1 - t), i = fi(n) * (1 - r), a = Math.cos(-n.tilt), o = Math.sin(-n.tilt);
  return { ...n, off: [n.off[0] - o * i, n.off[1] + a * i], lidY: n.lidY * r };
}
function hi(e, t, n, r) {
  if (t < 1e-3) return e;
  let i = n.isFollowingTurn ? Math.min(1, Math.max(-1, r / Xr)) : n.bias, [a, o] = Br.inspecting, s2 = Math.max(1e-4, a.wid), c = Math.max(1e-4, o.wid), l = (1 + i) / 2, u = (e2, n2) => {
    let r2 = 1 + (n2 - 1) * t;
    return { ...Gr(e2), wid: e2.wid * r2, pts: e2.pts.map((e3) => [e3[0] * r2, e3[1] * r2]) };
  };
  return [u(e[0], (c / s2) ** +l), u(e[1], (s2 / c) ** +l)];
}
function gi(e) {
  return +(e === `inspecting`);
}
function _i(e, t, n) {
  return !(e.some(qr) || t.some(qr)) && (e.some(Kr) || t.some(Kr)) ? `oval` : n ? `spine` : `stadium`;
}
function vi(e) {
  return nr(Math.min(Math.max(e.t / e.dur, 0), 1), qn);
}
function yi() {
  let e = `neutral`, t = R(Br.neutral, Gr), n = 0, r = null, i = () => {
    if (r == null) return t;
    if (r.kind === `blink`) return r.from;
    if (r.kind === `morph`) {
      let e3 = Math.max(0, Math.min(1, vi(r))), { from: t2, to: n3, path: i3 } = r;
      return i3 === `oval` ? R(t2, (t3, r2) => ai(t3, n3[r2], e3)) : i3 === `spine` ? R(t2, (t3, r2) => ei(t3, n3[r2], e3)) : R(t2, (t3, r2) => oi(t3, n3[r2], e3));
    }
    let e2 = Math.min(r.t / r.dur, 1), { u1: n2, u2: i2 } = ir(false, r.dur);
    if (e2 < n2) return R(r.from, (t2) => mi(t2, rr(e2 / n2)));
    if (e2 <= i2) return R(r.to, di);
    let a2 = ar((e2 - i2) / Math.max(1e-6, 1 - i2));
    return R(r.to, (e3) => mi(e3, 1 - a2));
  }, a = () => {
    if (r == null) return n;
    if (r.kind === `blink`) return r.fromInspect;
    let e2 = r.fromInspect, t2 = gi(r.toName);
    if (r.kind === `morph`) return e2 + (t2 - e2) * vi(r);
    let i2 = Math.min(r.t / r.dur, 1), { u1: a2, u2: o2 } = ir(false, r.dur);
    return i2 <= a2 ? e2 : i2 < o2 ? 0 : t2;
  }, o = (t2) => {
    let n2 = R(i(), Gr), o2 = Br[t2];
    r = { kind: `morph`, path: _i(n2, o2, n2.some(qr) || o2.some(qr) || e === `sleepy` || t2 === `sleepy`), fromInspect: a(), toName: t2, from: n2, to: o2, t: 0, dur: Jn, isHeld: false }, e = t2;
  }, s2 = (t2) => {
    r = { kind: `lidMorph`, fromInspect: a(), toName: t2, from: R(i(), Gr), to: Br[t2], t: 0, dur: Yn, isHeld: false }, e = t2;
  }, c = () => {
    (r == null || r.isHeld) && (r = { kind: `blink`, fromInspect: n, toName: e, from: R(t, Gr), to: Br[e], t: 0, dur: Xn, isHeld: false });
  }, l = (t2) => {
    (t2.name !== e || r != null && r.toName !== t2.name) && (t2.isThroughBlink && !Ur(t2.name) && !Ur(e) ? s2(t2.name) : o(t2.name));
  }, u = (e2, i2) => {
    i2 >= e2.dur ? (t = R(e2.to, Gr), n = gi(e2.toName), r = null) : r = i2 < 0 ? null : { ...e2, t: i2 };
  }, d = (e2) => {
    r != null && (r = { ...r, isHeld: e2 });
  };
  return { get name() {
    return e;
  }, get isMorphing() {
    return r != null && r.kind !== `blink` && !r.isHeld;
  }, eyes: i, inspectWeight: a, blinkAmount() {
    if (r?.kind !== `blink` || r.isHeld) return null;
    let e2 = Math.min(r.t / r.dur, 1);
    return Math.min(1, Math.max(0, or(e2, ir(true, r.dur))));
  }, morph: o, lidMorph: s2, blink: c, play: l, step(e2) {
    r != null && !r.isHeld && u(r, r.t + e2);
  }, release() {
    d(false);
  }, seek(i2, a2) {
    e = `neutral`, t = R(Br.neutral, Gr), n = 0, r = null;
    let o2 = 0, s3 = (e2) => {
      r != null && u(r, e2 - o2);
    };
    for (let e2 of i2) {
      if (e2.t > a2 + 1e-9) break;
      s3(e2.t), l(e2), o2 = e2.t;
    }
    s3(a2), d(true);
  } };
}
var xi = 0.9;
var Si = 0.4;
var Ci = 0.62;
var wi = 0.3;
var Ti = 0.5;
var Ei = 16;
function Di({ poke: e, turns: t }) {
  return getPokeDuration(e, t);
}
function Oi(e) {
  let res = computePokesOffset(e);
  return { pitch: res.pitch, yaw: res.yaw, lift: res.lift, squash: res.squash };
}
function ki(e, t, n) {
  return e <= t || e >= n ? 0 : Math.sin(Math.PI * (e - t) / (n - t)) ** 2;
}
var Ai = 1 / 60;
var ji = 0.55;
var Mi = { heartChubby: 0.6, wedge: 0.55 };
var Ni = 2;
function Pi(e) {
  return 1 - 0.86 ** (e / Ai);
}
function Fi(e, t, n) {
  let r = e !== `sphere`, i = Mi[e] ?? 1;
  return { rx: -(r ? 19 : 14) * i * n, ry: (r ? 26 : 18) * i * t, px: (r ? 0.07 : 0.03) * t, py: (r ? 0.055 : 0.024) * n };
}
var Li = { thinking: `dots`, orbit: `orbit`, radar: `radar`, progress: `progress`, spawning: `gather`, dictating: `wave`, sending: `send`, receiving: `receive`, uploading: `dock`, bouncing: `ball`, writing: `pencil`, alerting: `bang`, "powering-down": `standby` };
var Ri = Math.PI;
var Xi = 0.6;
var Hi = { progress: 2.5, spawning: 2 };
function Gi(e) { return Hi[e] ?? 2.5; }
function Wi(e) {
  let t = e | 0;
  return () => {
    t = (t + 1831565813) | 0;
    let e2 = Math.imul(t ^ (t >>> 15), 1 | t);
    e2 ^= e2 + Math.imul(e2 ^ (e2 >>> 7), 61 | e2);
    return ((e2 ^ (e2 >>> 14)) >>> 0) / 4294967296;
  };
}
function Da(e) {
  let t = (e2) => Math.round(Math.min(1, Math.max(0, e2)) * 255).toString(16).padStart(2, `0`);
  return `#${t(e[0])}${t(e[1])}${t(e[2])}`;
}
function Oa(e) {
  return e.inkPaint ?? Da(e.ink);
}
function ka(e) {
  return e.spotPaint ?? Da(e.spot);
}
var Ba = 0.26;
var Va = 0.57;
var Ha = 0.64;
var Ua = 0.04;
var Wa = 0.12;
var Ga = 11;
var Ka = 18;
var qa = 48;
var Ja = 10;
var Ya = 64;
var Xa = { on: false, oval: false, width: 0, height: 0, tilt: 0, cx: 0, cy: 0 };
var Za = SHAPE_EYE_LAYOUTS;
function Qa(e, t) {
  let n = Za[e], r = n.width / Ba, i = n.height / Va, a = n.gap / Ha;
  return t.every((e2) => ho(e2) && !(e2.fillRing != null && e2.fillRing.length > 0)) ? eo(no(t[0]), no(t[1]), n, r, i, a) : { loops: ro(t, r, a, i, 0, n.shiftY), shiftY: 0 };
}
function $a(e) {
  return ro(e, 1, 1, 1, Ua, Wa);
}
function eo(e, t, n, r, i, a) {
  let o = z(e.width * r), s2 = z(e.height * r), c = z(t.width * r), l = z(t.height * r), u = Math.max(0, z(Math.min(o, s2))), d = Math.max(0, z(Math.max(o, s2))), f2 = Math.max(0, z(Math.min(c, l))), p = Math.max(0, z(Math.max(c, l))), m = Math.max(0, z((Ha + (e.on ? z(e.cx) : 0) + (t.on ? z(t.cx) : 0)) * a, Ha * a)), h = Math.max(0.05, Math.min(1.8, m));
  return { loops: [to(-1, u, d, -z(z(e.tilt) + (o >= s2 ? 0 : 90)), h), to(1, f2, p, z(z(t.tilt) + (c >= l ? 0 : 90)), h)], shiftY: z(n.shiftY + (z(e.cy) + z(t.cy)) / 2 * i, n.shiftY) };
}
function to(e, t, n, r, i) {
  let a = Math.max(0.01, Math.min(1, t)) / 2, o = Math.max(0.02, Math.min(1.8, Math.max(n, t))) / 2, s2 = -r * Math.PI / 180, c = Math.cos(s2), l = Math.sin(s2);
  return Array.from({ length: Ya }, (t2, n2) => {
    let r2 = 2 * Math.PI * n2 / Ya, s3 = e * o * Math.cos(r2), u = a * Math.sin(r2);
    return { x: s3 * c - u * l + e * i / 2, y: s3 * l + u * c };
  });
}
function no(e) {
  let t = ho(e);
  if (!(e.wid > 0) && !t) return Xa;
  let n = e.lidY || 1, r = (e.tilt || 0) * (180 / Math.PI);
  if (t) return { on: true, oval: true, width: 2 * e.oval[0], height: 2 * e.oval[1] * n, tilt: r, cx: e.off[0], cy: e.off[1] };
  let i = e.pts;
  if (i.length < 2) return { ...Xa, cx: e.off[0], cy: e.off[1] };
  let a = i[0], o = i[i.length - 1], s2 = o[0] - a[0], c = o[1] - a[1], l = Math.hypot(s2, c), u = 2 * e.wid;
  return { on: true, oval: false, width: u, height: (l + u) * n, tilt: 180 / Math.PI * Math.atan2(s2, c) + r, cx: e.off[0] + (a[0] + o[0]) / 2, cy: e.off[1] + (a[1] + o[1]) / 2 * n };
}
function ro(e, t, n, r, i, a) {
  let o = [], s2 = Math.sin(i), c = -Math.sin(a);
  return e.forEach((e2, i2) => {
    let a2 = ho(e2);
    if (!(e2.wid > 0) && !a2 || !a2 && e2.pts.length < 2) return;
    let l = i2 === 0 ? -1 : 1, u = e2.lidY || 1, d = Math.cos(e2.tilt || 0), f2 = Math.sin(e2.tilt || 0), p = l * ((Ha / 2 + z(e2.off[0])) * n) + s2, m = c + z(e2.off[1]) * r, h = (e3, n2) => {
      let r2 = e3 * d - n2 * f2, i3 = e3 * f2 + n2 * d;
      return { x: p + l * r2 * t, y: m + i3 * t * u };
    };
    if (e2.fillRing != null && e2.fillRing.length >= 3) {
      let t2 = z(e2.off[0]), n2 = z(e2.off[1]);
      o.push(e2.fillRing.map(([e3, r2]) => h(e3 - t2, (r2 - n2) * u)));
      return;
    }
    if (a2) {
      let t2 = [];
      for (let n2 = 0; n2 < qa; n2++) {
        let r2 = 2 * Math.PI * n2 / qa;
        t2.push(h(e2.oval[0] * Math.cos(r2), e2.oval[1] * u * Math.sin(r2)));
      }
      o.push(t2);
      return;
    }
    let g = e2.wid * t, _ = e2.path != null && e2.path.length === Ka ? ao(e2.path, h, g) : io(e2.pts.map((e3) => h(e3[0], e3[1])), g);
    _.length > 0 && o.push(_);
  }), o;
}
function io(e, t) {
  let n = [];
  for (let t2 of e) {
    let e2 = n.at(-1);
    (e2 == null || Math.hypot(t2.x - e2.x, t2.y - e2.y) > 1e-6) && n.push(t2);
  }
  if (n.length === 0 || t <= 0) return [];
  let r = co(n, t);
  if (r != null) return r;
  let i = n.length;
  if (i < 2) return [];
  let a = [], o = [];
  for (let e2 = 0; e2 < i; e2++) {
    let t2 = n[Math.max(0, e2 - 1)], r2 = n[Math.min(i - 1, e2 + 1)], s2 = Math.hypot(r2.x - t2.x, r2.y - t2.y) || 1, c = -(r2.y - t2.y) / s2, l = (r2.x - t2.x) / s2;
    e2 > 0 && c * a[e2 - 1] + l * o[e2 - 1] < 0 && (c = -c, l = -l), a.push(c), o.push(l);
  }
  return oo(n, a, o, t, mo(n[1].x - n[0].x, n[1].y - n[0].y), mo(n[i - 1].x - n[i - 2].x, n[i - 1].y - n[i - 2].y));
}
function ao(e, t, n) {
  if (n <= 0) return [];
  let r = [];
  for (let n2 = 0; n2 < 2; n2++) {
    let i2 = lo(e, n2), a2 = uo(e, n2, 4), o2 = uo(e, n2 + 1, 2), s3 = lo(e, n2 + 1);
    for (let e2 = n2 === 0 ? 0 : 1; e2 < Ga; e2++) {
      let n3 = e2 / 10, c2 = fo(i2, a2, o2, s3, n3), l2 = po(i2, a2, o2, s3, n3), u2 = t(c2[0], c2[1]), d2 = t(c2[0] + l2[0], c2[1] + l2[1]);
      r.push({ x: u2.x, y: u2.y, tx: d2.x - u2.x, ty: d2.y - u2.y });
    }
  }
  let i = co(r, n);
  if (i != null) return i;
  let a = r.length, o = [], s2 = [];
  for (let e2 = 0; e2 < a; e2++) {
    let t2 = Math.hypot(r[e2].tx, r[e2].ty) || 1, n2 = -r[e2].ty / t2, i2 = r[e2].tx / t2;
    e2 > 0 && n2 * o[e2 - 1] + i2 * s2[e2 - 1] < 0 && (n2 = -n2, i2 = -i2), o.push(n2), s2.push(i2);
  }
  let c = r[0], l = r[a - 1], u = Math.hypot(c.tx, c.ty) || 1, d = Math.hypot(l.tx, l.ty) || 1;
  return oo(r, o, s2, n, { x: c.tx / u, y: c.ty / u }, { x: l.tx / d, y: l.ty / d });
}
function oo(e, t, n, r, i, a) {
  let o = e.length, s2 = e.map((e2, i2) => ({ x: e2.x + t[i2] * r, y: e2.y + n[i2] * r })), c = e.map((e2, i2) => ({ x: e2.x - t[i2] * r, y: e2.y - n[i2] * r })), l = { x: e[0].x - i.x * r, y: e[0].y - i.y * r }, u = { x: e[o - 1].x + a.x * r, y: e[o - 1].y + a.y * r };
  return [...s2, ...so(e[o - 1], s2[o - 1], u, r), ...[...c].reverse(), ...so(e[0], c[0], l, r)];
}
function so(e, t, n, r) {
  let i = [], a = Math.atan2(t.y - e.y, t.x - e.x), o = Math.atan2(n.y - e.y, n.x - e.x) - a;
  for (; o > Math.PI; ) o -= 2 * Math.PI;
  for (; o < -Math.PI; ) o += 2 * Math.PI;
  let s2 = o >= 0 ? 1 : -1;
  for (let t2 = 1; t2 < Ja; t2++) {
    let n2 = a + t2 / Ja * s2 * Math.PI;
    i.push({ x: e.x + r * Math.cos(n2), y: e.y + r * Math.sin(n2) });
  }
  return i;
}
function co(e, t) {
  let n = 0, r = 0;
  for (let t2 of e) n += t2.x, r += t2.y;
  n /= e.length, r /= e.length;
  let i = 0;
  for (let t2 of e) i = Math.max(i, Math.hypot(t2.x - n, t2.y - r));
  if (t <= i * 1.05) return null;
  let a = [];
  for (let n2 = 0; n2 < qa; n2++) {
    let r2 = 2 * Math.PI * n2 / qa, i2 = Math.cos(r2), o = Math.sin(r2), s2 = -1 / 0, c = 0, l = 0;
    for (let t2 of e) {
      let e2 = t2.x * i2 + t2.y * o;
      e2 > s2 && (s2 = e2, c = t2.x, l = t2.y);
    }
    a.push({ x: c + i2 * t, y: l + o * t });
  }
  return a;
}
function lo(e, t) {
  return [e[t * 6], e[t * 6 + 1]];
}
function uo(e, t, n) {
  return [e[t * 6] + e[t * 6 + n], e[t * 6 + 1] + e[t * 6 + n + 1]];
}
function fo(e, t, n, r, i) {
  let a = 1 - i;
  return [a * a * a * e[0] + 3 * a * a * i * t[0] + 3 * a * i * i * n[0] + i * i * i * r[0], a * a * a * e[1] + 3 * a * a * i * t[1] + 3 * a * i * i * n[1] + i * i * i * r[1]];
}
function po(e, t, n, r, i) {
  let a = 1 - i;
  return [3 * a * a * (t[0] - e[0]) + 6 * a * i * (n[0] - t[0]) + 3 * i * i * (r[0] - n[0]), 3 * a * a * (t[1] - e[1]) + 6 * a * i * (n[1] - t[1]) + 3 * i * i * (r[1] - n[1])];
}
function mo(e, t) {
  let n = Math.hypot(e, t) || 1;
  return { x: e / n, y: t / n };
}
function ho(e) {
  return e.oval[0] > 1e-4 && e.oval[1] > 1e-4;
}
function z(e, t = 0) {
  return Number.isFinite(e) ? e : t;
}
var B = 114.2705;
(() => {
  let e = [];
  for (let t = 0; t < 10; t++) {
    let n = -Math.PI / 2 + t * Math.PI / 5, r = t % 2 == 0 ? 1 : 0.42;
    e.push(`${(Math.cos(n) * r).toFixed(3)} ${(Math.sin(n) * r).toFixed(3)}`);
  }
  return `M` + e.join(`L`) + `Z`;
})();
var go = (e, t, n) => e.map(([e2, r], i) => [e2 + (t[i][0] - e2) * n, r + (t[i][1] - r) * n]);
var _o = 1e-10;
var vo = 2 ** 26;
function yo(e) {
  let t = bo(e);
  if (t == null) return [];
  let n = To(t.map((t2) => e[t2])), [r, i, a, o] = t, s2 = [[r, i, a], [r, i, o], [r, a, o], [i, a, o]].map(([t2, r2, i2]) => {
    let a2 = xo(e, [t2, r2, i2]);
    return So(a2, n) > 0 ? xo(e, [t2, i2, r2]) : a2;
  });
  return e.forEach((n2, r2) => {
    if (t.includes(r2)) return;
    let i2 = s2.map((e2) => So(e2, n2) > _o);
    if (!i2.includes(true)) return;
    let a2 = /* @__PURE__ */ new Set();
    s2.forEach((e2, t2) => {
      if (!i2[t2]) for (let t3 = 0; t3 < 3; t3++) a2.add(Co(e2.corners[t3], e2.corners[(t3 + 1) % 3]));
    });
    let o2 = [];
    s2.forEach((t2, n3) => {
      if (!i2[n3]) {
        o2.push(t2);
        return;
      }
      for (let n4 = 0; n4 < 3; n4++) {
        let i3 = t2.corners[n4], s3 = t2.corners[(n4 + 1) % 3];
        a2.has(Co(s3, i3)) && o2.push(xo(e, [i3, s3, r2]));
      }
    }), s2 = o2;
  }), s2.map((e2) => e2.corners);
}
function bo(e) {
  if (e.length < 4) return null;
  let t = 0;
  e.forEach((n2, r2) => {
    n2[0] < e[t][0] && (t = r2);
  });
  let n = wo(e, (n2) => ko(Eo(n2, e[t]))), r = wo(e, (r2) => ko(Do(Eo(e[n], e[t]), Eo(r2, e[t])))), i = Do(Eo(e[n], e[t]), Eo(e[r], e[t])), a = wo(e, (n2) => Math.abs(Oo(i, Eo(n2, e[t]))));
  return Math.abs(Oo(i, Eo(e[a], e[t]))) < _o ? null : [t, n, r, a];
}
function xo(e, t) {
  let n = e[t[0]], r = Do(Eo(e[t[1]], n), Eo(e[t[2]], n)), i = ko(r) || 1, a = [r[0] / i, r[1] / i, r[2] / i];
  return { corners: t, normal: a, offset: Oo(a, n) };
}
function So(e, t) {
  return Oo(e.normal, t) - e.offset;
}
function Co(e, t) {
  return e * vo + t;
}
function wo(e, t) {
  let n = 0, r = -1 / 0;
  return e.forEach((e2, i) => {
    let a = t(e2);
    a > r && (r = a, n = i);
  }), n;
}
function To(e) {
  let t = e.length;
  return [e.reduce((e2, t2) => e2 + t2[0], 0) / t, e.reduce((e2, t2) => e2 + t2[1], 0) / t, e.reduce((e2, t2) => e2 + t2[2], 0) / t];
}
function Eo(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]];
}
function Do(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]];
}
function Oo(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function ko(e) {
  return Math.hypot(e[0], e[1], e[2]);
}
var Ao = [{ x: 0.934475052698969, y: 0.004363180216799212 }, { x: 0.948891570423846, y: 0.039714756021395174 }, { x: 0.9608728659762679, y: 0.07607039935952659 }, { x: 0.9703302557200477, y: 0.11326502451357987 }, { x: 0.977189539605176, y: 0.15112675873557632 }, { x: 0.9813908922405818, y: 0.18947802927479046 }, { x: 0.9828887074578869, y: 0.2281365499571005 }, { x: 0.9816519990958227, y: 0.2669163757988432 }, { x: 0.9776625497902636, y: 0.30562830330137525 }, { x: 0.9709166586711733, y: 0.3440810419322467 }, { x: 0.9614266573440594, y: 0.3820827122339433 }, { x: 0.949221424670692, y: 0.41944230284893746 }, { x: 0.9343467338379507, y: 0.45597122804302315 }, { x: 0.9168643128164508, y: 0.49148439126889626 }, { x: 0.8968538338085426, y: 0.5258027955519334 }, { x: 0.8744135590875667, y: 0.5587560766363049 }, { x: 0.8496605481016927, y: 0.5901852347689388 }, { x: 0.8227287687893752, y: 0.6199442885313702 }, { x: 0.7937617531488526, y: 0.6478973166280976 }, { x: 0.762905919754175, y: 0.6739136951531549 }, { x: 0.7303134746505421, y: 0.6978700569784003 }, { x: 0.6961411032024281, y: 0.7196491755310737 }, { x: 0.6605596057818293, y: 0.7391502303914683 }, { x: 0.6237513457393834, y: 0.7562897143525837 }, { x: 0.5859073404691287, y: 0.7710015652906158 }, { x: 0.5472248974285161, y: 0.7832374824769789 }, { x: 0.507904865265839, y: 0.7929662862613107 }, { x: 0.4681494646643414, y: 0.8001734773422571 }, { x: 0.4281602030115182, y: 0.8048604074486263 }, { x: 0.38813613170852307, y: 0.8070434681543606 }, { x: 0.34827256966973696, y: 0.8067537475134688 }, { x: 0.3087597745583025, y: 0.8040363403785654 }, { x: 0.26978201344672026, y: 0.7989504065912386 }, { x: 0.23151662960878241, y: 0.7915694823366872 }, { x: 0.19413194481287305, y: 0.7819778247879767 }, { x: 0.1577852845947917, y: 0.7702630818507747 }, { x: 0.12262733079593371, y: 0.7565354795442158 }, { x: 0.08880015313138229, y: 0.7409422361214794 }, { x: 0.05642586889159421, y: 0.7236017950683938 }, { x: 0.02561647598492663, y: 0.704659966051552 }, { x: -0.0036037810305528913, y: 0.6895105233164277 }, { x: -0.03317542334906984, y: 0.7095400285365243 }, { x: -0.06438496917371282, y: 0.7280864309789705 }, { x: -0.0971349646590295, y: 0.7450166000084965 }, { x: -0.13130575647382275, y: 0.7601465770772312 }, { x: -0.16677330012669841, y: 0.7733777436363767 }, { x: -0.20339569964825052, y: 0.7845796245158417 }, { x: -0.24101725346433553, y: 0.7936313321637897 }, { x: -0.27947704857143557, y: 0.8004456020397803 }, { x: -0.3186049196302664, y: 0.8049436403918587 }, { x: -0.35822225014656567, y: 0.8070572252942809 }, { x: -0.398143514039767, y: 0.8067313311007664 }, { x: -0.438177182680152, y: 0.8039242993502419 }, { x: -0.478126841210925, y: 0.7986084072202804 }, { x: -0.5177925726656645, y: 0.7907706714017452 }, { x: -0.5569723963185897, y: 0.7804134068929688 }, { x: -0.5954640748960385, y: 0.7675550146764192 }, { x: -0.6330671972405764, y: 0.7522306880298593 }, { x: -0.6695855487964426, y: 0.734492987733704 }, { x: -0.7048299443180804, y: 0.714412410733904 }, { x: -0.7386209319309059, y: 0.6920772477931056 }, { x: -0.7707921245520308, y: 0.6675935661866239 }, { x: -0.8011924150225685, y: 0.641083697347949 }, { x: -0.8296683466506882, y: 0.612669941116809 }, { x: -0.8560711521836232, y: 0.5824818706921402 }, { x: -0.8802586099360401, y: 0.550657644865542 }, { x: -0.9021016261853626, y: 0.5173474030319016 }, { x: -0.921488351217944, y: 0.48271361643050537 }, { x: -0.9383250626073236, y: 0.44692900756649523 }, { x: -0.9525363976829352, y: 0.4101742582574272 }, { x: -0.9640652637601566, y: 0.37263580242597466 }, { x: -0.9728702117174652, y: 0.3345029815392968 }, { x: -0.9789264673905609, y: 0.2959671170672982 }, { x: -0.9822255348467005, y: 0.25722000690078245 }, { x: -0.982774894246464, y: 0.21845258628445002 }, { x: -0.9805967489497907, y: 0.17985349925722946 }, { x: -0.9757258679433654, y: 0.1416078138454962 }, { x: -0.9682107746348935, y: 0.1038965717106635 }, { x: -0.9581143826889033, y: 0.06689596974801386 }, { x: -0.9455146116784895, y: 0.03077634172969411 }, { x: -0.9305051553319804, y: -0.004299067407576291 }, { x: -0.9131952327192244, y: -0.038175545674491246 }, { x: -0.8937019647378253, y: -0.07070785611844921 }, { x: -0.8721591451869681, y: -0.10176130887451734 }, { x: -0.8487362913086253, y: -0.1312168064224554 }, { x: -0.8236207468105732, y: -0.15897343836917888 }, { x: -0.7970979502287641, y: -0.18497038865757742 }, { x: -0.7710541733734617, y: -0.2096139557882936 }, { x: -0.7461193861529073, y: -0.23320814197562353 }, { x: -0.7221519248227056, y: -0.2558870618710858 }, { x: -0.6990265515010246, y: -0.27776911859221876 }, { x: -0.6766318459161248, y: -0.29895980890191903 }, { x: -0.6548676461286994, y: -0.31955389248594185 }, { x: -0.6336431338424889, y: -0.3396372581810514 }, { x: -0.6128753135059731, y: -0.359288557412959 }, { x: -0.5924873537443393, y: -0.3785803988633805 }, { x: -0.5724075923763201, y: -0.3975806113171165 }, { x: -0.5525683653066091, y: -0.4163531831687479 }, { x: -0.5329051623123328, y: -0.43495923867716463 }, { x: -0.5133556323648999, y: -0.45345775659418885 }, { x: -0.49385881021048816, y: -0.47190633957419137 }, { x: -0.4743544952965227, y: -0.4903620705111528 }, { x: -0.4547822689301765, y: -0.5088820023697915 }, { x: -0.43508096787875605, y: -0.5275240823754965 }, { x: -0.41518776564532156, y: -0.5463477370262614 }, { x: -0.39503744073179237, y: -0.565414738403984 }, { x: -0.37456138068841166, y: -0.584789881188713 }, { x: -0.3536868090571391, y: -0.6045421927475639 }, { x: -0.33233545822868515, y: -0.6247456276706727 }, { x: -0.31042247776931897, y: -0.6454805113116225 }, { x: -0.28785488995869934, y: -0.6668347728530055 }, { x: -0.26452992996104363, y: -0.6889057008744045 }, { x: -0.24032737271767535, y: -0.7117848186103969 }, { x: -0.21465925160321186, y: -0.7340046463187382 }, { x: -0.18703495679704094, y: -0.7534714425430167 }, { x: -0.15772553428835867, y: -0.7700652053068575 }, { x: -0.1270070450444056, y: -0.7836711911119708 }, { x: -0.0951684130469074, y: -0.7942311382405959 }, { x: -0.062495032850901626, y: -0.8016579582061256 }, { x: -0.02928242470209217, y: -0.8059763869703366 }, { x: 0.00418250025635626, y: -0.8071603933705995 }, { x: 0.03761179305139532, y: -0.8051997052887491 }, { x: 0.07071763099568142, y: -0.8001090083866196 }, { x: 0.10320959245128111, y: -0.7918885098432591 }, { x: 0.134798677354145, y: -0.7805799374564395 }, { x: 0.16519657722647352, y: -0.7662371932046725 }, { x: 0.1941137081486192, y: -0.748919054724023 }, { x: 0.22126182274327255, y: -0.7287044591356419 }, { x: 0.24646172395988103, y: -0.705992917688509 }, { x: 0.27042811605651085, y: -0.6833113574191189 }, { x: 0.2935522498121435, y: -0.6614269249128338 }, { x: 0.31594558408750634, y: -0.6402340573221494 }, { x: 0.33770831010282365, y: -0.6196380408622824 }, { x: 0.3589311734375708, y: -0.5995528607013482 }, { x: 0.3796973337781967, y: -0.579900027393222 }, { x: 0.40008347985475634, y: -0.5606067493570983 }, { x: 0.4201613352275292, y: -0.5416052696177914 }, { x: 0.4399985323371352, y: -0.5228315569692281 }, { x: 0.4596595725296922, y: -0.504224454308306 }, { x: 0.47920690986264164, y: -0.4857251046289992 }, { x: 0.4987013585100146, y: -0.46727574968264535 }, { x: 0.5182031792984406, y: -0.44881937116377135 }, { x: 0.5377727619439542, y: -0.4302988919363394 }, { x: 0.5574712942997964, y: -0.41165639717445024 }, { x: 0.5773615598171413, y: -0.39283243400856016 }, { x: 0.5975088031531646, y: -0.3737652763272414 }, { x: 0.6179815681468954, y: -0.3543900575947271 }, { x: 0.6388526754619042, y: -0.3346378544777047 }, { x: 0.6602003073706015, y: -0.3144346462096216 }, { x: 0.6821093031111911, y: -0.2937001458611249 }, { x: 0.7046726622334125, y: -0.2723464324690267 }, { x: 0.7279930725720649, y: -0.25027624068777876 }, { x: 0.752199978996238, y: -0.22738555814564856 }, { x: 0.7774207173704459, y: -0.20355017023582161 }, { x: 0.8037647094696927, y: -0.17862206250636986 }, { x: 0.8300422031017065, y: -0.15219910918500412 }, { x: 0.8547554784773178, y: -0.1240094996536292 }, { x: 0.8777124848745345, y: -0.09414272665900433 }, { x: 0.8987592287763329, y: -0.06270816362882596 }, { x: 0.9177264967761565, y: -0.029827205842901418 }];
var V = Math.PI * 2;
var H = (e) => Math.round(e * 100) / 100;
var jo = (e, t, n) => e < t ? t : e > n ? n : e;
var Mo = class {
  d = ``;
  move(e, t) {
    return this.d += `M${H(e)} ${H(t)}`, this;
  }
  line(e, t) {
    return this.d += `L${H(e)} ${H(t)}`, this;
  }
  curve(e, t, n, r, i, a) {
    return this.d += `C${H(e)} ${H(t)} ${H(n)} ${H(r)} ${H(i)} ${H(a)}`, this;
  }
  corner(e, t, n, r) {
    let i = (e2, t2) => {
      let n2 = e2[0] - t2[0], r2 = e2[1] - t2[1], i2 = Math.hypot(n2, r2) || 1;
      return [n2 / i2, r2 / i2];
    }, a = i(e, t), o = i(n, t), s2 = [t[0] + a[0] * r, t[1] + a[1] * r], c = [t[0] + o[0] * r, t[1] + o[1] * r];
    return this.d ? this.line(s2[0], s2[1]) : this.move(s2[0], s2[1]), this.d += `Q${H(t[0])} ${H(t[1])} ${H(c[0])} ${H(c[1])}`, this;
  }
  arc(e, t, n, r, i, a) {
    let o = Math.max(1, Math.ceil(Math.abs(a - i) / (Math.PI / 2))), s2 = (a - i) / o, c = 4 / 3 * Math.tan(s2 / 4), l = i;
    for (let i2 = 0; i2 < o; i2++) {
      let i3 = l + s2, a2 = [e + n * Math.cos(l), t + r * Math.sin(l)], o2 = [e + n * Math.cos(i3), t + r * Math.sin(i3)];
      this.curve(a2[0] - c * n * Math.sin(l), a2[1] + c * r * Math.cos(l), o2[0] + c * n * Math.sin(i3), o2[1] - c * r * Math.cos(i3), o2[0], o2[1]), l = i3;
    }
    return this;
  }
  close() {
    return this.d + `Z`;
  }
};
var No = (e) => {
  let t = e.length, n = `M${H(e[0][0])} ${H(e[0][1])}`;
  for (let r = 0; r < t; r++) {
    let i = e[(r - 1 + t) % t], a = e[r], o = e[(r + 1) % t], s2 = e[(r + 2) % t];
    n += `C${H(a[0] + (o[0] - i[0]) / 6)} ${H(a[1] + (o[1] - i[1]) / 6)} ${H(o[0] - (s2[0] - a[0]) / 6)} ${H(o[1] - (s2[1] - a[1]) / 6)} ${H(o[0])} ${H(o[1])}`;
  }
  return n + `Z`;
};
var Po = (e, t = 128) => {
  let n = [];
  for (let r = 0; r < t; r++) n.push(e(r / t * V));
  return No(n);
};
var Fo = (e, t) => {
  let n = new Mo(), r = e.length;
  for (let i = 0; i < r; i++) {
    let a = typeof t == `number` ? t : t[i % t.length];
    n.corner(e[(i - 1 + r) % r], e[i], e[(i + 1) % r], a);
  }
  return n.close();
};
var Io = (e, t, n, r = 0) => Fo(Array.from({ length: t }, (n2, i) => {
  let a = r + i / t * V;
  return [B + Math.cos(a) * e, B + Math.sin(a) * e];
}), n);
var Lo = (e, t = 160) => Po((t2) => {
  let n = Math.cos(t2), r = Math.sin(t2), i = 0;
  for (let [t3, a, o] of e) {
    let e2 = t3 - B, s2 = a - B, c = n * e2 + r * s2, l = c * c - (e2 * e2 + s2 * s2) + o * o;
    if (l <= 0) continue;
    let u = c + Math.sqrt(l);
    u > i && (i = u);
  }
  return [B + n * i, B + r * i];
}, t);
var Ro = (e, t, n) => Po((r) => {
  let i = Math.cos(r), a = Math.sin(r);
  return [B + Math.sign(i) * Math.abs(i) ** (2 / n) * e, B + Math.sign(a) * Math.abs(a) ** (2 / n) * t];
});
var zo = (e, t) => new Mo().move(B - e + t, B - t).line(B + e - t, B - t).arc(B + e - t, B, t, t, -Math.PI / 2, Math.PI / 2).line(B - e + t, B + t).arc(B - e + t, B, t, t, Math.PI / 2, Math.PI * 3 / 2).close();
var Bo = (e, t) => new Mo().move(B - e, B + t - e).line(B - e, B - t + e).arc(B, B - t + e, e, e, Math.PI, V).line(B + e, B + t - e).arc(B, B + t - e, e, e, 0, Math.PI).close();
var Vo = (e, t, n) => new Mo().move(B - e, B - t + n).arc(B, B - t + n, e, n, Math.PI, V).line(B + e, B + t - n).arc(B, B + t - n, e, n, 0, Math.PI).close();
var Ho = (e, t, n) => {
  let r = B + t;
  return new Mo().move(B - e, r - n).arc(B, r - n, e, 2 * t - n, Math.PI, V).line(B + e, r - n).curve(B + e, r, B + e, r, B + e - n, r).line(B - e + n, r).curve(B - e, r, B - e, r, B - e, r - n).close();
};
var Uo = (e, t, n) => {
  let r = B + t, i = B - t + e;
  return new Mo().move(B - e, i).arc(B, i, e, e, Math.PI, V).line(B + e, r - n).curve(B + e, r, B + e, r, B + e - n, r).line(B - e + n, r).curve(B - e, r, B - e, r, B - e, r - n).close();
};
var Wo = (e, t, n) => {
  let r = B - t, i = B + t;
  return new Mo().move(B - e, r + n).curve(B - e, r - 2, B - e * 0.5, r - 10, B, r - 10).curve(B + e * 0.5, r - 10, B + e, r - 2, B + e, r + n).curve(B + e, B + t * 0.42, B + e * 0.62, i, B, i).curve(B - e * 0.62, i, B - e, B + t * 0.42, B - e, r + n).close();
};
var Go = (e, t, n) => Po((r) => {
  let i = Math.cos(r), a = Math.sin(r), o = (1 - a) / 2;
  return [B + i * e * (1 - n * o * o), B + a * t];
});
var Ko = (e, t, n, r) => {
  let i = jo(e / (n - t), -1, 1), a = Math.sqrt(1 - i * i), o = [B + e * a, n - e * i], s2 = [B - e * a, n - e * i], c = Math.atan2(o[1] - n, o[0] - B);
  return new Mo().corner(o, [B, t], s2, r).line(s2[0], s2[1]).arc(B, n, e, e, Math.PI - c, c).close();
};
var qo = (e, t) => Fo([[B - e, B - e], [B + e, B - e], [B + e, B + e], [B - e, B + e]], t);
var Jo = (e, t, n, r) => Fo([[B - e, B + t], [B + e, B + t], [B + e, B - t + n], [B, B - t], [B - e, B - t + n]], r);
var Yo = `M79.4511 11.5693C94.8767 -3.85636 119.887 -3.85622 135.312 11.5693C150.738 26.995 150.738 52.0049 135.312 67.4306L129.302 73.4404L129.303 73.4414L83.7724 118.972C81.8111 120.933 79.4309 122.22 76.9199 122.833C76.463 122.944 76.0018 123.034 75.538 123.101C74.1477 123.301 72.734 123.301 71.3437 123.101C70.8802 123.034 70.4194 122.944 69.9628 122.833C69.8486 122.805 69.7347 122.776 69.621 122.745C69.3938 122.684 69.1679 122.616 68.9433 122.544C67.4837 122.073 66.0831 121.367 64.8017 120.426C64.6047 120.281 64.4108 120.13 64.2197 119.975C63.837 119.662 63.466 119.328 63.1093 118.972L11.5693 67.4306C-3.85643 52.0049 -3.85642 26.995 11.5693 11.5693C26.995 -3.85643 52.0049 -3.85643 67.4306 11.5693L73.4404 17.579L79.4511 11.5693Z`;
var Xo = `M58.9438 9.25323C63.2492 -3.08441 80.6974 -3.08441 85.0027 9.25322L91.7612 28.6207C94.0136 35.0751 100.652 38.9078 107.368 37.6311L127.52 33.8004C140.357 31.3602 149.081 46.4708 140.549 56.3681L127.156 71.9049C122.692 77.0827 122.692 84.748 127.156 89.9258L140.549 105.463C149.081 115.36 140.357 130.471 127.52 128.03L107.368 124.2C100.652 122.923 94.0136 126.756 91.7612 133.21L85.0027 152.577C80.6974 164.915 63.2492 164.915 58.9438 152.577L52.1853 133.21C49.933 126.756 43.2946 122.923 36.5788 124.2L16.4268 128.03C3.58942 130.471 -5.1347 115.36 3.39733 105.463L16.7908 89.9258C21.2543 84.748 21.2543 77.0827 16.7908 71.9049L3.39734 56.3681C-5.13469 46.4708 3.58941 31.3602 16.4268 33.8004L36.5787 37.6311C43.2946 38.9078 49.933 35.0751 52.1853 28.6207L58.9438 9.25323Z`;
var Zo = `M93.9365 0.100586C98.4439 -0.387322 102.691 0.897134 106.341 4.03418C111.502 8.47087 114.842 16.0545 116.636 25.2725C118.36 34.1341 118.716 44.8177 117.701 56.4346L117.707 56.4375L117.706 56.4443C122.25 58.5638 126.519 60.8171 130.449 63.168C130.485 63.1891 130.52 63.2103 130.556 63.2314C131.25 63.6478 131.934 64.067 132.607 64.4893C132.68 64.5349 132.753 64.5813 132.825 64.627C133.074 64.7838 133.322 64.941 133.567 65.0986C133.692 65.1787 133.816 65.2596 133.94 65.3398C134.138 65.4676 134.335 65.5954 134.53 65.7236C134.653 65.8039 134.775 65.8844 134.896 65.9648C135.112 66.1073 135.325 66.2506 135.538 66.3936C135.625 66.4522 135.713 66.5106 135.8 66.5693C138.866 68.645 141.667 70.7792 144.163 72.9502C149.754 77.8126 153.981 83.0002 156.136 88.2578C156.159 88.3133 156.181 88.3693 156.203 88.4248C156.268 88.5868 156.332 88.749 156.393 88.9111C156.435 89.0226 156.475 89.1346 156.516 89.2461C156.541 89.3175 156.566 89.3895 156.591 89.4609C157.443 91.8917 157.839 94.3199 157.696 96.7109C157.522 99.7997 156.469 102.655 154.613 105.192C154.236 105.709 153.826 106.208 153.388 106.692C153.365 106.717 153.343 106.742 153.32 106.767C153.171 106.93 153.019 107.091 152.863 107.25C152.844 107.27 152.824 107.29 152.804 107.311C152.3 107.822 151.762 108.316 151.191 108.79C151.168 108.81 151.144 108.83 151.12 108.85C150.952 108.988 150.781 109.125 150.607 109.261C150.558 109.299 150.509 109.337 150.46 109.375C150.282 109.512 150.101 109.648 149.917 109.781C149.903 109.792 149.888 109.801 149.874 109.812C149.255 110.26 148.605 110.689 147.926 111.1C147.795 111.179 147.662 111.256 147.528 111.334C147.41 111.403 147.292 111.473 147.173 111.541C146.915 111.687 146.653 111.832 146.388 111.974C146.316 112.012 146.243 112.047 146.171 112.085C145.978 112.186 145.783 112.287 145.586 112.386C145.459 112.449 145.331 112.511 145.203 112.573C145.048 112.649 144.891 112.723 144.733 112.797C144.614 112.853 144.494 112.909 144.373 112.964C144.198 113.044 144.021 113.122 143.843 113.2C143.722 113.253 143.6 113.306 143.478 113.358C143.288 113.439 143.096 113.519 142.903 113.598C142.836 113.625 142.769 113.655 142.701 113.683C142.662 113.698 142.622 113.712 142.583 113.728C142.371 113.812 142.156 113.895 141.94 113.978C141.847 114.013 141.753 114.051 141.658 114.086C140.71 114.441 139.731 114.771 138.725 115.078C138.613 115.112 138.502 115.145 138.39 115.179C138.257 115.218 138.123 115.26 137.989 115.299C137.911 115.322 137.831 115.343 137.752 115.365C137.61 115.406 137.467 115.446 137.324 115.485C137.095 115.549 136.863 115.611 136.63 115.672C136.52 115.701 136.41 115.73 136.3 115.759C136.064 115.819 135.827 115.879 135.588 115.938C135.451 115.971 135.314 116.004 135.177 116.037C134.975 116.085 134.772 116.131 134.568 116.178C134.312 116.236 134.054 116.294 133.795 116.35C133.535 116.406 133.274 116.461 133.011 116.515C132.85 116.547 132.688 116.578 132.525 116.61C132.333 116.648 132.14 116.686 131.946 116.723C131.689 116.771 131.43 116.818 131.17 116.864C131.075 116.881 130.979 116.898 130.884 116.914C130.595 116.964 130.304 117.012 130.012 117.06C129.932 117.073 129.851 117.085 129.771 117.098C129.484 117.143 129.196 117.188 128.906 117.23C128.818 117.243 128.729 117.256 128.641 117.269C127.33 117.457 125.983 117.62 124.601 117.755C124.468 117.768 124.336 117.782 124.203 117.794C123.92 117.82 123.636 117.845 123.351 117.869C123.24 117.878 123.13 117.888 123.02 117.897C122.701 117.923 122.381 117.948 122.059 117.971C121.967 117.977 121.874 117.984 121.782 117.99C121.463 118.012 121.143 118.033 120.82 118.053C120.73 118.058 120.639 118.063 120.549 118.068C119.546 118.126 118.527 118.171 117.492 118.202C117.322 118.207 117.151 118.213 116.979 118.218C116.785 118.223 116.59 118.225 116.395 118.229C116.147 118.235 115.899 118.24 115.65 118.244C115.415 118.248 115.178 118.25 114.94 118.252C114.688 118.254 114.435 118.256 114.181 118.257C114.008 118.257 113.835 118.257 113.662 118.257C113.32 118.256 112.976 118.255 112.631 118.252C112.503 118.251 112.375 118.25 112.247 118.248C111.858 118.243 111.466 118.237 111.073 118.229C110.984 118.227 110.894 118.226 110.804 118.224C107.734 118.154 104.558 117.977 101.289 117.69C96.3593 128.261 90.7082 137.338 84.7832 144.151C78.6204 151.238 71.9357 156.137 65.2471 157.399C60.5179 158.292 56.1975 157.281 52.5381 154.604C48.9431 151.975 46.1246 147.845 44.0479 142.691C40.0321 132.725 38.5457 118.333 40.043 101.281C40.0382 101.279 40.0331 101.277 40.0283 101.274C39.6986 101.121 39.3711 100.965 39.0449 100.811C38.8351 100.711 38.6254 100.612 38.417 100.512C38.0794 100.35 37.7438 100.186 37.4102 100.023C37.2392 99.9399 37.0684 99.8563 36.8984 99.7725C36.5886 99.6196 36.2801 99.4663 35.9736 99.3125C35.7564 99.2034 35.5398 99.0939 35.3242 98.9844C34.9817 98.8104 34.6409 98.636 34.3027 98.4609C34.2424 98.4297 34.1823 98.3975 34.1221 98.3662C19.2858 90.6566 8.70839 81.8767 3.56055 73.3232C3.50461 73.2303 3.44926 73.137 3.39453 73.0439C3.37308 73.0075 3.35134 72.971 3.33008 72.9346C3.19352 72.7003 3.06142 72.4652 2.93262 72.2305C2.19429 70.8865 1.58552 69.5375 1.11816 68.1895C1.10444 68.1499 1.09161 68.1099 1.07813 68.0703C1.04009 67.9586 1.00191 67.847 0.96582 67.7354C0.954674 67.7009 0.943578 67.6663 0.932617 67.6318C0.823298 67.2877 0.723275 66.9435 0.632813 66.5996C-0.103732 63.8123 -0.218301 61.0433 0.402344 58.3643C1.34437 54.2986 3.89972 50.7745 7.875 47.9023C7.90661 47.8794 7.93796 47.8559 7.96973 47.833C8.12646 47.7208 8.2852 47.6092 8.44629 47.499C8.57825 47.4084 8.71216 47.3194 8.84668 47.2305C8.87052 47.2148 8.89404 47.1983 8.91797 47.1826C10.608 46.0723 12.497 45.0908 14.5547 44.2324C14.6355 44.1986 14.7165 44.1643 14.7979 44.1309C14.8508 44.1092 14.9038 44.087 14.957 44.0654L15.25 43.9482C15.3501 43.9084 15.4509 43.8694 15.5518 43.8301C15.6093 43.8078 15.6668 43.7848 15.7246 43.7627C23.7646 40.6682 34.1765 39.3165 45.6846 39.4756C45.8574 39.4779 46.0307 39.4814 46.2041 39.4844C46.4305 39.4884 46.6576 39.4909 46.8848 39.4961C47.3568 39.5065 47.8313 39.5207 48.3076 39.5361C48.4142 39.5397 48.5212 39.5441 48.6279 39.5479C51.1795 39.6366 53.791 39.7967 56.4512 40.0293C63.6811 24.5137 72.1655 12.7934 80.627 6.1709C85.0025 2.74635 89.5085 0.57999 93.9365 0.100586Z`;
var Qo = (e, t) => Lo([[B - e, B - e, t], [B + e, B - e, t], [B + e, B + e, t], [B - e, B + e, t]]);
var $o = (e, t, n) => Po((r) => {
  let i = Math.cos(r), a = Math.sin(r);
  return [B + i * e * Math.max(1 - a * a, 0) ** (n / 2 - 0.5) * 1, B + a * t];
});
var es = (e, t, n, r) => Po((i) => {
  let a = (e2) => {
    let t2 = Math.abs(((i - e2 + Math.PI) % V + V) % V - Math.PI);
    return Math.exp(-(t2 * t2) / 0.4232);
  }, o = 1 - n * a(r) + n * 0.34 * a(r + Math.PI);
  return [B + Math.cos(i) * e * o, B + Math.sin(i) * t * o];
});
var ts = (e, t, n) => Po((r) => {
  let i = e * (1 + t * (Math.sin(r * 2 + n) * 0.6 + Math.sin(r * 3 - n) * 0.4));
  return [B + Math.cos(r) * i, B + Math.sin(r) * i * 0.98];
});
var ns = (e, t = 4) => {
  let n = e.match(/[MLCQZmlcqz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [], r = [], i = 0, a = ``, o = 0, s2 = 0, c = 0, l = 0, u = () => parseFloat(n[i++]), d = (e2, n2) => {
    let i2 = Math.max(2, Math.ceil(n2 / t));
    for (let t2 = 1; t2 <= i2; t2++) r.push(e2(t2 / i2));
  };
  for (; i < n.length; ) {
    if (/[a-z]/i.test(n[i]) && (a = n[i++].toUpperCase()), a === `Z`) {
      Math.hypot(c - o, l - s2) > 0.01 && d((e2) => [o + (c - o) * e2, s2 + (l - s2) * e2], Math.hypot(c - o, l - s2)), o = c, s2 = l;
      continue;
    }
    if (i >= n.length) break;
    if (a === `M`) o = u(), s2 = u(), c = o, l = s2, r.push([o, s2]), a = `L`;
    else if (a === `L`) {
      let e2 = u(), t2 = u();
      d((n2) => [o + (e2 - o) * n2, s2 + (t2 - s2) * n2], Math.hypot(e2 - o, t2 - s2)), o = e2, s2 = t2;
    } else if (a === `Q`) {
      let e2 = u(), t2 = u(), n2 = u(), r2 = u(), i2 = o, a2 = s2;
      d((o2) => {
        let s3 = 1 - o2;
        return [s3 * s3 * i2 + 2 * s3 * o2 * e2 + o2 * o2 * n2, s3 * s3 * a2 + 2 * s3 * o2 * t2 + o2 * o2 * r2];
      }, Math.hypot(e2 - o, t2 - s2) + Math.hypot(n2 - e2, r2 - t2)), o = n2, s2 = r2;
    } else {
      let e2 = u(), t2 = u(), n2 = u(), r2 = u(), i2 = u(), a2 = u(), c2 = o, l2 = s2;
      d((o2) => {
        let s3 = 1 - o2;
        return [s3 * s3 * s3 * c2 + 3 * s3 * s3 * o2 * e2 + 3 * s3 * o2 * o2 * n2 + o2 * o2 * o2 * i2, s3 * s3 * s3 * l2 + 3 * s3 * s3 * o2 * t2 + 3 * s3 * o2 * o2 * r2 + o2 * o2 * o2 * a2];
      }, Math.hypot(e2 - o, t2 - s2) + Math.hypot(n2 - e2, r2 - t2) + Math.hypot(i2 - n2, a2 - r2)), o = i2, s2 = a2;
    }
  }
  return r;
};
var rs = (e, t = 160) => {
  let n = 1 / 0, r = -1 / 0;
  for (let t2 of e) t2[1] < n && (n = t2[1]), t2[1] > r && (r = t2[1]);
  let i = r - n, a = (e2) => n + i * (e2 + 0.5) / t, o = new Float64Array(t), s2 = new Float64Array(t), c = new Float64Array(t), l = new Float64Array(t);
  for (let n2 = 0; n2 < t; n2++) {
    let t2 = a(n2), r2 = -1 / 0, i2 = 1 / 0, u2 = 1 / 0, d = -1 / 0;
    for (let n3 = 0; n3 < e.length; n3++) {
      let a2 = e[n3], o2 = e[(n3 + 1) % e.length];
      if (a2[1] <= t2 == o2[1] <= t2) continue;
      let s3 = a2[0] + (o2[0] - a2[0]) * (t2 - a2[1]) / (o2[1] - a2[1]);
      s3 <= 114.2705 ? s3 > r2 && (r2 = s3) : s3 < i2 && (i2 = s3), s3 < u2 && (u2 = s3), s3 > d && (d = s3);
    }
    o[n2] = Number.isFinite(r2) ? r2 : B, s2[n2] = Number.isFinite(i2) ? i2 : B, c[n2] = Number.isFinite(u2) ? u2 : B, l[n2] = Number.isFinite(d) ? d : B;
  }
  let u = (e2, r2) => (a2) => {
    let o2 = jo((a2 - n) / i * t - 0.5, 0, t - 1), s3 = Math.floor(o2), c2 = o2 - s3, l2 = Math.min(s3 + 1, t - 1);
    return [e2[s3] + (e2[l2] - e2[s3]) * c2, r2[s3] + (r2[l2] - r2[s3]) * c2];
  };
  return { top: n, bottom: r, spanAt: u(o, s2), outerAt: u(c, l) };
};
var is = 96;
var as = (e) => Array.from({ length: is }, (t, n) => {
  let r = n / is * V, i = Math.cos(r), a = Math.sin(r), o = 0;
  for (let t2 = 0; t2 < e.length; t2++) {
    let n2 = e[t2], r2 = e[(t2 + 1) % e.length], s2 = n2[0] - B, c = n2[1] - B, l = r2[0] - B, u = r2[1] - B, d = (l - s2) * a - (u - c) * i;
    if (Math.abs(d) < 1e-9) continue;
    let f2 = (s2 * a - c * i) / -d;
    if (f2 < 0 || f2 > 1) continue;
    let p = (s2 + (l - s2) * f2) * i + (c + (u - c) * f2) * a;
    p > o && (o = p);
  }
  return [B + i * o, B + a * o];
});
var os = (e, t, n, r) => {
  let i = 0;
  return e.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (e2) => {
    i ^= 1;
    let a = parseFloat(e2) + (i ? n : r);
    return String(H(B + (a - B) * t));
  });
};
var ss = 228.44;
var cs = (e) => {
  let t = 1 / 0, n = -1 / 0, r = 1 / 0, i = -1 / 0;
  for (let a2 of e) a2[0] < t && (t = a2[0]), a2[0] > n && (n = a2[0]), a2[1] < r && (r = a2[1]), a2[1] > i && (i = a2[1]);
  let a = B - (t + n) / 2, o = B - (r + i) / 2;
  return { k: jo(ss / Math.max(n - t, i - r), 0.9, 1.35), dx: a, dy: o };
};
var ls = (e, t) => {
  let { k: n, dx: r, dy: i } = cs(t);
  return Math.abs(n - 1) < 5e-3 && Math.abs(r) < 0.5 && Math.abs(i) < 0.5 ? e : os(e, n, r, i);
};
var us = (e) => {
  let t = ls(e, ns(e)), n = ns(t), { top: r, bottom: i, spanAt: a, outerAt: o } = rs(n), s2 = 0;
  for (let e2 = r; e2 <= i; e2 += 2) {
    let [t2, n2] = o(e2);
    s2 = Math.max(s2, (n2 - t2) / 2);
  }
  return { path: t, ring: as(n), top: H(r), bottom: H(i), spanAt: a, beltRadius: H(s2) };
};
var ds = { pebble: () => ts(108, 0.075, 1.1), bean: () => es(94, 112, 0.34, Math.PI), egg: () => Go(98, 113, 0.22), squircle: () => Ro(107, 107, 3.2), square: () => qo(107, 28), tablet: () => zo(114, 74), capsule: () => Bo(72, 113), cylinder: () => Vo(94, 110, 48), hex: () => Io(114, 6, 20, Math.PI / 6), gem: () => Ro(112, 113, 1.5), shield: () => Wo(98, 108, 30), dome: () => Ho(114, 82, 26), arch: () => Uo(76, 113, 42), cloud: () => Lo([[B - 62, B + 26, 56], [B + 62, B + 26, 54], [B, B + 34, 62], [B - 24, B - 30, 62], [B + 38, B - 26, 54]]), leaf: () => $o(88, 113, 1.5), clover: () => Qo(38, 58), house: () => Jo(100, 110, 78, 29), heart: () => Yo, sparkle: () => Zo, star6: () => Xo };
var fs = /* @__PURE__ */ new Map();
function ps(e) {
  let t = fs.get(e);
  if (t != null) return t;
  let n = us(ds[e]());
  return fs.set(e, n), n;
}
var U = (e, t = 4) => ns(ps(e).path, t);
var ms = (e) => ns(e);
var hs = (e, t) => us(Ko(e, B - 114, B + 26, t));
var gs = (e, t) => us(Io(130, 3, [t, e, e], -Math.PI / 2));
var _s = Math.PI * 2;
var vs = 0.36;
var ys = 0.22;
var bs = 4;
var xs = 1e-12;
var Ss = 64;
var Cs = 33;
var ws = 40;
var Ts = 0.72;
var Es = 16;
var Ds = 160;
var Os = 180;
var ks = 64;
var As = 1e-5;
var js = { pebble: () => Rs(1.2167999999999999, `pebble`), bean: () => {
  let e = ic(`bean`);
  return { size: 1.17, silhouette: { kind: `solid`, samples: [], balls: e, isLoop: false, yawPeriod: null }, seat: Ws(`bean`, e) };
}, egg: () => Rs(1.17, `egg`), squircle: () => ({ size: 1.17, silhouette: Is(Js(`squircle`, 0.28, 0.11)), seat: { kind: `front`, faceZ: 0.28 } }), tablet: () => {
  let { x0: e, x1: t, y0: n, y1: r } = qs(`tablet`), i = (t - e) / 2 / B, a = (r - n) / 2 / B, o = Math.max(0, i - a);
  return { size: 1.3922999999999999, silhouette: { kind: `solid`, samples: [], balls: nc(`tablet`, `x`), isLoop: false, yawPeriod: null }, seat: { kind: `wrapX`, wrapR: a, wrapX0: -i + 0.02, wrapX1: i - 0.02, radiusAtX: (e2) => {
    let t2 = Math.abs(e2) - o;
    return t2 <= 0 ? a : Math.sqrt(Math.max(0, a * a - t2 * t2));
  } } };
}, capsule: () => {
  let e = nc(`capsule`, `y`), { y0: t, y1: n } = qs(`capsule`), r = -(n - B) / B, i = -(t - B) / B, { hx: a, hz: o } = rc(e);
  return { size: 1.17, silhouette: { kind: `solid`, samples: [], balls: e, isLoop: false, yawPeriod: null }, seat: { kind: `wrap`, wrapR: Math.max(0.35, (a + o) * 0.5), wrapY0: r, wrapY1: i, eyeY: (r + i) * 0.5 } };
}, cylinder: () => zs(`cylinder`, (e, t) => (t + e) * 0.5), hex: () => Bs(1.2519, Ks(U(`hex`))), gem: () => Rs(1.17, `gem`), crystal: () => ({ size: 1.3805999999999998, silhouette: Is(Ys()), seat: { kind: `front`, faceZ: Math.sqrt(3) / 2 * 0.64 } }), wedge: () => {
  let e = gs(60, 80), t = ms(e.path), [n, r] = e.spanAt(e.top + (e.bottom - e.top) * 0.5), i = -(e.top - B) / B, a = -(e.bottom - B) / B;
  return { size: 1.3590719999999998, silhouette: Ls(Qs(t)), seat: { kind: `wrap`, wrapR: Math.max(0.2, (r - n) / 2 / B), wrapY0: a, wrapY1: i, eyeY: i + (a - i) * 0.5, radiusAt: tc(t) } };
}, shield: () => Rs(1.17, `shield`), dome: () => Rs(1.17, `dome`), arch: () => zs(`arch`, (e, t) => e + (t - e) * 0.42), cloud: () => Us(1.3455, Ks(U(`cloud`, 1)), 0.72), teardrop: () => {
  let e = hs(88, 48), t = ms(e.path), [n, r] = e.spanAt(e.top + (e.bottom - e.top) * 0.62), i = -(e.bottom - B) / B, a = -(e.top - B) / B;
  return { size: 1.318122, silhouette: Ls(Qs(t)), seat: { kind: `wrap`, wrapR: Math.max(0.2, (r - n) / 2 / B), wrapY0: i, wrapY1: a, eyeY: (i + a) * 0.5, radiusAt: tc(t) } };
}, leaf: () => Rs(1.17, `leaf`), square: () => Bs(1.0413, Ks(U(`square`))), starFlower: () => Bs(1.3922999999999999, oc()), sparkle: () => Bs(1.521, Ks(U(`sparkle`))), clover: () => Bs(1.0881, Ks(U(`clover`))), heartChubby: () => Us(1.3571999999999997, Ao, 0.62), house: () => Bs(1.17, Ks(U(`house`))), star6: () => Vs(1.4976, Ks(U(`star6`)), 0.3, 0.18) };
var Ms = /* @__PURE__ */ new Map();
var Ns = null;
function Ps(e) {
  let t = Ms.get(e);
  if (t != null) return t;
  let n = js[e]();
  return Ms.set(e, n), n;
}
function Fs() {
  return Ns ??= { size: 1.17, silhouette: { kind: `solid`, samples: Ks(U(`bean`)), balls: [], isLoop: true, yawPeriod: null }, seat: null }, Ns;
}
function Is(e) {
  return { kind: `solid`, samples: e, balls: [], isLoop: false, yawPeriod: null };
}
function Ls(e) {
  return { kind: `solid`, samples: e, balls: [], isLoop: false, yawPeriod: 360 / Ss };
}
function Rs(e, t) {
  return { size: e, silhouette: Ls(Zs(t)), seat: Ws(t, []) };
}
function zs(e, t) {
  let n = ps(e), r = -(n.top - B) / B, i = -(n.bottom - B) / B;
  return { size: 1.17, silhouette: Ls(Zs(e)), seat: { kind: `wrap`, wrapR: n.beltRadius / B, wrapY0: i, wrapY1: r, eyeY: t(r, i), radiusAt: ec(e) } };
}
function Bs(e, t) {
  return Vs(e, t, vs, ys);
}
function Vs(e, t, n, r) {
  return { size: e, silhouette: { kind: `extrusion`, rings: ac(t, n, r), isConvex: Hs(t) }, seat: { kind: `front`, faceZ: n } };
}
function Hs(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    let r = e[n], i = e[(n + 1) % e.length], a = e[(n + 2) % e.length], o = (i.x - r.x) * (a.y - i.y) - (i.y - r.y) * (a.x - i.x);
    if (!(Math.abs(o) < xs)) {
      if (t === 0) t = Math.sign(o);
      else if (Math.sign(o) !== t) return false;
    }
  }
  return true;
}
function Us(e, t, n) {
  let r = sc(t, n);
  return { size: e, silhouette: { kind: `loft`, rings: r.rings }, seat: { kind: `loft`, surfaceZ: cc(r) } };
}
function Ws(e, t) {
  let n = ps(e), r = -(n.bottom - B) / B, i = -(n.top - B) / B, a = ec(e), o = Math.min(i - 0.02, Math.max(r + 0.02, 0));
  return { kind: `wrap`, wrapR: a(o), wrapY0: r, wrapY1: i, eyeY: o, radiusAt: a, puffAt: t.length > 0 ? (e2, n2) => Gs(t, e2, n2) : void 0 };
}
function Gs(e, t, n) {
  let r = e[0], i = -1 / 0, a = 1 / 0, o = false;
  for (let s2 of e) {
    let e2 = Math.hypot(t - s2[0], n - s2[1]);
    if (e2 < s2[3]) {
      let t2 = s2[2] + Math.sqrt(s2[3] * s2[3] - e2 * e2);
      (!o || t2 > i) && (o = true, i = t2, r = s2);
    } else !o && e2 - s2[3] < a && (a = e2 - s2[3], r = s2);
  }
  return { x: r[0], y: r[1], z: r[2], r: r[3] };
}
function Ks(e) {
  return e.map(([e2, t]) => ({ x: (e2 - B) / B, y: -(t - B) / B, z: 0 }));
}
function qs(e) {
  let t = 1 / 0, n = -1 / 0, r = 1 / 0, i = -1 / 0;
  for (let [a, o] of ps(e).ring) a < t && (t = a), a > n && (n = a), o < r && (r = o), o > i && (i = o);
  return { x0: t, x1: n, y0: r, y1: i };
}
function Js(e, t, n) {
  let r = ps(e).ring.map(([e2, t2]) => ({ x: (e2 - B) / B, y: -(t2 - B) / B })), i = r.length, a = [];
  for (let e2 = 0; e2 < i; e2++) {
    let o = r[e2], s2 = r[(e2 - 1 + i) % i], c = r[(e2 + 1) % i], l = c.y - s2.y, u = -(c.x - s2.x), d = Math.hypot(l, u) || 1;
    l /= d, u /= d, l * o.x + u * o.y < 0 && (l = -l, u = -u);
    for (let e3 = 0; e3 <= bs; e3++) {
      let r2 = e3 / bs * (Math.PI / 2), i2 = n * (1 - Math.cos(r2)), s3 = t - n + n * Math.sin(r2);
      a.push({ x: o.x - l * i2, y: o.y - u * i2, z: s3 }), a.push({ x: o.x - l * i2, y: o.y - u * i2, z: -s3 });
    }
  }
  return a;
}
function Ys() {
  let e = 0.12, t = [{ x: 0, y: 1.04, z: 0 }, { x: 0, y: -1.04, z: 0 }], n = 0.52;
  for (let e2 of [-1, 1]) for (let r2 = 0; r2 < 6; r2++) {
    let i = r2 / 6 * _s;
    t.push({ x: n * Math.cos(i), y: e2 * 0.51, z: n * Math.sin(i) });
  }
  let r = [];
  for (let n2 of t) for (let t2 = 0; t2 <= 8; t2++) {
    let i = t2 / 8 * Math.PI, a = Math.sin(i), o = t2 === 0 || t2 === 8 ? 1 : 14;
    for (let t3 = 0; t3 < o; t3++) {
      let s2 = t3 / o * _s;
      r.push({ x: n2.x + e * a * Math.sin(s2), y: n2.y + e * Math.cos(i), z: n2.z + e * a * Math.cos(s2) });
    }
  }
  return r;
}
function Xs(e) {
  let t = e.length, n = 1 / 0, r = -1 / 0;
  for (let [, t2] of e) t2 < n && (n = t2), t2 > r && (r = t2);
  n -= As, r += As;
  let i = (e2) => Math.min(63, Math.floor((e2 - n) / (r - n) * ks)), a = Array.from({ length: ks }, () => []);
  for (let n2 = 0; n2 < t; n2++) {
    let r2 = e[n2][1], o = e[(n2 + 1) % t][1], s2 = i(Math.max(r2, o) + As);
    for (let e2 = i(Math.min(r2, o) - As); e2 <= s2; e2++) a[e2].push(n2);
  }
  return (o) => {
    let s2 = 1 / 0, c = -1 / 0;
    if (!(o >= n && o <= r)) return c - s2;
    for (let n2 of a[i(o)]) {
      let [r2, i2] = e[n2], [a2, l] = e[(n2 + 1) % t];
      if (Math.abs(l - i2) < 1e-9) {
        Math.abs(i2 - o) < 1e-6 && (s2 = Math.min(s2, r2, a2), c = Math.max(c, r2, a2));
        continue;
      }
      if (i2 <= o && l >= o || l <= o && i2 >= o) {
        let e2 = r2 + (a2 - r2) * (o - i2) / (l - i2);
        e2 < s2 && (s2 = e2), e2 > c && (c = e2);
      }
    }
    return c - s2;
  };
}
function Zs(e) {
  return Qs(U(e));
}
function Qs(e) {
  let t = 1 / 0, n = -1 / 0;
  for (let [, r2] of e) r2 < t && (t = r2), r2 > n && (n = r2);
  let r = [], i = -(t - B) / B, a = -(n - B) / B, o = Xs(e), s2 = (e2) => {
    let t2 = o(e2);
    return t2 < 0 ? 0 : t2 / 2 / B;
  }, c = n - t, l = (e2, t2) => {
    if (s2(e2) >= 0.06) return null;
    let n2 = s2(e2), r2 = c * 0.02;
    for (let i2 = c / 512; i2 <= c * 0.05; i2 += c / 512) if (Math.abs(s2(e2 + t2 * i2) - n2) > 1e-4) {
      r2 = i2;
      break;
    }
    return { yEdge: e2, sign: t2, dJoin: r2, rJoin: s2(e2 + t2 * r2) };
  }, u = [l(t, 1), l(n, -1)].filter((e2) => e2 !== null), d = (e2) => {
    let t2 = s2(e2);
    for (let n2 of u) {
      let r2 = (e2 - n2.yEdge) * n2.sign;
      r2 >= 0 && r2 < n2.dJoin && (t2 = Math.min(t2, n2.rJoin * Math.sqrt(r2 / n2.dJoin)));
    }
    return t2;
  }, f2 = (e2, t2) => {
    let n2 = d(t2);
    n2 < 0.06 ? r.push({ x: 0, y: e2, z: 0 }) : r.push(...$s(e2, n2));
  };
  f2(i, t);
  for (let e2 = 1; e2 < 95; e2++) {
    let i2 = (1 - Math.cos(e2 / 95 * Math.PI)) / 2, a2 = t + (n - t) * i2, o2 = d(a2), s3 = -(a2 - B) / B;
    if (o2 < 1e-4) {
      r.push({ x: 0, y: s3, z: 0 });
      continue;
    }
    r.push(...$s(s3, o2));
  }
  return f2(a, n), r;
}
function $s(e, t) {
  let n = [];
  for (let r = 0; r < Ss; r++) {
    let i = r / Ss * _s;
    n.push({ x: t * Math.sin(i), y: e, z: t * Math.cos(i) });
  }
  return n;
}
function ec(e) {
  return tc(U(e));
}
function tc(e) {
  let t = Xs(e), n = 1 / 0, r = -1 / 0;
  for (let [, t2] of e) t2 < n && (n = t2), t2 > r && (r = t2);
  return (e2) => {
    let i = Math.max(n, Math.min(r, B - e2 * B));
    return Math.max(0.02, t(i) / 2 / B);
  };
}
function nc(e, t) {
  let { x0: n, x1: r, y0: i, y1: a } = qs(e), o = (r - n) / 2 / B, s2 = (a - i) / 2 / B, c = t === `x` ? s2 : o, l = Math.max(0, (t === `x` ? o : s2) - c), u = -l, d = [];
  for (let e2 = 0; e2 < Cs; e2++) {
    let n2 = u + (l - u) * (e2 / 32);
    d.push(t === `x` ? [n2, 0, 0, c] : [0, n2, 0, c]);
  }
  return d;
}
function rc(e) {
  let t = 0.55, n = 0.35;
  for (let [r, , i, a] of e) t = Math.max(t, Math.abs(r) + a), n = Math.max(n, Math.abs(i) + a);
  return { hx: t, hz: n };
}
function ic(e) {
  let t = U(e), n = 1 / 0, r = -1 / 0, i = 1 / 0, a = -1 / 0;
  for (let [e2, o2] of t) n = Math.min(n, e2), r = Math.max(r, e2), i = Math.min(i, o2), a = Math.max(a, o2);
  let o = (e2, n2) => {
    let r2 = false, i2 = t.length;
    for (let a2 = 0, o2 = i2 - 1; a2 < i2; o2 = a2++) {
      let [i3, s3] = t[a2], [c2, l2] = t[o2];
      s3 > n2 != l2 > n2 && e2 < i3 + (c2 - i3) * (n2 - s3) / (l2 - s3) && (r2 = !r2);
    }
    return r2;
  }, s2 = Math.max(r - n, a - i) / ws, c = [];
  for (let e2 = i + s2 / 2; e2 < a; e2 += s2) for (let i2 = n + s2 / 2; i2 < r; i2 += s2) {
    if (!o(i2, e2)) continue;
    let n2 = 1 / 0;
    for (let [r3, a2] of t) n2 = Math.min(n2, (r3 - i2) ** 2 + (a2 - e2) ** 2);
    let r2 = Math.sqrt(n2);
    r2 > s2 && c.push({ x: i2, y: e2, r: r2 });
  }
  c.sort((e2, t2) => t2.r - e2.r);
  let l = [];
  for (let e2 of c) l.some((t2) => Math.hypot(e2.x - t2.x, e2.y - t2.y) + e2.r <= t2.r + s2 * 0.25) || l.push(e2);
  return l.map((e2) => [(e2.x - B) / B, -(e2.y - B) / B, 0, e2.r / B]);
}
function ac(e, t, n) {
  let r = 1 / 0, i = -1 / 0, a = 1 / 0, o = -1 / 0;
  for (let t2 of e) r = Math.min(r, t2.x), i = Math.max(i, t2.x), a = Math.min(a, t2.y), o = Math.max(o, t2.y);
  let s2 = (r + i) / 2, c = (a + o) / 2, l = Math.max(1e-4, Math.min((i - r) / 2, (o - a) / 2)), u = (e2, r2) => {
    let i2 = e2 / bs * (Math.PI / 2), a2 = t - n + n * Math.sin(i2);
    return { z: r2 < 0 ? -a2 : a2, scale: 1 - n / l * (1 - Math.cos(i2)) };
  }, d = [];
  for (let e2 = bs; e2 >= 0; e2--) d.push(u(e2, -1));
  for (let e2 = 0; e2 <= bs; e2++) d.push(u(e2, 1));
  return d.map(({ z: t2, scale: n2 }) => e.map((e2) => ({ x: s2 + (e2.x - s2) * n2, y: c + (e2.y - c) * n2, z: t2 })));
}
function oc() {
  let e = 0.58, t = [{ x: 0, y: 0, r: 0.36 }];
  for (let n2 = 0; n2 < 6; n2++) {
    let r = -Math.PI / 2 + n2 * _s / 6;
    t.push({ x: e * Math.cos(r), y: e * Math.sin(r), r: 0.33 });
  }
  let n = [];
  for (let e2 = 0; e2 < 240; e2++) {
    let r = e2 / 240 * _s, i = Math.cos(r), a = Math.sin(r), o = 0, s2 = 0.9099999999999999;
    for (let e3 = 0; e3 < 22; e3++) {
      let e4 = (o + s2) / 2, n2 = e4 * i, r2 = e4 * a;
      t.some((e5) => (n2 - e5.x) * (n2 - e5.x) + (r2 - e5.y) * (r2 - e5.y) <= e5.r * e5.r) ? o = e4 : s2 = e4;
    }
    n.push({ x: o * i, y: o * a, z: 0 });
  }
  return n;
}
function sc(e, t) {
  let n = e.length / Ds, r = n > 1 ? Array.from({ length: Ds }, (t2, r2) => e[Math.floor(r2 * n)]) : e, i = 1 / 0, a = -1 / 0, o = 1 / 0, s2 = -1 / 0;
  for (let e2 of r) i = Math.min(i, e2.x), a = Math.max(a, e2.x), o = Math.min(o, e2.y), s2 = Math.max(s2, e2.y);
  let c = { x: (i + a) / 2, y: (o + s2) / 2 }, l = [];
  for (let e2 = 0; e2 <= Es; e2++) {
    let n2 = -Math.PI / 2 + Math.PI * e2 / Es, i2 = Math.max(0, Math.cos(n2)) ** +Ts, a2 = t * Math.sin(n2);
    l.push(r.map((e3) => ({ x: c.x + (e3.x - c.x) * i2, y: c.y + (e3.y - c.y) * i2, z: a2 })));
  }
  return { rings: l, center: c, depth: t };
}
function cc({ rings: e, center: t, depth: n }) {
  let r = e[Math.floor(e.length / 2)], i = new Float64Array(Os);
  for (let e2 = 0; e2 < Os; e2++) {
    let n2 = (e2 + 0.5) / Os * Math.PI * 2, a2 = Math.cos(n2), o = Math.sin(n2), s2 = 0;
    for (let e3 = 0; e3 < r.length; e3++) {
      let n3 = r[e3], i2 = r[(e3 + 1) % r.length], c = i2.x - n3.x, l = i2.y - n3.y, u = a2 * l - o * c;
      if (Math.abs(u) < 1e-9) continue;
      let d = n3.x - t.x, f2 = n3.y - t.y, p = (d * l - f2 * c) / u, m = (d * o - f2 * a2) / u;
      p > s2 && m >= 0 && m <= 1 && (s2 = p);
    }
    i[e2] = s2;
  }
  let a = (e2, n2) => {
    let r2 = e2 - t.x, a2 = n2 - t.y, o = Math.hypot(r2, a2);
    if (o < 1e-8) return 0;
    let s2 = (Math.atan2(a2, r2) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * Os, c = Math.floor(s2) % Os, l = s2 - Math.floor(s2), u = i[c], d = i[(c + 1) % Os];
    return Math.min(1, o / Math.max(1e-8, u * (1 - l) + d * l));
  };
  return (e2, t2) => n * Math.sqrt(Math.max(0, 1 - a(e2, t2) ** (2 / Ts)));
}
var lc = Math.PI * 2;
var uc = 0.2;
var dc = 0.36;
var fc = 1.18;
var pc = 160;
var W = 480;
var mc = bc(pc);
var hc = bc(W);
var gc = 1.01;
var _c = 1e-5;
var vc = 0.01;
var yc = 8;
function bc(e) {
  return Array.from({ length: e }, (t, n) => {
    let r = n / e * lc;
    return { x: Math.cos(r), y: Math.sin(r) };
  });
}
function xc(e, t) {
  return Math.max(uc, e.size) * (dc * t / fc);
}
function Sc(e, t, n) {
  return kc(e.silhouette, Tc(e, t, n)).flatMap(Oc);
}
function Cc(e, t, n) {
  let r = e.silhouette;
  if (r.kind !== `extrusion` || !r.isConvex) return Sc(e, t, n);
  let { project: i } = Tc(e, t, n);
  return Oc(jc(r.rings.flat().map(i)));
}
function wc(e, t, n, r) {
  return e.seat == null ? [] : Pc(e.seat, r, Tc(e, t, n)).flatMap(Oc);
}
function Tc(e, t, n) {
  let r = n / 2, i = xc(e, n), a = Ec(t.yaw * Math.PI / 180, t.pitch * Math.PI / 180, t.roll * Math.PI / 180);
  return { rotate: a, project: (e2) => {
    let t2 = a(e2);
    return { x: r + i * t2.x, y: r - i * t2.y };
  }, origin: { x: r, y: r }, radius: i };
}
function Ec(e, t, n) {
  let [r, i, a] = Dc(e), [o, s2, c] = Dc(t), [l, u, d] = Dc(n);
  return ({ x: e2, y: t2, z: n2 }) => {
    let f2 = e2 * r + n2 * i, p = t2 * r + t2 * a, m = n2 * r - e2 * i, h = f2 * o + f2 * c, g = p * o - m * s2, _ = m * o + p * s2;
    return { x: h * l - g * u, y: g * l + h * u, z: _ * l + _ * d };
  };
}
function Dc(e) {
  let t = Math.cos(e);
  return [t, Math.sin(e), 1 - t];
}
function Oc(e) {
  let [t] = e;
  if (e.length < 2 || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return [];
  let n = [];
  for (let t2 of e) Number.isFinite(t2.x) && Number.isFinite(t2.y) && n.push(t2.x, t2.y);
  return n.length >= 6 ? [n] : [];
}
function kc(e, t) {
  if (e.kind === `loft`) return [Nc(e.rings, t)];
  if (e.kind === `solid`) return [Ac(e, t)];
  let n = e.rings.map((e2) => e2.map(t.project)), r = n[0], i = n[n.length - 1], a = [i, r];
  for (let e2 = 1; e2 < n.length; e2++) {
    let t2 = n[e2 - 1], r2 = n[e2];
    for (let e3 = 0; e3 < r2.length; e3++) {
      let n2 = (e3 + 1) % i.length;
      a.push([t2[e3], t2[n2], r2[n2], r2[e3]]);
    }
  }
  return a;
}
function Ac(e, { project: t, origin: n, radius: r }) {
  let i = [];
  for (let n2 of e.samples) {
    let e2 = t(n2);
    Number.isFinite(e2.x) && Number.isFinite(e2.y) && i.push(e2);
  }
  if (e.isLoop) return i;
  if (e.balls.length === 0) return jc(i);
  let a = e.balls.map(([e2, n2, i2, a2]) => ({ ...t({ x: e2, y: n2, z: i2 }), r: a2 * r })).filter((e2) => Number.isFinite(e2.x) && Number.isFinite(e2.y) && e2.r > 1e-6), o = n.x, s2 = n.y;
  if (a.length > 0) {
    o = 0, s2 = 0;
    for (let e2 of a) o += e2.x, s2 += e2.y;
    o /= a.length, s2 /= a.length;
  }
  for (let { x: e2, y: t2 } of mc) {
    let n2 = 0;
    for (let r2 of a) {
      let i2 = r2.x - o, a2 = r2.y - s2, c = e2 * i2 + t2 * a2, l = c * c - (i2 * i2 + a2 * a2) + r2.r * r2.r;
      if (l <= 0) continue;
      let u = c + Math.sqrt(l);
      u > n2 && (n2 = u);
    }
    n2 > 0 && i.push({ x: o + e2 * n2, y: s2 + t2 * n2 });
  }
  if (e.samples.length > 0) return jc(i);
  if (i.length >= 3) return i;
  for (let e2 of a) for (let t2 = 0; t2 < 48; t2++) {
    let n2 = t2 / 48 * lc;
    i.push({ x: e2.x + e2.r * Math.cos(n2), y: e2.y + e2.r * Math.sin(n2) });
  }
  return i.length >= 3 ? jc(i) : i;
}
function jc(e) {
  let t = Mc(e.filter((e2) => Number.isFinite(e2.x) && Number.isFinite(e2.y)));
  if (t.length < 3) return t;
  let n = (e2, t2, n2) => (t2.x - e2.x) * (n2.y - e2.y) - (t2.y - e2.y) * (n2.x - e2.x), r = [];
  for (let e2 of t) {
    for (; r.length >= 2 && n(r[r.length - 2], r[r.length - 1], e2) <= 0; ) r.pop();
    r.push(e2);
  }
  let i = [];
  for (let e2 = t.length - 1; e2 >= 0; e2--) {
    let r2 = t[e2];
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], r2) <= 0; ) i.pop();
    i.push(r2);
  }
  return r.pop(), i.pop(), [...r, ...i];
}
function Mc(e) {
  let t = 1 / 0, n = -1 / 0;
  for (let { x: r2 } of e) r2 < t && (t = r2), r2 > n && (n = r2);
  let r = Math.ceil(e.length / yc), i = n > t ? r / (n - t) : 0, a = (e2) => Math.min(r - 1, Math.floor((e2 - t) * i)), o = new Int32Array(r + 1);
  for (let { x: t2 } of e) o[a(t2) + 1]++;
  for (let e2 = 0; e2 < r; e2++) o[e2 + 1] += o[e2];
  let s2 = o.slice(0, r), c = Array(e.length);
  for (let t2 of e) c[s2[a(t2.x)]++] = t2;
  for (let e2 = 0; e2 < r; e2++) for (let t2 = o[e2] + 1; t2 < o[e2 + 1]; t2++) {
    let n2 = c[t2], r2 = t2 - 1;
    for (; r2 >= o[e2] && (c[r2].x > n2.x || c[r2].x === n2.x && c[r2].y > n2.y); r2--) c[r2 + 1] = c[r2];
    c[r2 + 1] = n2;
  }
  return c;
}
function Nc(e, { project: t, origin: n }) {
  let r = e.map((e2) => e2.map(t)), i = (e2) => {
    let t2 = 0, n2 = 0;
    for (let r2 of e2) t2 += r2.x, n2 += r2.y;
    return { x: t2 / e2.length, y: n2 / e2.length };
  }, a = i(r[0]), o = i(r[r.length - 1]);
  if (Math.hypot(o.x - a.x, o.y - a.y) < 1e-4) {
    let e2 = r[0], t2 = 0;
    for (let n2 of r) {
      let r2 = 0;
      for (let e3 = 0; e3 < n2.length; e3++) {
        let t3 = n2[e3], i2 = n2[(e3 + 1) % n2.length];
        r2 += t3.x * i2.y - i2.x * t3.y;
      }
      Math.abs(r2) > t2 && (e2 = n2, t2 = Math.abs(r2));
    }
    return e2;
  }
  let s2 = r.map((e2) => e2.map(({ x: e3, y: t2 }) => (e3 - n.x) * (e3 - n.x) + (t2 - n.y) * (t2 - n.y))), c = s2.map((e2) => Math.max(...e2)), l = _c * Math.max(...c) + vc, u = (e2, t2) => {
    let n2 = (t2 - l) / gc;
    return n2 > 0 && e2 < n2 * n2;
  }, d = r.map((e2) => e2.map((e3) => {
    let t2 = (Math.atan2(e3.y - n.y, e3.x - n.x) + lc) % lc;
    return Math.floor(t2 / lc * W) % W;
  })), f2 = new Float64Array(W), p = 0, m = (e2, t2, r2, i2, a2) => {
    if (u(a2, p)) return;
    let o2 = i2 - r2;
    o2 > W / 2 ? o2 -= W : o2 < -240 && (o2 += W);
    let s3 = o2 < 0 ? -1 : 1, c2 = Math.abs(o2), l2 = 1 / 0;
    for (let e3 = -1; e3 <= c2 + 1; e3++) {
      let t3 = (r2 + s3 * e3 + W) % W;
      f2[t3] < l2 && (l2 = f2[t3]);
    }
    if (u(a2, l2)) return;
    let d2 = t2.x - e2.x, m2 = t2.y - e2.y, h2 = e2.x - n.x, g = e2.y - n.y;
    for (let e3 = -1; e3 <= c2 + 1; e3++) {
      let t3 = (r2 + s3 * e3 + W) % W, { x: n2, y: i3 } = hc[t3], a3 = n2 * m2 - i3 * d2;
      if (Math.abs(a3) < 1e-9) continue;
      let o3 = (h2 * m2 - g * d2) / a3, c3 = (h2 * i3 - g * n2) / a3;
      o3 > f2[t3] && c3 >= 0 && c3 <= 1 && (f2[t3] = o3);
    }
  }, h = c.map((e2, t2) => t2).sort((e2, t2) => c[t2] - c[e2]);
  for (let e2 of h) {
    let t2 = r[e2];
    for (let n2 = 0; n2 < t2.length; n2++) {
      let r2 = (n2 + 1) % t2.length;
      m(t2[n2], t2[r2], d[e2][n2], d[e2][r2], Math.max(s2[e2][n2], s2[e2][r2]));
    }
    p = Math.min(...f2);
  }
  for (let e2 = 0; e2 < r.length - 1; e2++) {
    let t2 = r[e2], n2 = r[e2 + 1];
    for (let r2 = 0; r2 < Math.min(t2.length, n2.length); r2++) m(t2[r2], n2[r2], d[e2][r2], d[e2 + 1][r2], Math.max(s2[e2][r2], s2[e2 + 1][r2]));
  }
  return hc.flatMap(({ x: e2, y: t2 }, r2) => f2[r2] > 0 ? [{ x: n.x + e2 * f2[r2], y: n.y + t2 * f2[r2] }] : []);
}
function Pc(e, t, n) {
  switch (e.kind) {
    case `front`:
      return Fc(e.faceZ, t, n);
    case `loft`:
      return Ic(e.surfaceZ, t, n);
    case `wrap`:
      return Lc(e, t, n);
    case `wrapX`:
      return Rc(e, t, n);
    default:
      throw Error(`Unhandled case`);
  }
}
function Fc(e, { loops: t, shiftY: n }, r) {
  if (!(r.rotate({ x: 0, y: 0, z: 1 }).z > 0.03)) return [];
  let i = Math.sin(n);
  return t.filter((e2) => e2.length >= 3).map((t2) => t2.map((t3) => r.project({ x: t3.x, y: t3.y - i, z: e })));
}
function Ic(e, { loops: t, shiftY: n }, { rotate: r, project: i }) {
  if (!(r({ x: 0, y: 0, z: 1 }).z >= 0.05)) return [];
  let a = Math.sin(n), o = [];
  for (let n2 of t) {
    if (n2.length < 3) continue;
    let t2 = n2.map((e2) => ({ x: e2.x, y: e2.y - a })), s2 = 0, c = 0;
    for (let e2 of t2) s2 += e2.x, c += e2.y;
    s2 /= t2.length, c /= t2.length;
    let l = 4e-3, u = (e(s2 + l, c) - e(s2 - l, c)) / (2 * l), d = (e(s2, c + l) - e(s2, c - l)) / (2 * l), f2 = Math.hypot(u, d, 1);
    if (r({ x: -u / f2, y: -d / f2, z: 1 / f2 }).z < 0.12) continue;
    let p = e(s2, c);
    o.push(t2.map((e2) => i({ x: e2.x, y: e2.y, z: p + (e2.x - s2) * u + (e2.y - c) * d })));
  }
  return o;
}
function Lc(e, { loops: t, shiftY: n }, { rotate: r, project: i }) {
  let { wrapR: a, wrapY0: o, wrapY1: s2, radiusAt: c, puffAt: l } = e, u = c ? 0.02 : 0.06, d = Math.min(s2 - u, Math.max(o + u, e.eyeY - n)), f2 = (e2) => Math.min(s2, Math.max(o, e2)), p = (e2) => {
    let t2 = [];
    for (let n2 of e2) {
      let e3 = f2(d + n2.y), l2 = c ? c(e3) : a, u2 = Math.max(-2.6, Math.min(2.6, n2.x / Math.max(0.12, l2))), p2 = 0;
      if (c) {
        let t3 = 0.012;
        p2 = -(c(Math.min(s2, e3 + t3)) - c(Math.max(o, e3 - t3))) / (2 * t3);
      }
      r({ x: Math.sin(u2), y: p2, z: Math.cos(u2) }).z >= 0.05 && t2.push(i({ x: l2 * Math.sin(u2), y: e3, z: l2 * Math.cos(u2) }));
    }
    return t2;
  }, m = (e2) => {
    if (!l || e2.length === 0) return [];
    let t2 = 0, n2 = 0;
    for (let r2 of e2) t2 += r2.x, n2 += r2.y;
    let a2 = l(t2 / e2.length, f2(d + n2 / e2.length)), o2 = r({ x: 0, y: 0, z: 1 }).z, s3 = [];
    for (let t3 of e2) {
      let e3 = t3.x - a2.x, n3 = f2(d + t3.y) - a2.y, c2 = Math.hypot(e3, n3), l2 = Math.min(c2 / a2.r, Math.PI - 0.02), u2 = c2 > 1e-9 ? e3 / c2 : 1, p2 = c2 > 1e-9 ? n3 / c2 : 0, m2 = r({ x: u2, y: p2, z: 0 }).z, h2 = (e4) => m2 * Math.sin(e4) + o2 * Math.cos(e4);
      if (h2(l2) < 0.06 && o2 > 0.06) {
        let e4 = 0, t4 = l2;
        for (let n4 = 0; n4 < 20; n4++) {
          let n5 = (e4 + t4) / 2;
          h2(n5) >= 0.06 ? e4 = n5 : t4 = n5;
        }
        l2 = e4;
      }
      let g2 = a2.r * Math.sin(l2);
      r({ x: u2 * Math.sin(l2), y: p2 * Math.sin(l2), z: Math.cos(l2) }).z >= 0.05 && s3.push(i({ x: a2.x + u2 * g2, y: a2.y + p2 * g2, z: a2.z + a2.r * Math.cos(l2) }));
    }
    return s3;
  }, h = 1 / 0, g = -1 / 0;
  for (let e2 of t) for (let t2 of e2) t2.y < h && (h = t2.y), t2.y > g && (g = t2.y);
  let _ = 0;
  g - h <= s2 - o && (d + h < o ? _ = o - (d + h) : d + g > s2 && (_ = s2 - (d + g)));
  let v = _ === 0 ? t : t.map((e2) => e2.map((e3) => ({ x: e3.x, y: e3.y + _ }))), y = l ? m : p;
  return v.map(y).filter((e2) => e2.length > 2);
}
function Rc(e, { loops: t, shiftY: n }, { rotate: r, project: i }) {
  let { wrapR: a, wrapX0: o, wrapX1: s2, radiusAtX: c } = e, l = Math.max(-2.4, Math.min(2.4, -n / a)), u = 1 / 0, d = -1 / 0;
  for (let e2 of t) for (let t2 of e2) t2.x < u && (u = t2.x), t2.x > d && (d = t2.x);
  let f2 = 0;
  return d - u <= s2 - o && (u < o ? f2 = o - u : d > s2 && (f2 = s2 - d)), (f2 === 0 ? t : t.map((e2) => e2.map((e3) => ({ x: e3.x + f2, y: e3.y })))).map((e2) => {
    let t2 = [];
    for (let n2 of e2) {
      let e3 = Math.min(s2, Math.max(o, n2.x)), u2 = c(e3), d2 = l + Math.max(-2.6, Math.min(2.6, n2.y / Math.max(0.12, a))), f3 = 0.012;
      r({ x: -(c(Math.min(s2, e3 + f3)) - c(Math.max(o, e3 - f3))) / (2 * f3), y: Math.sin(d2), z: Math.cos(d2) }).z >= 0.05 && t2.push(i({ x: e3, y: u2 * Math.sin(d2), z: u2 * Math.cos(d2) }));
    }
    return t2;
  }).filter((e2) => e2.length > 2);
}
var zc = { kind: `extrusion`, halfDepth: 0.36, bevel: 0.22 };
var Bc = { cloud: { kind: `loft`, depth: 0.72 }, square: zc, sparkle: zc, clover: zc, heartChubby: { kind: `loft`, depth: 0.62 }, starFlower: zc, teardrop: { kind: `revolve` }, tablet: { kind: `pill`, axis: 0 }, wedge: { kind: `revolve` }, house: zc, star6: { kind: `extrusion`, halfDepth: 0.3, bevel: 0.18 }, pebble: { kind: `revolve` }, bean: { kind: `inscribedBalls` }, egg: { kind: `revolve` }, squircle: { kind: `roundedSlab`, halfDepth: 0.28, edge: 0.11 }, capsule: { kind: `pill`, axis: 1 }, cylinder: { kind: `revolve` }, hex: zc, gem: { kind: `revolve` }, crystal: { kind: `crystal` }, shield: { kind: `revolve` }, dome: { kind: `revolve` }, arch: { kind: `revolve` }, leaf: { kind: `revolve` } };
var Vc = Math.PI * 2;
var Hc = 1024;
var Uc = { yaw: 0, pitch: 0, roll: 0 };
var Wc = 4;
var Gc = 64;
var Kc = 96;
var qc = 4;
var Jc = 0.72;
var Yc = 16;
var Xc = 33;
var Zc = 40;
var Qc = 1e-9;
var $c = 1e-15;
var el = /* @__PURE__ */ new Map();
function tl(e) {
  let t = el.get(e);
  if (t != null) return t;
  let n = nl(e, Bc[e]);
  return el.set(e, n), n;
}
function nl(e, t) {
  if (t.kind === `inscribedBalls`) return { kind: `balls`, balls: ul(rl(Fs())[0]) };
  let n = rl(Ps(e));
  switch (t.kind) {
    case `extrusion`:
      return il(n, t.halfDepth, t.bevel);
    case `revolve`:
      return al(yl(n[0]));
    case `roundedSlab`:
      return ol(dl(yl(n[0])), t.halfDepth, t.edge);
    case `pill`:
      return { kind: `balls`, balls: sl(yl(n[0]), t.axis) };
    case `crystal`:
      return cl();
    case `loft`:
      return ll(yl(n[0]), t.depth);
    default:
      throw Error(`Unhandled case`);
  }
}
function rl(e) {
  let t = xc(e, Hc), n = Hc / 2;
  return Sc(e, Uc, Hc).map((e2) => e2.map((e3, r) => r % 2 == 0 ? (e3 - n) / t : (n - e3) / t));
}
function il(e, t, n) {
  let r = e[0].length / 2, i = _l(Array.from({ length: r }, (t2, n2) => {
    let i2 = e[2 + Wc * r + n2];
    return [i2[0], i2[1]];
  })), { x0: a, x1: o, y0: s2, y1: c } = vl(i), l = (a + o) / 2, u = (s2 + c) / 2, d = Math.max(1e-4, Math.min((o - a) / 2, (c - s2) / 2)), f2 = Math.min(t * 0.8, n), p = (e2) => {
    let n2 = e2 / Wc * (Math.PI / 2);
    return { z: t - f2 + f2 * Math.sin(n2), scale: 1 - f2 / d * (1 - Math.cos(n2)) };
  }, m = Array.from({ length: 5 }, (e2, t2) => p(t2)), { vertices: h, faces: g } = fl([...m.map(({ z: e2, scale: t2 }) => ({ z: -e2, scale: t2 })).reverse(), ...m].map(({ z: e2, scale: t2 }) => i.map(([n2, r2]) => [l + (n2 - l) * t2, u + (r2 - u) * t2, e2])), true), _ = g.length - 1;
  return { kind: `mesh`, vertices: h, faces: g.map((e2, t2) => ({ corners: e2, isBounding: t2 === 0 || t2 === _ })) };
}
function al(e) {
  let t = /* @__PURE__ */ new Map();
  for (let [n2, r2] of e) n2 > -1e-9 && t.set(r2, Math.max(t.get(r2) ?? 0, n2));
  let n = [], r = (e2) => n.push(e2) - 1, i = [...t].sort((e2, t2) => t2[0] - e2[0]).map(([e2, t2]) => t2 <= Qc ? [r([0, e2, 0])] : Array.from({ length: Gc }, (n2, i2) => {
    let a2 = i2 / Gc * Vc;
    return r([t2 * Math.sin(a2), e2, t2 * Math.cos(a2)]);
  })), a = [i[0], i[i.length - 1]].filter((e2) => e2.length > 1), o = i.slice(1).flatMap((e2, t2) => ml(i[t2], e2));
  return hl(n, [...a, ...o]);
}
function ol(e, t, n) {
  let r = e.length, i = e.map((t2, n2) => {
    let i2 = e[(n2 - 1 + r) % r], a2 = e[(n2 + 1) % r], o = a2[1] - i2[1], s2 = -(a2[0] - i2[0]), c = Math.hypot(o, s2) || 1;
    return o /= c, s2 /= c, o * t2[0] + s2 * t2[1] < 0 ? [-o, -s2] : [o, s2];
  }), a = [];
  return e.forEach(([e2, r2], o) => {
    for (let s2 = 0; s2 <= qc; s2++) {
      let c = s2 / qc * (Math.PI / 2), l = n * (1 - Math.cos(c)), u = t - n + n * Math.sin(c), d = e2 - i[o][0] * l, f2 = r2 - i[o][1] * l;
      a.push([d, f2, u], [d, f2, -u]);
    }
  }), pl(a);
}
function sl(e, t) {
  let n = Math.max(...e.map((e2) => Math.abs(e2[1 - t]))), r = Math.max(...e.map((e2) => Math.abs(e2[t]))) - n;
  return Array.from({ length: Xc }, (e2, i) => {
    let a = -r + 2 * r * (i / 32);
    return { center: t === 0 ? [a, 0, 0] : [0, a, 0], radius: n };
  });
}
function cl() {
  let e = 0.12, t = [[0, 1.04, 0], [0, -1.04, 0]], n = 0.52;
  for (let e2 of [-1, 1]) for (let r2 = 0; r2 < 6; r2++) {
    let i = r2 / 6 * Vc;
    t.push([n * Math.cos(i), e2 * 0.51, n * Math.sin(i)]);
  }
  let r = [];
  for (let [n2, i, a] of t) for (let t2 = 0; t2 <= 8; t2++) {
    let o = t2 / 8 * Math.PI, s2 = Math.sin(o), c = t2 === 0 || t2 === 8 ? 1 : 14;
    for (let t3 = 0; t3 < c; t3++) {
      let l = t3 / c * Vc;
      r.push([n2 + e * s2 * Math.sin(l), i + e * Math.cos(o), a + e * s2 * Math.cos(l)]);
    }
  }
  return pl(r);
}
function ll(e, t) {
  let n = _l(e), { x0: r, x1: i, y0: a, y1: o } = vl(n), s2 = (r + i) / 2, c = (a + o) / 2, { vertices: l, faces: u } = fl(Array.from({ length: 17 }, (e2, r2) => {
    let i2 = -Math.PI / 2 + Math.PI * r2 / Yc, a2 = Math.max(0, Math.cos(i2)) ** +Jc, o2 = t * Math.sin(i2);
    return n.map(([e3, t2]) => [s2 + (e3 - s2) * a2, c + (t2 - c) * a2, o2]);
  }), false);
  return { kind: `mesh`, vertices: l, faces: u.map((e2) => ({ corners: e2, isBounding: false })) };
}
function ul(e) {
  let t = yl(e).map(([e2, t2]) => [B + B * e2, B - B * t2]), { x0: n, x1: r, y0: i, y1: a } = vl(t), o = (e2, n2) => {
    let r2 = false;
    for (let i2 = 0, a2 = t.length - 1; i2 < t.length; a2 = i2++) {
      let [o2, s3] = t[i2], [c2, l2] = t[a2];
      s3 > n2 != l2 > n2 && e2 < o2 + (c2 - o2) * (n2 - s3) / (l2 - s3) && (r2 = !r2);
    }
    return r2;
  }, s2 = Math.max(r - n, a - i) / Zc, c = [];
  for (let e2 = i + s2 / 2; e2 < a; e2 += s2) for (let i2 = n + s2 / 2; i2 < r; i2 += s2) {
    if (!o(i2, e2)) continue;
    let n2 = 1 / 0;
    for (let [r3, a2] of t) n2 = Math.min(n2, (r3 - i2) ** 2 + (a2 - e2) ** 2);
    let r2 = Math.sqrt(n2);
    r2 > s2 && c.push({ x: i2, y: e2, r: r2 });
  }
  c.sort((e2, t2) => t2.r - e2.r);
  let l = [];
  for (let e2 of c) l.some((t2) => Math.hypot(e2.x - t2.x, e2.y - t2.y) + e2.r <= t2.r + s2 * 0.25) || l.push(e2);
  return l.map((e2) => ({ center: [(e2.x - B) / B, -(e2.y - B) / B, 0], radius: e2.r / B }));
}
function dl(e) {
  return Array.from({ length: Kc }, (t, n) => {
    let r = n / Kc * Vc, i = Math.cos(r), a = -Math.sin(r), o = 0;
    return e.forEach((t2, n2) => {
      let r2 = e[(n2 + 1) % e.length], s2 = r2[0] - t2[0], c = r2[1] - t2[1], l = i * c - a * s2;
      if (Math.abs(l) < $c) return;
      let u = (t2[0] * c - t2[1] * s2) / l, d = (t2[0] * a - t2[1] * i) / l;
      u > o && d >= -1e-9 && d <= 1.000000001 && (o = u);
    }), [i * o, a * o];
  });
}
function fl(e, t) {
  let n = e[0].length, r = e.flat(), i = [], a = (e2, t2) => e2 * n + t2 % n;
  t && i.push(Array.from({ length: n }, (e2, t2) => a(0, n - 1 - t2)));
  for (let t2 = 1; t2 < e.length; t2++) for (let e2 = 0; e2 < n; e2++) i.push([a(t2 - 1, e2), a(t2 - 1, e2 + 1), a(t2, e2 + 1), a(t2, e2)]);
  return t && i.push(Array.from({ length: n }, (t2, n2) => a(e.length - 1, n2))), { vertices: r, faces: i };
}
function pl(e) {
  return { kind: `mesh`, vertices: e, faces: yo(e).map((e2) => ({ corners: e2, isBounding: true })) };
}
function ml(e, t) {
  return e.length === 1 && t.length === 1 ? [] : e.length === 1 ? t.map((n, r) => [e[0], n, t[(r + 1) % t.length]]) : t.length === 1 ? e.map((n, r) => [n, t[0], e[(r + 1) % e.length]]) : e.map((n, r) => [n, t[r], t[(r + 1) % t.length], e[(r + 1) % e.length]]);
}
function hl(e, t) {
  let n = e.length, r = [e.reduce((e2, t2) => e2 + t2[0], 0) / n, e.reduce((e2, t2) => e2 + t2[1], 0) / n, e.reduce((e2, t2) => e2 + t2[2], 0) / n];
  return { kind: `mesh`, vertices: e, faces: t.map((t2) => {
    let [n2, i, a] = gl(e, t2), o = t2.reduce((t3, n3) => [t3[0] + e[n3][0], t3[1] + e[n3][1], t3[2] + e[n3][2]], [0, 0, 0]), s2 = t2.length;
    return { corners: n2 * (o[0] / s2 - r[0]) + i * (o[1] / s2 - r[1]) + a * (o[2] / s2 - r[2]) < 0 ? [...t2].reverse() : t2, isBounding: true };
  }) };
}
function gl(e, t) {
  let n = 0, r = 0, i = 0;
  for (let a = 0; a < t.length; a++) {
    let o = e[t[a]], s2 = e[t[(a + 1) % t.length]];
    n += (o[1] - s2[1]) * (o[2] + s2[2]), r += (o[2] - s2[2]) * (o[0] + s2[0]), i += (o[0] - s2[0]) * (o[1] + s2[1]);
  }
  return [n, r, i];
}
function _l(e) {
  let t = 0;
  return e.forEach((n, r) => {
    let i = e[(r + 1) % e.length];
    t += n[0] * i[1] - i[0] * n[1];
  }), t < 0 ? [...e].reverse() : e;
}
function vl(e) {
  let t = 1 / 0, n = -1 / 0, r = 1 / 0, i = -1 / 0;
  for (let [a, o] of e) t = Math.min(t, a), n = Math.max(n, a), r = Math.min(r, o), i = Math.max(i, o);
  return { x0: t, x1: n, y0: r, y1: i };
}
function yl(e) {
  return Array.from({ length: e.length / 2 }, (t, n) => [e[2 * n], e[2 * n + 1]]);
}
var bl = 1024;
var xl = 2 ** 23;
var Sl = 2 ** 25;
var Cl = 2 ** 26;
var wl = class {
  xs = [];
  ys = [];
  #e = /* @__PURE__ */ new Map();
  id(e, t) {
    let n = (e + xl) * Sl + (t + xl), r = this.#e.get(n);
    return r ?? (r = this.xs.length, this.xs.push(e), this.ys.push(t), this.#e.set(n, r)), r;
  }
};
function Tl(e) {
  let t = ``;
  for (let n of e) {
    t += `M${Rl(n[0])} ${Rl(n[1])}`;
    for (let e2 = 2; e2 < n.length; e2 += 2) t += ` ${Rl(n[e2])} ${Rl(n[e2 + 1])}`;
    t += `Z`;
  }
  return t;
}
function El(e) {
  let t = Dl(e), n = Ol(t);
  return Nl(Ml(jl(t.flatMap((e2) => kl(e2, n)))));
}
function Dl(e) {
  let t = new wl(), n = /* @__PURE__ */ new Map(), r = [], i = [], a = (e2) => {
    let r2 = Il(e2);
    if (r2 === 0) return;
    let a2 = e2.length / 2;
    i.length = 0;
    for (let n2 = 0; n2 < a2; n2++) {
      let o2 = r2 > 0 ? n2 : a2 - 1 - n2;
      i.push(t.id(e2[2 * o2], e2[2 * o2 + 1]));
    }
    for (let e3 = 0; e3 < a2; e3++) {
      let t2 = i[e3], r3 = i[(e3 + 1) % a2];
      if (t2 === r3) continue;
      let o2 = r3 * Cl + t2, s3 = n.get(o2) ?? 0;
      s3 > 1 ? n.set(o2, s3 - 1) : s3 === 1 ? n.delete(o2) : n.set(t2 * Cl + r3, (n.get(t2 * Cl + r3) ?? 0) + 1);
    }
  };
  for (let t2 of e) {
    r.length = t2.length;
    for (let e3 = 0; e3 < t2.length; e3++) r[e3] = Math.round(t2[e3] * bl);
    let e2 = r.length === 8 ? Pl(r) : null;
    if (e2 == null) a(r);
    else for (let t3 of e2) a(t3);
  }
  let { xs: o, ys: s2 } = t;
  return [...n].map(([e2, t2]) => {
    let n2 = Math.floor(e2 / Cl), r2 = e2 - n2 * Cl;
    return { ax: o[n2], ay: s2[n2], bx: o[r2], by: s2[r2], count: t2 };
  });
}
function Ol(e) {
  let t = new wl();
  for (let n2 of e) t.id(n2.ax, n2.ay), t.id(n2.bx, n2.by);
  let n = e.map((e2, t2) => t2).sort((t2, n2) => Ll(e[t2]) - Ll(e[n2]));
  n.forEach((r2, i2) => {
    let a = e[r2], o = Math.max(a.ax, a.bx);
    for (let r3 = i2 + 1; r3 < n.length; r3++) {
      let i3 = e[n[r3]];
      if (Ll(i3) > o) break;
      if (Math.min(i3.ay, i3.by) > Math.max(a.ay, a.by) || Math.max(i3.ay, i3.by) < Math.min(a.ay, a.by)) continue;
      let s2 = Math.sign(G(a.ax, a.ay, a.bx, a.by, i3.ax, i3.ay)), c = Math.sign(G(a.ax, a.ay, a.bx, a.by, i3.bx, i3.by)), l = G(i3.ax, i3.ay, i3.bx, i3.by, a.ax, a.ay), u = G(i3.ax, i3.ay, i3.bx, i3.by, a.bx, a.by);
      if (s2 * c >= 0 || Math.sign(l) * Math.sign(u) >= 0) continue;
      let d = l / (l - u);
      t.id(Math.round(a.ax + (a.bx - a.ax) * d), Math.round(a.ay + (a.by - a.ay) * d));
    }
  });
  let { xs: r, ys: i } = t;
  return r.map((e2, t2) => ({ x: e2, y: i[t2] })).sort((e2, t2) => e2.x - t2.x);
}
function kl(e, t) {
  let n = e.bx - e.ax, r = e.by - e.ay, i = Math.abs(n) + Math.abs(r), a = Math.min(e.ay, e.by) - 0.5, o = Math.max(e.ay, e.by) + 0.5, s2 = Math.max(e.ax, e.bx) + 0.5, c = [];
  for (let l2 = Al(t, Math.min(e.ax, e.bx) - 0.5); l2 < t.length && t[l2].x <= s2; l2++) {
    let { x: s3, y: u } = t[l2];
    u < a || u > o || 2 * Math.abs(G(e.ax, e.ay, e.bx, e.by, s3, u)) > i || c.push({ t: ((s3 - e.ax) * n + (u - e.ay) * r) / (n * n + r * r), x: s3, y: u });
  }
  c.sort((e2, t2) => e2.t - t2.t);
  let l = [];
  for (let t2 = 1; t2 < c.length; t2++) {
    let n2 = c[t2 - 1], r2 = c[t2];
    (n2.x !== r2.x || n2.y !== r2.y) && l.push({ ax: n2.x, ay: n2.y, bx: r2.x, by: r2.y, count: e.count });
  }
  return l;
}
function Al(e, t) {
  let n = 0, r = e.length;
  for (; n < r; ) {
    let i = n + r >> 1;
    e[i].x < t ? n = i + 1 : r = i;
  }
  return n;
}
function jl(e) {
  let t = new wl(), n = /* @__PURE__ */ new Map();
  for (let r2 of e) {
    let e2 = t.id(r2.ax, r2.ay), i2 = t.id(r2.bx, r2.by), a2 = Math.min(e2, i2) * Cl + Math.max(e2, i2);
    n.set(a2, (n.get(a2) ?? 0) + (e2 < i2 ? r2.count : -r2.count));
  }
  let { xs: r, ys: i } = t, a = [];
  for (let [e2, t2] of n) {
    if (t2 === 0) continue;
    let n2 = Math.floor(e2 / Cl), o = e2 - n2 * Cl;
    a.push({ ax: r[n2], ay: i[n2], bx: r[o], by: i[o], count: t2 });
  }
  return a;
}
function Ml(e) {
  let t = [];
  for (let n of e) {
    let r = n.ax + n.bx, i = n.ay + n.by, a = 0;
    for (let t2 of e) {
      if (t2 === n) continue;
      let e2 = 2 * t2.ay, o2 = 2 * t2.by;
      e2 <= i ? o2 > i && G(2 * t2.ax, e2, 2 * t2.bx, o2, r, i) > 0 && (a += t2.count) : o2 <= i && G(2 * t2.ax, e2, 2 * t2.bx, o2, r, i) < 0 && (a -= t2.count);
    }
    let o = n.ay < n.by || n.ay === n.by && n.ax > n.bx ? a + n.count : a, s2 = o - n.count;
    o !== 0 != (s2 !== 0) && t.push(o === 0 ? { ax: n.bx, ay: n.by, bx: n.ax, by: n.ay, count: 1 } : { ...n, count: 1 });
  }
  return t;
}
function Nl(e) {
  let t = new wl(), n = [];
  for (let r2 of e) {
    let e2 = t.id(r2.ax, r2.ay), i2 = t.id(r2.bx, r2.by);
    for (; n.length <= Math.max(e2, i2); ) n.push([]);
    for (let t2 = 0; t2 < Math.abs(r2.count); t2++) r2.count > 0 ? n[e2].push(i2) : n[i2].push(e2);
  }
  let { xs: r, ys: i } = t, a = ``;
  return n.forEach((e2, t2) => {
    for (; e2.length > 0; ) {
      a += `M${Rl(r[t2] / bl)} ${Rl(i[t2] / bl)}`;
      let o = e2.pop();
      for (; o != null && o !== t2; ) a += ` ${Rl(r[o] / bl)} ${Rl(i[o] / bl)}`, o = n[o].pop();
      a += `Z`;
    }
  }), a;
}
function Pl(e) {
  let [t, n, r, i, a, o, s2, c] = e, l = Fl(t, n, r, i, a, o, s2, c);
  if (l != null) return [[t, n, l[0], l[1], s2, c], [l[0], l[1], r, i, a, o]];
  let u = Fl(r, i, a, o, s2, c, t, n);
  return u == null ? null : [[r, i, u[0], u[1], t, n], [u[0], u[1], a, o, s2, c]];
}
function Fl(e, t, n, r, i, a, o, s2) {
  let c = Math.sign(G(e, t, n, r, i, a)), l = Math.sign(G(e, t, n, r, o, s2)), u = G(i, a, o, s2, e, t), d = G(i, a, o, s2, n, r);
  if (!(c * l < 0 && Math.sign(u) * Math.sign(d) < 0)) return null;
  let f2 = u / (u - d);
  return [Math.round(e + (n - e) * f2), Math.round(t + (r - t) * f2)];
}
function G(e, t, n, r, i, a) {
  return (n - e) * (a - t) - (r - t) * (i - e);
}
function Il(e) {
  let t = 0;
  for (let n = 0; n < e.length; n += 2) {
    let r = (n + 2) % e.length;
    t += e[n] * e[r + 1] - e[r] * e[n + 1];
  }
  return t;
}
function Ll(e) {
  return Math.min(e.ax, e.bx);
}
function Rl(e) {
  return String(Math.round(e * 100) / 100);
}
var zl = Math.PI / 6;
var Bl = -1.24;
var Vl = 0.79;
var Hl = 3.24;
var Ul = 48;
var Wl = 160;
var Gl = 1e-3;
var Kl = 0.18;
var K = tu([-0.5, 0.6, 0.62]);
var ql = [...[0, 1, 2, 3, 4, 5].map((e) => {
  let t = e * zl;
  return { center: [0, 0, 0], a: [Math.sin(t), 0, Math.cos(t)], b: [0, 1, 0], isEquator: false };
}), ...[-2, -1, 0, 1, 2].map((e) => {
  let t = e * zl, n = Math.cos(t);
  return { center: [0, Math.sin(t), 0], a: [0, 0, n], b: [n, 0, 0], isEquator: e === 0 };
})];
var Jl = null;
function Yl(e, t) {
  let n = L(t, e.center), r = L(t, e.a), i = L(t, e.b), a = Math.hypot(r[2], i[2]), o = 0, s2 = 2 * Math.PI;
  if (a > Math.abs(n[2])) {
    let e2 = Math.atan2(i[2], r[2]), t2 = Math.acos(-n[2] / a);
    o = e2 - t2, s2 = e2 + t2;
  } else if (n[2] <= 0) return null;
  return { center: [n[0], n[1]], a: [r[0], r[1]], b: [i[0], i[1]], from: o, to: s2 };
}
function Xl(e, t) {
  let n = Math.sqrt(Math.max(0, 1 - e * e - t * t)), r = K[0] * e + K[1] * t + K[2] * n;
  return Kl + 0.8200000000000001 * Math.max(0, r);
}
function Zl() {
  if (Jl !== null) return Jl;
  let e = Math.hypot(K[0], K[1]), t = [K[0] / e, K[1] / e], n = { origin: [Bl * K[0], Bl * K[1]], axisX: [Vl * Hl * t[0], Vl * Hl * t[1]], axisY: [-3.24 * t[1], Hl * t[0]], focus: 2.41 * e / (Vl * Hl) };
  return Jl = { ...n, stops: $l(n) }, Jl;
}
function Ql(e, t, n) {
  let r = t - e.origin[0], i = n - e.origin[1], a = (r * e.axisX[0] + i * e.axisX[1]) / (e.axisX[0] ** 2 + e.axisX[1] ** 2), o = (r * e.axisY[0] + i * e.axisY[1]) / (e.axisY[0] ** 2 + e.axisY[1] ** 2), s2 = e.focus, c = s2 * s2 - 1, l = 2 * s2 * (a - s2), u = (a - s2) ** 2 + o * o;
  return (-l - Math.sqrt(l * l - 4 * c * u)) / (2 * c);
}
function $l(e) {
  let t = new Float64Array(49), n = new Float64Array(49), r = new Float64Array(49), i = 0;
  for (let a2 = 0; a2 < Wl; a2++) for (let o2 = 0; o2 < Wl; o2++) {
    let s2 = (a2 + 0.5) / Wl * 2 - 1, c = (o2 + 0.5) / Wl * 2 - 1;
    if (s2 * s2 + c * c >= 1) continue;
    let l = Math.min(1, Ql(e, s2, c)) * Ul, u = Math.min(47, Math.floor(l)), d = l - u, f2 = Xl(s2, c);
    t[u] += (1 - d) ** 2, t[u + 1] += d * d, n[u] += (1 - d) * d, r[u] += (1 - d) * f2, r[u + 1] += d * f2, i++;
  }
  let a = Gl * i / 49;
  for (let e2 = 0; e2 < Ul; e2++) t[e2] += a, t[e2 + 1] += a, n[e2] -= a;
  let o = eu(t, n, r);
  return Array.from(o, (e2, t2) => ({ offset: t2 / Ul, shade: e2 }));
}
function eu(e, t, n) {
  let r = e.length, i = new Float64Array(r), a = new Float64Array(r);
  i[0] = t[0] / e[0], a[0] = n[0] / e[0];
  for (let o2 = 1; o2 < r; o2++) {
    let r2 = e[o2] - t[o2 - 1] * i[o2 - 1];
    i[o2] = t[o2] / r2, a[o2] = (n[o2] - t[o2 - 1] * a[o2 - 1]) / r2;
  }
  let o = new Float64Array(r);
  o[r - 1] = a[r - 1];
  for (let e2 = r - 2; e2 >= 0; e2--) o[e2] = a[e2] - i[e2] * o[e2 + 1];
  return o;
}
function tu(e) {
  let t = Math.hypot(e[0], e[1], e[2]);
  return [e[0] / t, e[1] / t, e[2] / t];
}
var nu = 0.4;
var ru = 1e-9;
var iu = 6;
var au = 24;
var ou = 4e-3;
var su = Math.PI / 180;
function cu(e, t, n, r) {
  let i = tl(e), a = lu(t), o = xc(Ps(e), n), s2 = n / 2, c = r.map((e2) => e2 + (1 - e2) * nu), l = (e2) => {
    let t2 = e2[0] * K[0] + e2[1] * K[1] + e2[2] * K[2], n2 = Kl + (1 - Kl) * Math.max(0, t2);
    return _u(c.map((e3) => e3 * n2));
  }, u = (e2) => [s2 + o * e2[0], s2 - o * e2[1]], d = i.kind === `mesh` ? uu(i, a, u, l) : du(i.balls, a, u, o, l);
  return { baseFill: l([0, 0, 1]), faces: d };
}
function lu(e) {
  let [t, n] = [Math.cos(e.yaw * su), Math.sin(e.yaw * su)], [r, i] = [Math.cos(e.pitch * su), Math.sin(e.pitch * su)], [a, o] = [Math.cos(e.roll * su), Math.sin(e.roll * su)];
  return ([e2, s2, c]) => {
    let l = e2 * t + c * n, u = c * t - e2 * n, d = s2 * r - u * i, f2 = s2 * i + u * r;
    return [l * a - d * o, l * o + d * a, f2];
  };
}
function uu(e, t, n, r) {
  let i = e.vertices.map(t), a = [], o = /* @__PURE__ */ new Map();
  for (let t2 of e.faces) {
    let [e2, s2, c] = gl(i, t2.corners), l = Math.hypot(e2, s2, c);
    if (l === 0 || c <= ru * l) continue;
    let u = r([e2 / l, s2 / l, c / l]), d = t2.corners.flatMap((e3) => n(i[e3]));
    if (t2.isBounding) {
      pu(o, u, d);
      continue;
    }
    let f2 = t2.corners.reduce((e3, t3) => e3 + i[t3][2], 0) / t2.corners.length;
    a.push({ polygon: d, fill: u, depth: f2 });
  }
  return a.sort((e2, t2) => e2.depth - t2.depth), [...fu(a), ...[...o].map(([e2, t2]) => mu(t2, e2))];
}
function du(e, t, n, r, i) {
  let a = e.map((e2) => ({ center: t(e2.center), radius: e2.radius })), o = a.map((e2, t2) => t2).sort((e2, t2) => a[e2].center[2] + a[e2].radius - (a[t2].center[2] + a[t2].radius)), s2 = ou / r;
  return o.flatMap((e2) => {
    let { center: t2, radius: o2 } = a[e2], c = a.filter((t3, n2) => n2 !== e2 && a[n2].radius > s2), l = (e3) => c.some((t3) => e3.every((e4) => gu(e4, t3.center) < (t3.radius - s2) ** 2)), u = (e3, n2) => [t2[0] + o2 * Math.sin(e3) * Math.cos(n2), t2[1] + o2 * Math.sin(e3) * Math.sin(n2), t2[2] + o2 * Math.cos(e3)], d = hu(o2 * r), f2 = /* @__PURE__ */ new Map();
    for (let e3 = 0; e3 < iu; e3++) {
      let t3 = e3 / iu * (Math.PI / 2), r2 = (e3 + 1) / iu * (Math.PI / 2), a2 = e3 === 5 ? d : 1;
      for (let o3 = 0; o3 < au; o3++) {
        let s3 = o3 / au * 2 * Math.PI, c2 = (o3 + 1) / au * 2 * Math.PI, d2 = [...e3 === 0 ? [u(0, 0)] : [u(t3, s3)], ...Array.from({ length: a2 + 1 }, (e4, t4) => u(r2, s3 + (c2 - s3) * t4 / a2)), ...e3 === 0 ? [] : [u(t3, c2)]];
        if (l(d2)) continue;
        let p = (t3 + r2) / 2, m = (s3 + c2) / 2;
        pu(f2, i([Math.sin(p) * Math.cos(m), Math.sin(p) * Math.sin(m), Math.cos(p)]), d2.flatMap(n));
      }
    }
    return [...f2].map(([e3, t3]) => mu(t3, e3));
  });
}
function fu(e) {
  let t = [], n = 0;
  for (let r = 1; r <= e.length; r++) r < e.length && e[r].fill === e[n].fill || (t.push(mu(e.slice(n, r).map((e2) => e2.polygon), e[n].fill)), n = r);
  return t;
}
function pu(e, t, n) {
  let r = e.get(t);
  r == null ? e.set(t, [n]) : r.push(n);
}
function mu(e, t) {
  return { d: Tl(e), fill: t };
}
function hu(e) {
  if (e <= ou) return 1;
  let t = 2 * Math.acos(1 - ou / e);
  return Math.max(1, Math.ceil(2 * Math.PI / au / t));
}
function gu(e, t) {
  return (e[0] - t[0]) ** 2 + (e[1] - t[1]) ** 2 + (e[2] - t[2]) ** 2;
}
function _u(e) {
  return `#${e.map((e2) => Math.round(Math.min(1, Math.max(0, e2)) * 255).toString(16).padStart(2, `0`)).join(``)}`;
}
var vu = 60;
var yu = 256;
var bu = 24;
var xu = 2e4;
var Su = 0.2;
function Cu(e, t, n) {
  let r = { field: e, tolerance: n, root: n.deviation * 1e-3, reach: t.step * Math.hypot(t.nx, t.ny) }, i = [];
  for (let e2 of wu(r, t)) {
    let t2 = Au(Eu(r, e2), n);
    t2.length >= 3 && i.push(t2);
  }
  return i;
}
function wu(e, t) {
  let { field: n } = e, { x0: r, y0: i, step: a, nx: o, ny: s2 } = t, c = o + 1, l = new Float64Array(c * (s2 + 1));
  for (let e2 = 0; e2 <= s2; e2++) for (let t2 = 0; t2 <= o; t2++) l[e2 * c + t2] = n(r + t2 * a, i + e2 * a);
  let u = 2 * c * (s2 + 1), d = new Int32Array(u).fill(-1), f2 = /* @__PURE__ */ new Map(), p = (t2) => {
    let n2 = f2.get(t2);
    if (n2 !== void 0) return n2;
    let o2 = t2 >> 1, s3 = t2 & 1 ? o2 + c : o2 + 1, u2 = r + o2 % c * a, d2 = i + Math.floor(o2 / c) * a, p2 = r + s3 % c * a, m2 = i + Math.floor(s3 / c) * a, h2 = Tu(e, u2, d2, l[o2], p2, m2, l[s3]), g2 = [u2 + (p2 - u2) * h2, d2 + (m2 - d2) * h2];
    return f2.set(t2, g2), g2;
  }, m = [0, 0, 0, 0], h = [0, 0, 0, 0], g = [], _ = [];
  for (let e2 = 0; e2 < s2; e2++) for (let t2 = 0; t2 < o; t2++) {
    let o2 = e2 * c + t2;
    m[0] = o2, m[1] = o2 + 1, m[2] = o2 + 1 + c, m[3] = o2 + c, h[0] = 2 * o2, h[1] = 2 * (o2 + 1) + 1, h[2] = 2 * (o2 + c), h[3] = 2 * o2 + 1, g.length = 0, _.length = 0;
    for (let e3 = 0; e3 < 4; e3++) {
      let t3 = l[m[e3]] < 0;
      t3 !== l[m[e3 + 1 & 3]] < 0 && (g.push(h[e3]), _.push(t3));
    }
    if (g.length === 2) {
      let e3 = +!_[0];
      d[g[e3]] = g[1 - e3];
    } else if (g.length === 4) {
      let o3 = n(r + (t2 + 0.5) * a, i + (e2 + 0.5) * a) < 0;
      for (let e3 = 0; e3 < 4; e3++) _[e3] && (d[g[e3]] = g[e3 + (o3 ? 1 : 3) & 3]);
    }
  }
  let v = [], y = new Uint8Array(u);
  for (let e2 = 0; e2 < u; e2++) {
    if (d[e2] < 0 || y[e2]) continue;
    let t2 = [], n2 = e2;
    for (; n2 >= 0 && !y[n2]; ) y[n2] = 1, t2.push(p(n2)), n2 = d[n2];
    n2 === e2 && v.push(t2);
  }
  return v;
}
function Tu(e, t, n, r, i, a, o) {
  let s2 = 0, c = r, l = 1, u = o, d = 0, f2 = 0;
  for (let r2 = 0; r2 < vu; r2++) {
    f2 = (s2 * u - l * c) / (u - c);
    let r3 = e.field(t + (i - t) * f2, n + (a - n) * f2);
    if (Math.abs(r3) <= e.root || l - s2 <= 1e-15) break;
    r3 < 0 == u < 0 ? (l = f2, u = r3, d === -1 && (c /= 2), d = -1) : (s2 = f2, c = r3, d === 1 && (u /= 2), d = 1);
  }
  return f2;
}
function Eu(e, t) {
  let n = [];
  for (let r = 0; r < t.length; r++) {
    let i = t[r], a = t[(r + 1) % t.length];
    (i[0] !== a[0] || i[1] !== a[1]) && (n.push(i), Du(e, i, a, 0, n));
  }
  return n;
}
function Du(e, t, n, r, i) {
  let a = n[0] - t[0], o = n[1] - t[1], s2 = Math.sqrt(a * a + o * o);
  if (s2 === 0 || r >= bu || i.length >= xu) return;
  let c = (t[0] + n[0]) / 2, l = (t[1] + n[1]) / 2, u = e.field(c, l);
  if (!Number.isFinite(u)) return;
  let d = u > 0 ? 1 : -1, f2 = -o / s2 * d, p = a / s2 * d, m = ku(e, c, l, u, f2, p);
  if (m === null || m <= e.tolerance.deviation / 2 && s2 <= e.tolerance.edge) return;
  let h = u > 0 ? Ou(e, c, l, u, f2, p, m) : [c + f2 * m, l + p * m];
  Du(e, t, h, r + 1, i), i.push(h), Du(e, h, n, r + 1, i);
}
function Ou(e, t, n, r, i, a, o) {
  let s2 = [t + i * o, n + a * o], c = o * 1e-3, l = e.field(t + c, n) - e.field(t - c, n), u = e.field(t, n + c) - e.field(t, n - c), d = Math.sqrt(l * l + u * u);
  if (d === 0) return s2;
  let f2 = l * a - u * i < 0 ? -1 : 1, p = -u / d * f2, m = l / d * f2;
  if (p * i + m * a < Su) return s2;
  let h = ku(e, t, n, r, p, m);
  return h === null || h * (p * i + m * a) <= o ? s2 : [t + p * h, n + m * h];
}
function ku(e, t, n, r, i, a) {
  if (r === 0) return 0;
  let o = 0, s2 = r;
  for (let c = 0; c < yu; c++) {
    let c2 = o + Math.max(Math.abs(s2), e.root);
    if (c2 > e.reach) return null;
    let l = t + i * c2, u = n + a * c2, d = e.field(l, u);
    if (d < 0 != r < 0) return o + (c2 - o) * Tu(e, t + i * o, n + a * o, s2, l, u, d);
    o = c2, s2 = d;
  }
  return null;
}
function Au(e, t) {
  let n = e.length;
  if (n < 4) return e;
  let r = new Uint8Array(n), i = 0, a = -1;
  for (let t2 = 1; t2 < n; t2++) {
    let n2 = ju(e[0], e[t2]);
    n2 > a && (a = n2, i = t2);
  }
  r[0] = 1, r[i] = 1;
  let o = (i2, a2) => {
    if (a2 - i2 < 2) return;
    let s2 = e[i2], c = e[a2 % n], l = -1, u = i2;
    for (let t2 = i2 + 1; t2 < a2; t2++) {
      let n2 = Mu(e[t2], s2, c);
      n2 > l && (l = n2, u = t2);
    }
    let d = l > t.deviation / 2;
    !d && Math.sqrt(ju(s2, c)) <= t.edge || (d || (u = i2 + a2 >> 1), r[u] = 1, o(i2, u), o(u, a2));
  };
  return o(0, i), o(i, n), e.filter((e2, t2) => r[t2] === 1);
}
function ju(e, t) {
  let n = t[0] - e[0], r = t[1] - e[1];
  return n * n + r * r;
}
function Mu(e, t, n) {
  let r = n[0] - t[0], i = n[1] - t[1], a = e[0] - t[0], o = e[1] - t[1], s2 = r * r + i * i, c = s2 > 0 ? Math.min(1, Math.max(0, (a * r + o * i) / s2)) : 0, l = a - r * c, u = o - i * c;
  return Math.sqrt(l * l + u * u);
}
var Nu = [{ fill: `#3d3d3d`, paints: /* @__PURE__ */ new Set([1, 2]) }, { fill: `#525252`, paints: /* @__PURE__ */ new Set([2]) }];
var Pu = { deviation: 0.5, edge: 4 };
var Fu = 2;
var Iu = 4;
var Lu = 8;
var Ru = 19 * Math.PI / 180;
var zu = 0.16;
var Bu = 2.2;
var Vu = 0.9;
var Hu = 1.08;
var Uu = Hu * 0.84;
var Wu = -65 * Math.PI / 180;
var Gu = 1.17;
var Ku = 0.36;
var qu = 1.18;
var Ju = 160;
var Yu = 320;
var q = 256;
var Xu = 24;
var Zu = 1.25;
var Qu = 0.015;
var $u = 1.002;
var ed = -0.35;
var td = 48;
var nd = 2.2;
var rd = 14;
var id = 0.03;
var ad = 0.012;
var od = 48;
var J = 72;
var sd = 8;
var cd = 0.115;
var ld = 0.08;
var ud = 0.06;
var dd = 0.09;
var fd = 24;
var pd = 32;
var md = 0.6;
var hd = 0.012;
var gd = 0.02;
var _d = 128;
var vd = { x: 0, y: 0, z: 1 };
var yd = { x: 0, y: 1, z: 0 };
var bd = { x: 1, y: 0, z: 0 };
var xd = null;
var Sd = null;
var Cd = /* @__PURE__ */ new Map();
var wd = /* @__PURE__ */ new WeakMap();
function Td(e, t, n) {
  let r = 1 / ((Math.hypot(e, n) / Hu) ** +Bu + (Math.abs(t) / Uu) ** +Bu) ** (1 / Bu), i = Math.abs(Math.cos(Lu * (Math.atan2(n, e) - Math.PI / 2 - Ru) / 2)), a = t < 0 ? Math.max(0, 1 - t * t) ** 0.2 : Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.45 * t), o = 1 - zu * (1 - i ** 0.6) * a, s2 = Math.abs(Math.cos(3 * Math.asin(Math.max(-1, Math.min(1, t))))) ** 0.6, c = t < 0 ? 1 : Math.max(0, 1 - 2.2 * t), l = 1 - zu * 0.55 * Vu * (1 - s2) * c, u = t > 0 ? 0.11 * Math.exp(-(1 - t) / 0.02) : 0.03 * Math.exp(-(1 + t) / 0.03);
  return r * o * l * (1 - u);
}
function Ed() {
  if (xd != null) return xd;
  let e = new Float32Array(51681), t = 1 / 0, n = 0;
  for (let r = 0; r <= Ju; r++) {
    let i = -Math.PI / 2 + r / Ju * Math.PI, a = Math.cos(i), o = Math.sin(i);
    for (let i2 = 0; i2 <= Yu; i2++) {
      let s2 = -Math.PI + i2 / Yu * 2 * Math.PI, c = Td(a * Math.cos(s2), o, a * Math.sin(s2));
      e[r * 321 + i2] = c, c < t && (t = c), c > n && (n = c);
    }
  }
  return xd = { radii: e, least: t, most: n }, xd;
}
function Dd({ x: e, y: t, z: n }) {
  let { radii: r } = Ed(), i = (Math.asin(Math.max(-1, Math.min(1, t / (Math.hypot(e, t, n) || 1)))) + Math.PI / 2) / Math.PI * Ju, a = (Math.atan2(n, e) + Math.PI) / (2 * Math.PI) * Yu, o = Math.min(159, Math.max(0, Math.floor(i))), s2 = Math.min(319, Math.max(0, Math.floor(a))), c = i - o, l = a - s2, u = o * 321 + s2, d = u + Yu + 1;
  return (r[u] * (1 - l) + r[u + 1] * l) * (1 - c) + (r[d] * (1 - l) + r[d + 1] * l) * c;
}
function Od(e) {
  let t = Math.cos(e);
  return { c: t, s: Math.sin(e), k: 1 - t };
}
function kd(e, { c: t, s: n, k: r }) {
  return { x: e.x * t + e.x * r, y: e.y * t - e.z * n, z: e.z * t + e.y * n };
}
function Ad(e, { c: t, s: n, k: r }) {
  return { x: e.x * t + e.z * n, y: e.y * t + e.y * r, z: e.z * t - e.x * n };
}
function jd(e, { c: t, s: n, k: r }) {
  return { x: e.x * t - e.y * n, y: e.y * t + e.x * n, z: e.z * t + e.z * r };
}
function Md({ yaw: e, pitch: t, roll: n }) {
  let r = e * Math.PI / 180, i = t * Math.PI / 180, a = n * Math.PI / 180, [o, s2, c] = [Od(r), Od(i), Od(a)], [l, u, d] = [Od(-r), Od(-i), Od(-a)];
  return { toView: (e2) => jd(kd(Ad(e2, o), s2), c), toBody: (e2) => Ad(kd(jd(e2, d), u), l) };
}
function Nd(e) {
  return Gu * (Ku * e / qu);
}
function Pd(e, t) {
  let n = `${t} ${e.yaw} ${e.pitch} ${e.roll}`, r = Cd.get(n);
  if (r != null) return Cd.delete(n), Cd.set(n, r), r;
  let { toView: i, toBody: a } = Md(e), o = t / 2, s2 = Nd(t), c = new Float64Array(q), l = [];
  for (let e2 = 0; e2 < q; e2++) {
    let t2 = 2 * Math.PI * e2 / q, n2 = Math.cos(t2), r2 = Math.sin(t2), i2 = 0;
    for (let e3 = -24; e3 <= Xu; e3++) {
      let t3 = e3 / Xu * Zu, o2 = Math.cos(t3), s3 = Math.sin(t3), c2 = Dd(a({ x: n2 * o2, y: r2 * o2, z: s3 }));
      i2 = Math.max(i2, c2 * o2);
    }
    c[e2] = i2, l.push(o + s2 * i2 * n2, o - s2 * i2 * r2);
  }
  let u = { reaches: c, body: l, stem: tf(i, a, t) };
  if (Cd.set(n, u), Cd.size > _d) {
    let e2 = Cd.keys().next().value;
    e2 !== void 0 && Cd.delete(e2);
  }
  return u;
}
function Fd(e, t, n, r) {
  let { toView: i, toBody: a } = Md(t), o = n / 2, s2 = Nd(n), c = (e2) => ({ x: o + s2 * e2.x, y: o - s2 * e2.y }), l = i(vd), u = i(yd), d = i(bd), f2 = [];
  for (let t2 of r) {
    let n2 = Gd(t2.map(({ x: e2, y: t3 }) => i(Vd(e2, t3))), (e2) => {
      let n3 = Hd(e2, l);
      if (n3 <= 0.02) return false;
      let r2 = Math.acos(Math.max(-1, Math.min(1, n3))), i2 = Math.sin(r2);
      return i2 < 1e-8 ? Qd(t2, { x: 0, y: 0 }) : Qd(t2, { x: r2 * Hd(e2, d) / i2, y: r2 * Hd(e2, u) / i2 });
    }, e.reaches, a, o, s2, c);
    n2 != null && f2.push(n2);
  }
  return Jd(f2, e.reaches, o, s2).map($d);
}
function Id(e) {
  if (e == null) return [];
  let t = wd.get(e);
  if (t != null) return t;
  let n = Nu.flatMap(({ fill: t2, paints: n2 }) => {
    let r = Ld(e, n2);
    return r.length > 0 ? [{ fill: t2, polygons: r }] : [];
  });
  return wd.set(e, n), n;
}
function Ld(e, t) {
  let n = (t2, n2) => t2 < 0 || n2 < 0 || t2 >= e.width || n2 >= e.height ? 0 : e.paint[n2 * e.width + t2], r = (e2, r2) => t.has(n(e2, r2)), i = (e2, t2) => {
    for (let n2 = -2; n2 <= Fu; n2++) for (let i2 = -2; i2 <= Fu; i2++) if (r(e2 + i2, t2 + n2)) return true;
    return false;
  }, a = Rd(e), o = zd(a, (e2, t2) => n(e2, t2) !== 0), s2 = zd(a, (e2, t2) => r(e2, t2) || n(e2, t2) === 0 && i(e2, t2));
  return Cu((e2, t2) => Math.max(s2(e2, t2), o(e2, t2)), a, Pu).map((e2) => e2.flatMap(([e3, t2]) => [e3, t2]));
}
function Rd(e) {
  return { x0: e.left - Iu + 0.5, y0: e.top - Iu + 0.5, step: 1, nx: e.width + 8 - 1, ny: e.height + 8 - 1 };
}
function zd(e, t) {
  let n = e.nx + 1, r = e.ny + 1, i = new Float32Array(n * r);
  for (let e2 = 0; e2 < r; e2++) for (let r2 = 0; r2 < n; r2++) t(r2 - Iu, e2 - Iu) && (i[e2 * n + r2] = 1);
  let a = Bd(Bd(i, n, r, 1), n, r, n);
  return (t2, r2) => {
    let i2 = Math.min(e.nx, Math.max(0, t2 - e.x0)), o = Math.min(e.ny, Math.max(0, r2 - e.y0)), s2 = Math.min(e.nx - 1, Math.floor(i2)), c = Math.min(e.ny - 1, Math.floor(o)), l = i2 - s2, u = o - c, d = c * n + s2, f2 = a[d] * (1 - l) + a[d + 1] * l, p = a[d + n] * (1 - l) + a[d + n + 1] * l;
    return 0.5 - (f2 * (1 - u) + p * u);
  };
}
function Bd(e, t, n, r) {
  let i = new Float32Array(e.length);
  for (let a = 1; a < n - 1; a++) for (let n2 = 1; n2 < t - 1; n2++) {
    let o = a * t + n2;
    i[o] = (e[o - r] + 2 * e[o] + e[o + r]) / 4;
  }
  return i;
}
function Vd(e, t) {
  let n = Math.hypot(e, t);
  if (n < 1e-8) return vd;
  let r = Math.sin(n);
  return { x: e / n * r, y: t / n * r, z: Math.cos(n) };
}
function Hd(e, t) {
  return e.x * t.x + e.y * t.y + e.z * t.z;
}
function Ud(e, t) {
  let n = Math.hypot(e.x, e.y, e.z) || 1, r = { x: e.x / n, y: e.y / n, z: e.z / n }, i = Dd(t(r)) * $u;
  return { x: r.x * i, y: r.y * i, z: r.z * i };
}
function Wd(e, t) {
  let n = Math.hypot(e.x, e.y, e.z) || 1;
  if (e.z / n < ed) return false;
  let r = Ud(e, t);
  for (let e2 = 1; e2 <= td; e2++) {
    let n2 = 0.01 + e2 / td * nd, i = r.x, a = r.y, o = r.z + n2, s2 = Math.hypot(i, a, o);
    if (s2 > nd) break;
    if (s2 < Dd(t({ x: i / s2, y: a / s2, z: o / s2 }))) return false;
  }
  return true;
}
function Gd(e, t, n, r, i, a, o) {
  let s2 = e.map((e2) => Wd(e2, r));
  if (s2.every((e2) => !e2)) return null;
  if (s2.every((e2) => e2)) return e.map((e2) => o(Ud(e2, r)));
  let c = (e2, t2) => {
    let n2 = 0, i2 = 1;
    for (let a2 = 0; a2 < rd; a2++) {
      let a3 = (n2 + i2) / 2;
      Wd(Kd(e2, t2, a3), r) ? n2 = a3 : i2 = a3;
    }
    return Ud(Kd(e2, t2, n2), r);
  }, l = (e2) => {
    let t2 = e2 / (2 * Math.PI) * q;
    t2 = (t2 % q + q) % q;
    let r2 = Math.floor(t2) % q, o2 = t2 - Math.floor(t2), s3 = (n[r2] * (1 - o2) + n[(r2 + 1) % q] * o2) * a;
    return { x: i + s3 * Math.cos(e2), y: i - s3 * Math.sin(e2) };
  }, u = e.length, d = s2.findIndex((e2) => !e2), f2 = [], p = null, m = 0;
  for (let n2 = 0; n2 < u; n2++) {
    let i2 = (d + n2) % u, a2 = (i2 + 1) % u;
    if (!s2[i2] && s2[a2]) {
      let t2 = c(e[a2], e[i2]);
      m = Math.atan2(t2.y, t2.x), p = [o(t2)];
    }
    if (s2[i2] && (p ??= [], p.push(o(Ud(e[i2], r)))), s2[i2] && !s2[a2] && p != null) {
      let n3 = c(e[i2], e[a2]);
      p.push(o(n3));
      let r2 = Math.atan2(n3.y, n3.x), s3 = m - r2;
      for (; s3 <= -Math.PI; ) s3 += 2 * Math.PI;
      for (; s3 > Math.PI; ) s3 -= 2 * Math.PI;
      let u2 = r2 + s3 / 2;
      if (t({ x: Math.cos(u2), y: Math.sin(u2), z: 0 })) {
        let e2 = Math.max(2, Math.ceil(Math.abs(s3) / id));
        for (let t2 = 1; t2 < e2; t2++) p.push(l(r2 + s3 * t2 / e2));
      }
      p.length > 2 && f2.push(p), p = null;
    }
  }
  return f2.length === 0 ? null : f2.reduce((e2, t2) => qd(t2) > qd(e2) ? t2 : e2);
}
function Kd(e, t, n) {
  return { x: e.x + (t.x - e.x) * n, y: e.y + (t.y - e.y) * n, z: e.z + (t.z - e.z) * n };
}
function qd(e) {
  return Math.abs(e.reduce((t, n, r) => {
    let i = e[(r + 1) % e.length];
    return t + n.x * i.y - i.x * n.y;
  }, 0));
}
function Jd(e, t, n, r) {
  if (e.length === 0) return [];
  let i = [];
  for (let e2 = 0; e2 < q; e2++) {
    let a2 = 2 * Math.PI * e2 / q, o2 = Math.max(0.05, t[e2] - Qu) * r;
    i.push({ x: n + o2 * Math.cos(a2), y: n - o2 * Math.sin(a2) });
  }
  let a = Yd(i), [o, s2] = a, c = (s2.x - o.x) * (n - o.y) - (s2.y - o.y) * (n - o.x) > 0 ? 1 : -1, l = [];
  for (let t2 of e) {
    if (t2.every((e3) => Qd(a, e3))) {
      l.push(t2);
      continue;
    }
    let e2 = t2;
    for (let t3 = 0; t3 < a.length && e2.length > 2; t3++) {
      let n2 = a[t3], r2 = a[(t3 + 1) % a.length];
      e2 = Xd(e2, (e3) => c * ((r2.x - n2.x) * (e3.y - n2.y) - (r2.y - n2.y) * (e3.x - n2.x)));
    }
    (e2.length > 2 ? Math.abs(Zd(e2)) : 0) > ad * r * r && l.push(e2);
  }
  return l;
}
function Yd(e) {
  let t = e.slice().sort((e2, t2) => e2.x - t2.x || e2.y - t2.y), n = (e2, t2, n2) => (t2.x - e2.x) * (n2.y - e2.y) - (t2.y - e2.y) * (n2.x - e2.x), r = [];
  for (let e2 of t) {
    for (; r.length >= 2 && n(r[r.length - 2], r[r.length - 1], e2) <= 0; ) r.pop();
    r.push(e2);
  }
  let i = [];
  for (let e2 = t.length - 1; e2 >= 0; e2--) {
    let r2 = t[e2];
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], r2) <= 0; ) i.pop();
    i.push(r2);
  }
  return r.pop(), i.pop(), r.concat(i);
}
function Xd(e, t) {
  let n = [];
  for (let r = 0; r < e.length; r++) {
    let i = e[r], a = e[(r + 1) % e.length], o = t(i), s2 = t(a);
    if (o >= 0 && n.push(i), o >= 0 != s2 >= 0) {
      let e2 = o / (o - s2);
      n.push({ x: i.x + e2 * (a.x - i.x), y: i.y + e2 * (a.y - i.y) });
    }
  }
  return n;
}
function Zd(e) {
  let t = 0;
  for (let n = 0, r = e.length - 1; n < e.length; r = n++) t += (e[r].x + e[n].x) * (e[r].y - e[n].y);
  return t / 2;
}
function Qd(e, t) {
  let n = false;
  for (let r = 0, i = e.length - 1; r < e.length; i = r++) {
    let a = e[r], o = e[i];
    a.y > t.y != o.y > t.y && t.x < a.x + (t.y - a.y) * (o.x - a.x) / (o.y - a.y) && (n = !n);
  }
  return n;
}
function $d(e) {
  return e.flatMap((e2) => [e2.x, e2.y]);
}
function ef() {
  if (Sd != null) return Sd;
  let e = Td(0, 1, 0), t = 0.6799999999999999, n = (e2) => Wu * e2 ** 2.2, r = [], i = 0, a = e - ld;
  for (let e2 = 0; e2 <= J; e2++) {
    let o2 = e2 / J;
    if (r.push({ x: i, y: a, angle: n(o2) }), e2 === J) break;
    for (let e3 = 0; e3 < sd; e3++) {
      let r2 = n(o2 + (e3 + 0.5) / sd / J);
      i += Math.sin(r2) * (t / J / sd), a += Math.cos(r2) * (t / J / sd);
    }
  }
  let o = e;
  for (let e2 = 1; e2 <= fd; e2++) {
    let t2 = e2 / fd * md;
    for (let e3 = 0; e3 < pd; e3++) {
      let n2 = e3 * Math.PI / 16, r2 = Td(Math.sin(t2) * Math.cos(n2), Math.cos(t2), Math.sin(t2) * Math.sin(n2)) * Math.cos(t2);
      r2 > o && (o = r2);
    }
  }
  let s2 = [];
  for (let e2 = 0; e2 <= J; e2++) {
    let t2 = e2 / J, { x: n2, y: i2, angle: a2 } = r[e2], c2 = i2 - (o + 0.01), l2 = Math.max(0, Math.min(1, 1 - c2 / dd)), u2 = cd + 0.05500000000000001 * (1 - t2) * (1 - t2) + ud * l2 * l2, d2 = Math.cos(a2), f3 = -Math.sin(a2);
    for (let e3 = 0; e3 < od; e3++) {
      let t3 = 2 * Math.PI * e3 / od;
      s2.push({ x: n2 + u2 * Math.cos(t3) * d2, y: i2 + u2 * Math.cos(t3) * f3, z: u2 * Math.sin(t3) });
    }
  }
  let c = s2.length;
  s2.push({ x: r[J].x, y: r[J].y, z: 0 });
  let l = new Int32Array(27840), u = 0, d = (e2, t2, n2, r2) => {
    l.set([e2, t2, n2, r2], u), u += 4;
  };
  for (let e2 = 0; e2 < J; e2++) for (let t2 = 0; t2 < od; t2++) {
    let n2 = (t2 + 1) % od, r2 = e2 * od, i2 = (e2 + 1) * od;
    d(r2 + t2, r2 + n2, i2 + n2, 1), d(r2 + t2, i2 + n2, i2 + t2, 1);
  }
  let f2 = 3456;
  for (let e2 = 0; e2 < od; e2++) d(c, f2 + e2, f2 + (e2 + 1) % od, 2);
  return Sd = { vertices: s2, triangles: l }, Sd;
}
function tf(e, t, n) {
  let { vertices: r, triangles: i } = ef(), a = n / 2, o = Nd(n), s2 = r.map(e), c = s2.map((e2) => ({ x: a + o * e2.x, y: a - o * e2.y })), l = n, u = n, d = 0, f2 = 0;
  for (let e2 = 0; e2 < i.length; e2 += 4) for (let t2 = 0; t2 < 3; t2++) {
    let n2 = c[i[e2 + t2]];
    l = Math.min(l, n2.x - 1), u = Math.min(u, n2.y - 1), d = Math.max(d, n2.x + 1), f2 = Math.max(f2, n2.y + 1);
  }
  l = Math.max(0, Math.floor(l)), u = Math.max(0, Math.floor(u)), d = Math.min(n, Math.ceil(d)), f2 = Math.min(n, Math.ceil(f2));
  let p = Math.max(1, d - l), m = Math.max(1, f2 - u);
  if (p < 2 || m < 2) return null;
  let h = new Uint8Array(p * m), g = new Float32Array(p * m).fill(-1e9), _ = nf(t);
  for (let e2 = 0; e2 < i.length; e2 += 4) {
    let t2 = s2[i[e2]], n2 = s2[i[e2 + 1]], r2 = s2[i[e2 + 2]], a2 = c[i[e2]], o2 = c[i[e2 + 1]], m2 = c[i[e2 + 2]], v = (o2.y - m2.y) * (a2.x - m2.x) + (m2.x - o2.x) * (a2.y - m2.y);
    if (Math.abs(v) < 1e-8) continue;
    let y = Math.max(u, Math.floor(Math.min(a2.y, o2.y, m2.y))), b = Math.min(f2 - 1, Math.ceil(Math.max(a2.y, o2.y, m2.y))), x = a2, S = o2, C = m2;
    x.y > S.y && ([x, S] = [S, x]), S.y > C.y && ([S, C] = [C, S]), x.y > S.y && ([x, S] = [S, x]);
    let w = (e3, t3, n3) => t3.y - e3.y < 1e-9 ? t3.x : e3.x + (t3.x - e3.x) * (n3 - e3.y) / (t3.y - e3.y);
    for (let s3 = y; s3 <= b; s3++) {
      let c2 = s3 + 0.5, f3 = Math.max(x.y, Math.min(C.y, c2)), y2 = w(x, C, f3), b2 = f3 <= S.y ? w(x, S, f3) : w(S, C, f3), T = Math.max(l, Math.floor(Math.min(y2, b2)) - 1), E2 = Math.min(d - 1, Math.ceil(Math.max(y2, b2)) + 1);
      for (let d2 = T; d2 <= E2; d2++) {
        let f4 = d2 + 0.5, y3 = ((o2.y - m2.y) * (f4 - m2.x) + (m2.x - o2.x) * (c2 - m2.y)) / v, b3 = ((m2.y - a2.y) * (f4 - m2.x) + (a2.x - m2.x) * (c2 - m2.y)) / v, x2 = 1 - y3 - b3;
        if (y3 < 0 || b3 < 0 || x2 < 0) continue;
        let S2 = { x: y3 * t2.x + b3 * n2.x + x2 * r2.x, y: y3 * t2.y + b3 * n2.y + x2 * r2.y, z: y3 * t2.z + b3 * n2.z + x2 * r2.z }, C2 = (s3 - u) * p + (d2 - l);
        S2.z <= g[C2] || _(S2) || (g[C2] = S2.z, h[C2] = i[e2 + 3]);
      }
    }
  }
  return { left: l, top: u, width: p, height: m, paint: h };
}
function nf(e) {
  let { least: t, most: n } = Ed(), r = e(vd);
  return (i) => {
    if (i.x * i.x + i.y * i.y >= Hu * Hu) return false;
    let a = e({ x: i.x, y: i.y, z: 0 });
    for (let e2 = i.z + hd; e2 <= Hu; e2 += gd) {
      let o = Math.hypot(i.x, i.y, e2);
      if (o < t) return true;
      if (o > n) {
        if (e2 >= 0) return false;
        continue;
      }
      if (o <= Dd({ x: a.x + e2 * r.x, y: a.y + e2 * r.y, z: a.z + e2 * r.z })) return true;
    }
    return false;
  };
}
var rf = /* @__PURE__ */ new Set([`path`, `use`, `rect`, `stop`, `circle`]);
var af = /[&<>"]/g;
var of = { "&": `&amp;`, "<": `&lt;`, ">": `&gt;`, '"': `&quot;` };
function Y(e, t, n = []) {
  return { tag: e, attrs: t, children: n };
}
function sf(e, t, n, r) {
  return Y(`svg`, { xmlns: `http://www.w3.org/2000/svg`, id: t, width: n, height: n, viewBox: `0 0 ${e} ${e}` }, r);
}
function cf(e) {
  let t = ``;
  for (let [n, r] of Object.entries(e.attrs)) t += ` ${n}="${String(r).replace(af, (e2) => of[e2])}"`;
  return rf.has(e.tag) ? `<${e.tag}${t}/>` : `<${e.tag}${t}>${e.children.map(cf).join(``)}</${e.tag}>`;
}
var lf = 144;
var uf = 184 / 256;
var df = 180 / Math.PI;
var ff = 16e6;
var pf = 0.6;
var mf = 256;
var hf = /* @__PURE__ */ new Set([`pumpkin`]);
var gf = /* @__PURE__ */ new Map();
var _f = 0;
var vf = /* @__PURE__ */ new Map();
function yf(e, t, n, r = {}) {
  let i = Math.max(8, Math.round(n * e.zoom / uf)), a = Math.max(i, lf), o = Cf(e, n), { body: s2, eyes: c, stem: l } = Df(e.body, o, a, e.eyes), [u, d, f2, p] = Mf(e, n, i, a), m = `matrix(${If(u)} 0 0 ${If(d)} ${If(f2)} ${If(p)})`, h = r.isProof === true && e.body !== `pumpkin` ? cu(e.body, o, a, t.ink) : null;
  if (e.glow != null) {
    let t2 = Pf(e.glow, a);
    return { size: n, sprite: a, transform: m, body: [...s2, ...l.map((e2) => e2.d)], bodyFill: t2, eyes: [], eyeFill: null, proof: h, stem: [] };
  }
  let g = t.cutout ? null : ka(t), _ = e.eyes == null ? [] : c;
  return { size: n, sprite: a, transform: m, body: s2, bodyFill: Oa(t), eyes: _, eyeFill: g, proof: h, stem: l };
}
function bf(e, t) {
  let n = Math.max(8, Math.round(t * e.zoom / uf)), r = Math.max(n, lf), i = Cf(e, t), { body: a, eyes: o, stem: s2 } = Df(e.body, i, r, e.eyes), [c, l, u, d] = Mf(e, t, n, r), f2 = ([e2, t2]) => [c * e2 + u, l * t2 + d], p = (e2) => Nf(e2).map((e3) => e3.map(f2)), m = s2.map((e2) => ({ fill: e2.fill, loops: p(e2.d) }));
  return { center: [c * r / 2 + u, l * r / 2 + d], radius: e.zoom * t / 2, body: [...a.flatMap(p), ...m.flatMap(({ loops: e2 }) => e2)], eyes: e.eyes == null ? [] : o.flatMap(p), ...m.length === 0 ? {} : { painted: m } };
}
function xf(e, t, n = e.size) {
  let r = e.sprite, i = `${t}-body`, a = { maskUnits: `userSpaceOnUse`, x: 0, y: 0, width: r, height: r }, o = (t2) => e.eyes.map((e2) => Y(`path`, { d: e2, fill: t2 })), s2 = e.body.map((e2) => Y(`path`, { d: e2 })), c = [Y(`g`, { id: i }, s2)], l = {}, u = [];
  e.eyes.length > 0 && e.eyeFill == null ? (c.push(Y(`mask`, { id: `${t}-holes`, ...a }, [Y(`rect`, { width: r, height: r, fill: `#fff` }), ...o(`#000`)])), l = { mask: `url(#${t}-holes)` }) : e.eyes.length > 0 && e.eyeFill != null && (c.push(Y(`mask`, { id: `${t}-inside`, ...a }, [Y(`use`, { href: `#${i}`, fill: `#fff` })])), u.push(Y(`g`, { mask: `url(#${t}-inside)` }, o(e.eyeFill))));
  let d;
  if (e.proof != null) c.push(Y(`clipPath`, { id: `${t}-solid` }, s2)), d = Y(`g`, { "clip-path": `url(#${t}-solid)`, ...l }, [Y(`use`, { href: `#${i}`, fill: e.proof.baseFill }), ...e.proof.faces.map((e2) => Y(`path`, { d: e2.d, fill: e2.fill }))]);
  else if (typeof e.bodyFill == `string`) d = Y(`use`, { href: `#${i}`, fill: e.bodyFill, ...l });
  else {
    let { cx: n2, cy: r2, r: a2, stops: o2 } = e.bodyFill;
    c.push(Y(`radialGradient`, { id: `${t}-glow`, gradientUnits: `userSpaceOnUse`, cx: n2, cy: r2, r: a2 }, o2.map((e2) => Y(`stop`, { offset: e2.offset, "stop-color": e2.color })))), d = Y(`use`, { href: `#${i}`, fill: `url(#${t}-glow)`, ...l });
  }
  let f2 = e.stem.map(({ d: e2, fill: t2 }) => Y(`path`, { d: e2, fill: t2 }));
  return sf(e.size, t, n, [Y(`defs`, {}, c), Y(`g`, { transform: e.transform }, [d, ...u, ...f2])]);
}
function Sf(e, t = 0) {
  let n = fr(e);
  return wf(n[8] >= 0 ? n : [-n[0], n[1], -n[2], -n[3], n[4], -n[5], -n[6], n[7], -n[8]], t);
}
function Cf(e, t) {
  let n = Tf(t, e.zoom);
  return hf.has(e.body) ? wf(fr(e.quat), n) : Sf(e.quat, n);
}
function wf(e, t) {
  let [n, r, i] = mr(e), a = (e2) => t > 0 ? Math.round(e2 / t) * t : e2;
  return { yaw: Ef(a(r * df)), pitch: Ef(a(n * df)), roll: a(i * df) };
}
function Tf(e, t) {
  let n = pf / Math.max(e * t / 2, 1) * df;
  return 2 ** Math.floor(Math.log2(n));
}
function Ef(e) {
  let t = (e % 180 + 180) % 180;
  return Math.abs(t - 90) >= 0.5 ? e : e + (t <= 90 ? 89.5 - t : 90.5 - t);
}
function Df(e, t, n, r) {
  if (e === `pumpkin`) {
    let e2 = Pd(t, n), i = r == null ? [] : Fd(e2, t, n, $a(r));
    return { body: [Tl([e2.body])], eyes: i.map((e3) => Tl([e3])), stem: Id(e2.stem).map(({ fill: e3, polygons: t2 }) => ({ d: Tl(t2), fill: e3 })) };
  }
  return { body: kf(e, t, n), eyes: r == null ? [] : Of(e, t, n, r), stem: [] };
}
function Of(e, t, n, r) {
  let i = `${e} ${n} ${t.yaw} ${t.pitch} ${t.roll} ${JSON.stringify(r)}`, a = vf.get(i);
  if (a != null) return vf.delete(i), vf.set(i, a), a;
  let o = wc(Ps(e), t, n, Qa(e, r)).map((e2) => Tl([e2]));
  if (vf.set(i, o), vf.size > mf) for (let e2 of vf.keys()) {
    vf.delete(e2);
    break;
  }
  return o;
}
function kf(e, t, n) {
  let r = Ps(e), i = r.silhouette.kind === `solid` ? r.silhouette.yawPeriod : null, { pitch: a, roll: o } = t, s2 = i == null ? t.yaw : t.yaw - i * Math.floor(t.yaw / i), c = `${e} ${n} ${s2} ${a} ${o}`, l = gf.get(c);
  if (l != null) return gf.delete(c), gf.set(c, l), l;
  let u = jf(Cc(r, { yaw: s2, pitch: a, roll: o }, n));
  gf.set(c, u), _f += Af(u);
  for (let [e2, t2] of gf) {
    if (_f <= ff) break;
    gf.delete(e2), _f -= Af(t2);
  }
  return u;
}
function Af(e) {
  return e.reduce((e2, t) => e2 + t.length, 0);
}
function jf(e) {
  if (e.length === 1) return [Tl(e)];
  let t = El(e);
  return t === `` ? [] : [t];
}
function Mf(e, t, n, r) {
  let i = t / 2, a = i + e.offset[0] * e.zoom * i, o = i - e.offset[1] * e.zoom * i, s2 = o - e.squashAnchor * e.zoom * i, [c, l] = e.squash, u = n / r;
  return [c * u, l * u, a - c * n / 2, s2 + l * (o - n / 2 - s2)];
}
function Nf(e) {
  let t = [];
  for (let n of e.split(`Z`)) {
    let e2 = n.replace(`M`, ` `).trim().split(/\s+/).filter((e3) => e3 !== ``).map(Number);
    if (e2.length < 6) continue;
    let r = [];
    for (let t2 = 0; t2 + 1 < e2.length; t2 += 2) r.push([e2[t2], e2[t2 + 1]]);
    t.push(r);
  }
  return t;
}
function Pf(e, t) {
  let n = t / 2;
  return { cx: n, cy: n, r: n, stops: [{ offset: 0, color: Ff(e.inner) }, { offset: 0.42 + e.midT * 0.16, color: Ff(e.mid) }, { offset: 0.93, color: Ff(e.rim) }, { offset: 1, color: Ff(e.rim) }] };
}
function Ff(e) {
  return `rgb(${Math.round(e[0] * 255)}, ${Math.round(e[1] * 255)}, ${Math.round(e[2] * 255)})`;
}
function If(e) {
  return Math.round(e * 1e6) / 1e6;
}
var X = Math.PI * 2;
var Lf = 1e-7;
var Rf = 1e-7;
var zf = 720;
function Bf({ body: e, painted: t }) {
  if (t == null) return e;
  let n = new Set(t.flatMap(({ loops: e2 }) => e2));
  return e.filter((e2) => !n.has(e2));
}
function Vf(e) {
  return Array.from({ length: e }, (t, n) => n / e * X);
}
function Hf(e, t) {
  return e.flatMap((e2) => e2.map(([e3, n]) => ap(t, e3, n)));
}
function Uf(e) {
  let t = e.flat().sort((e2, t2) => e2 - t2);
  return t.filter((e2, n) => n === 0 || e2 - t[n - 1] > Lf);
}
function Wf(e, t, n) {
  let r = rp(e, t), i = op(n.map((e2) => ip(r, t, e2)));
  return n.map((e2, n2) => [t[0] + Math.cos(e2) * i[n2], t[1] + Math.sin(e2) * i[n2]]);
}
function Gf(e, t, n) {
  let [r, i] = t;
  return Array.from({ length: n }, (t2, a) => {
    let o = a / n * X, s2 = Math.cos(o), c = Math.sin(o), l = r === 0 || i === 0 ? 0 : 1 / Math.hypot(s2 / r, c / i);
    return [e[0] + s2 * l, e[1] + c * l];
  });
}
function Kf(e, t, n) {
  let r = e.map(([e2, n2]) => ({ angle: ap(t, e2, n2), reach: Math.hypot(e2 - t[0], n2 - t[1]) })).sort((e2, t2) => e2.angle - t2.angle);
  return n.map((e2) => {
    let n2 = sp(r, e2);
    return [t[0] + Math.cos(e2) * n2, t[1] + Math.sin(e2) * n2];
  });
}
function qf(e) {
  let t = np(e) < 0 ? [...e].reverse() : e, n = cp(t, ep(t)), r = n == null ? t : [n.point, ...t.slice(n.edge + 1), ...t.slice(0, n.edge + 1)], i = [0];
  for (let e2 = 0; e2 < r.length; e2++) {
    let [t2, n2] = r[e2], [a2, o] = r[(e2 + 1) % r.length];
    i.push(i[e2] + Math.hypot(a2 - t2, o - n2));
  }
  let a = i[r.length] ?? 0;
  return { points: r, stations: i.map((e2) => a === 0 ? 0 : e2 / a) };
}
function Jf({ points: e, stations: t }, n) {
  if (e.length === 0) return [];
  let r = 0;
  return n.map((n2) => {
    for (; r < e.length - 1 && t[r + 1] < n2; ) r++;
    let [i, a] = e[r], [o, s2] = e[(r + 1) % e.length], c = t[r + 1] - t[r], l = c === 0 ? 0 : (n2 - t[r]) / c;
    return [i + (o - i) * l, a + (s2 - a) * l];
  });
}
function Yf(e) {
  return Array.from({ length: e }, (t, n) => n / e);
}
function Xf(e) {
  let t = e.flat().filter((e2) => e2 < 1).sort((e2, t2) => e2 - t2);
  return t.filter((e2, n) => n === 0 || e2 - t[n - 1] > Rf);
}
function Zf(e) {
  let t = e.reduce((e2, t2) => e2 + t2.weight, 0), [n] = e;
  return n == null || t === 0 ? [] : n.outline.map((n2, r) => {
    let i = 0, a = 0;
    for (let { outline: t2, weight: n3 } of e) i += t2[r][0] * n3, a += t2[r][1] * n3;
    return [i / t, a / t];
  });
}
function Qf(e, t, n) {
  return e.map(([e2, r], i) => [e2 + (t[i][0] - e2) * n, r + (t[i][1] - r) * n]);
}
function $f(e, t) {
  return Array.from({ length: t }, () => [e[0], e[1]]);
}
function ep(e) {
  if (e.length === 0) return [0, 0];
  let t = 0, n = 0;
  for (let [r, i] of e) t += r, n += i;
  return [t / e.length, n / e.length];
}
function tp(e) {
  return e.length === 0 ? `` : `M${e.map(([e2, t]) => `${lp(e2)} ${lp(t)}`).join(`L`)}Z`;
}
function np(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    let [r, i] = e[n], [a, o] = e[(n + 1) % e.length];
    t += r * o - a * i;
  }
  return t / 2;
}
function rp(e, t) {
  let n = Array.from({ length: zf }, () => []);
  for (let r of e) for (let e2 = 0; e2 < r.length; e2++) {
    let i = r[e2], a = r[(e2 + 1) % r.length], o = ap(t, i[0], i[1]), s2 = ap(t, a[0], a[1]) - o;
    s2 > Math.PI && (s2 -= X), s2 < -Math.PI && (s2 += X);
    let c = Math.floor((s2 < 0 ? o + s2 : o) / X * zf) - 1, l = Math.floor((s2 < 0 ? o : o + s2) / X * zf) + 1;
    for (let e3 = c; e3 <= l; e3++) n[(e3 % zf + zf) % zf].push([i, a]);
  }
  return n;
}
function ip(e, [t, n], r) {
  let i = Math.cos(r), a = Math.sin(r), o = NaN;
  for (let [[s2, c], [l, u]] of e[Math.floor(r / X * zf) % zf]) {
    let e2 = l - s2, r2 = u - c, d = i * r2 - a * e2;
    if (Math.abs(d) < 1e-12) continue;
    let f2 = s2 - t, p = c - n, m = (f2 * r2 - p * e2) / d, h = (f2 * a - p * i) / d;
    m >= 0 && h >= -1e-9 && h <= 1.000000001 && !(m <= o) && (o = m);
  }
  return o;
}
function ap(e, t, n) {
  let r = Math.atan2(n - e[1], t - e[0]);
  return r < 0 ? r + X : r;
}
function op(e) {
  let t = e.length, n = e.flatMap((e2, t2) => Number.isNaN(e2) ? [] : [t2]);
  return n.length === 0 ? e.map(() => 0) : e.map((r, i) => {
    if (!Number.isNaN(r)) return r;
    let a = n.find((e2) => e2 > i) ?? n[0] + t, o = [...n].reverse().find((e2) => e2 < i) ?? (n.at(-1) ?? 0) - t, s2 = (i - o) / (a - o);
    return e[(o + t) % t] * (1 - s2) + e[a % t] * s2;
  });
}
function sp(e, t) {
  let n = e.length;
  if (n === 0) return 0;
  let r = e.findIndex((e2) => e2.angle >= t);
  r < 0 && (r = 0);
  let i = e[r], a = e[(r - 1 + n) % n], o = (i.angle - a.angle + X) % X;
  if (o === 0) return i.reach;
  let s2 = (t - a.angle + X) % X / o;
  return a.reach + (i.reach - a.reach) * s2;
}
function cp(e, [t, n]) {
  let r = null;
  for (let i = 0; i < e.length; i++) {
    let [a, o] = e[i], [s2, c] = e[(i + 1) % e.length];
    if (o === c || (o - n) * (c - n) > 0) continue;
    let l = a + (n - o) / (c - o) * (s2 - a);
    l >= t && (r == null || l > r.point[0]) && (r = { edge: i, point: [l, n] });
  }
  return r;
}
function lp(e) {
  return String(Math.round(e * 100) / 100);
}
var up = [1, 1];
function dp(e, t) {
  let n = e.length, r = -1;
  for (let t2 = 0; t2 < n && r < 0; t2++) e[t2][2] <= 0 && e[(t2 + 1) % n][2] > 0 && (r = t2);
  if (r < 0) return n === 0 || e[0][2] <= 0 ? null : e.map(([e2, t2]) => ({ kind: `line`, to: [e2, t2] }));
  let i = [], a = [1, 0], o = null;
  for (let s2 = 0; s2 < n; s2++) {
    let c = e[(r + s2) % n], l = e[(r + s2 + 1) % n], u = c[2] > 0, d = l[2] > 0;
    if (u && d) i.push({ kind: `line`, to: [l[0], l[1]] });
    else if (u) o = gp(c, l), i.push({ kind: `line`, to: o });
    else if (d) {
      let e2 = gp(c, l);
      o === null ? a = e2 : i.push(_p(o, e2, t)), i.push({ kind: `line`, to: [l[0], l[1]] });
    }
  }
  return o !== null && i.push(_p(o, a, t)), i;
}
function fp(e, t) {
  let n = vp(e, t), r = n.length;
  if (n.every((e2) => e2.isInside)) return e;
  let i = -1;
  for (let e2 = 0; e2 < r && i < 0; e2++) n[e2].isInside && !n[(e2 + r - 1) % r].isInside && (i = e2);
  if (i < 0) {
    let e2 = n.reduce((e3, t2) => e3 + t2.sweep, 0);
    return Math.abs(e2) > Math.PI ? mp(t, Math.sign(e2)) : null;
  }
  let a = [], o = null, s2 = 0;
  for (let e2 = 0; e2 < r; e2++) {
    let c = n[(i + e2) % r];
    c.isInside ? (o !== null && a.push({ kind: `arc`, to: c.from, radii: t, sweep: s2 }), o = null, a.push(c.segment)) : (o === null && (o = c.from, s2 = 0), s2 += c.sweep);
  }
  return o !== null && a.push({ kind: `arc`, to: n[i].from, radii: t, sweep: s2 }), a;
}
function pp(e, t) {
  let n = (t2) => t2.kind === `arc` && t2.radii[0] === e[0] && t2.radii[1] === e[1], r = [], i = [], a = [], o = [];
  for (let e2 of t) {
    let t2 = e2.findIndex(n);
    if (t2 < 0) {
      r.push(e2);
      continue;
    }
    let s2 = e2[t2].to, c = [], l = s2;
    for (let r2 = 1; r2 <= e2.length; r2++) {
      let u = e2[(t2 + r2) % e2.length];
      n(u) ? (a.push({ from: l, sweep: u.sweep }), o.push(l, u.to), c.length > 0 && i.push(xp(s2, c)), c = [], s2 = u.to) : c.push(u), l = u.to;
    }
  }
  return a.length === 0 ? [mp(e, 1), ...r] : [...wp([...i, ...Sp(e, a, o)]), ...r];
}
function mp(e, t) {
  return [{ kind: `arc`, to: [-e[0], 0], radii: e, sweep: t * Math.PI }, { kind: `arc`, to: [e[0], 0], radii: e, sweep: t * Math.PI }];
}
function hp(e, t) {
  let n = Math.cos(t), r = Math.sin(t), i = 1 / Math.sqrt(n * n / (e[0] * e[0]) + r * r / (e[1] * e[1]));
  return [i * n, i * r];
}
function gp(e, t) {
  let n = e[2] / (e[2] - t[2]), r = e[0] + (t[0] - e[0]) * n, i = e[1] + (t[1] - e[1]) * n, a = Math.sqrt(r * r + i * i);
  return [r / a, i / a];
}
function _p(e, t, n) {
  return { kind: `arc`, to: t, radii: up, sweep: Ep(Math.atan2(t[1], t[0]) - n) - Ep(Math.atan2(e[1], e[0]) - n) };
}
function vp(e, t) {
  let n = 1 / (t[0] * t[0]), r = 1 / (t[1] * t[1]), i = (e2) => n * e2[0] * e2[0] + r * e2[1] * e2[1] - 1, a = [], o = e[e.length - 1].to;
  for (let t2 of e) {
    if (t2.kind === `line`) {
      let e2 = yp(o, t2.to, n, r), s2 = o;
      for (let n2 = 0; n2 <= e2.length; n2++) {
        let r2 = n2 === 0 ? 0 : e2[n2 - 1], c = n2 === e2.length ? 1 : e2[n2], l = n2 === e2.length ? t2.to : Tp(o, t2.to, c);
        a.push({ from: s2, segment: { kind: `line`, to: l }, sweep: Math.atan2(s2[0] * l[1] - s2[1] * l[0], s2[0] * l[0] + s2[1] * l[1]), isInside: i(Tp(o, t2.to, (r2 + c) / 2)) < 0 }), s2 = l;
      }
    } else {
      let e2 = t2.radii[0], s2 = Math.atan2(o[1], o[0]), c = bp(e2, s2, t2.sweep, n, r), l = o;
      for (let n2 = 0; n2 <= c.length; n2++) {
        let r2 = n2 === 0 ? 0 : c[n2 - 1], o2 = n2 === c.length ? 1 : c[n2], u = s2 + t2.sweep * o2, d = n2 === c.length ? t2.to : [e2 * Math.cos(u), e2 * Math.sin(u)], f2 = s2 + t2.sweep * (r2 + o2) / 2, p = t2.sweep * (o2 - r2);
        a.push({ from: l, segment: { kind: `arc`, to: d, radii: t2.radii, sweep: p }, sweep: p, isInside: i([e2 * Math.cos(f2), e2 * Math.sin(f2)]) < 0 }), l = d;
      }
    }
    o = t2.to;
  }
  return a;
}
function yp(e, t, n, r) {
  let i = t[0] - e[0], a = t[1] - e[1], o = n * i * i + r * a * a, s2 = n * e[0] * i + r * e[1] * a, c = n * e[0] * e[0] + r * e[1] * e[1] - 1, l = s2 * s2 - o * c;
  if (o === 0 || l <= 0) return [];
  let u = Math.sqrt(l), d = -(s2 + (s2 < 0 ? -u : u));
  return [d / o, c / d].filter((e2) => e2 > 0 && e2 < 1).sort((e2, t2) => e2 - t2);
}
function bp(e, t, n, r, i) {
  if (r === i || n === 0) return [];
  let a = (1 / (e * e) - i) / (r - i);
  if (!(a > 0 && a < 1)) return [];
  let o = Math.acos(Math.sqrt(a)), s2 = [];
  for (let e2 of [o, -o, Math.PI - o, Math.PI + o]) {
    let r2 = Dp(n > 0 ? e2 - t : t - e2) / Math.abs(n);
    r2 > 0 && r2 < 1 && s2.push(r2);
  }
  return s2.sort((e2, t2) => e2 - t2);
}
function xp(e, t) {
  let n = [e, ...t.map((e2) => e2.to)], r = t.map((e2, t2) => e2.kind === `line` ? { kind: `line`, to: n[t2] } : { ...e2, to: n[t2], sweep: -e2.sweep }).reverse();
  return { from: n[n.length - 1], to: e, segments: r };
}
function Sp(e, t, n) {
  let r = n.map((e2) => ({ point: e2, angle: Dp(Math.atan2(e2[1], e2[0])) })).sort((e2, t2) => e2.angle - t2.angle), i = [];
  for (let n2 = 0; n2 < r.length; n2++) {
    let a = r[n2], o = r[(n2 + 1) % r.length], s2 = n2 + 1 < r.length ? o.angle - a.angle : o.angle + 2 * Math.PI - a.angle;
    if (s2 <= 0) continue;
    let c = a.angle + s2 / 2;
    t.reduce((e2, t2) => e2 + Cp(t2, c), 0) === 0 && i.push({ from: a.point, to: o.point, segments: [{ kind: `arc`, to: o.point, radii: e, sweep: s2 }] });
  }
  return i;
}
function Cp(e, t) {
  let n = Math.atan2(e.from[1], e.from[0]);
  return (e.sweep > 0 ? Dp(t - n) : Dp(n - t)) < Math.abs(e.sweep) ? Math.sign(e.sweep) : 0;
}
function wp(e) {
  let t = (e2) => `${e2[0]} ${e2[1]}`, n = /* @__PURE__ */ new Map();
  for (let r2 of e) {
    let e2 = n.get(t(r2.from));
    e2 === void 0 ? n.set(t(r2.from), [r2]) : e2.push(r2);
  }
  let r = /* @__PURE__ */ new Set(), i = [];
  for (let a of e) {
    let e2 = [], o = a;
    for (; o !== void 0 && !r.has(o); ) r.add(o), e2.push(...o.segments), o = n.get(t(o.to))?.find((e3) => !r.has(e3));
    e2.length > 0 && i.push(e2);
  }
  return i;
}
function Tp(e, t, n) {
  return [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n];
}
function Ep(e) {
  return e - 2 * Math.PI * Math.round(e / (2 * Math.PI));
}
function Dp(e) {
  let t = e % (2 * Math.PI);
  return t < 0 ? t + 2 * Math.PI : t;
}
var Op = 0.02;
var kp = 16;
var Ap = 0.015;
var jp = 400;
var Mp = 512;
var Np = 5;
var Pp = /* @__PURE__ */ new Map();
function Fp(e, t) {
  let n = Math.min(kp, Math.max(0, Math.ceil(Math.log2(Math.max(t, 1))))), r = `${n}|${e.wid}|${e.oval.join()}|${e.ovalMix}|${e.pts.join()}`, i = Pp.get(r);
  if (i !== void 0) return Pp.delete(r), Pp.set(r, i), i;
  let a = zp(Ip(e), Op / 2 ** n);
  if (Pp.set(r, a), Pp.size > Mp) {
    let e2 = Pp.keys().next();
    e2.done !== true && Pp.delete(e2.value);
  }
  return a;
}
function Ip(e) {
  let [t, n] = e.oval, r = t > 1e-5 && n > 1e-5 ? e.ovalMix > 1e-4 ? Math.min(1, e.ovalMix) : Bp(0, 0.08, Math.min(t, n)) : 0, i = Math.max(0, e.pts.length - 1), a = new Float64Array(i * Np);
  for (let t2 = 0; t2 < i; t2++) {
    let [n2, r2] = e.pts[t2], i2 = e.pts[t2 + 1][0] - n2, o = e.pts[t2 + 1][1] - r2, s2 = i2 * i2 + o * o;
    a.set([n2, r2, i2, o, s2 > 0 ? 1 / s2 : 0], t2 * Np);
  }
  return { segments: a, halfWidth: e.wid > 0 ? e.wid : -1, rx: t, ry: n, ellipseMix: r };
}
function Lp(e, t, n) {
  let r = Rp(e.segments, t, n) - e.halfWidth;
  if (e.ellipseMix === 0) return r;
  let i = t / e.rx, a = n / e.ry, o = (Math.sqrt(i * i + a * a) - 1) * Math.min(e.rx, e.ry);
  return r * (1 - e.ellipseMix) + o * e.ellipseMix;
}
function Rp(e, t, n) {
  let r = 1e6;
  for (let i = 0; i < e.length; i += Np) {
    let a = t - e[i], o = n - e[i + 1], s2 = e[i + 2], c = e[i + 3], l = (a * s2 + o * c) * e[i + 4], u = l < 0 ? 0 : l > 1 ? 1 : l, d = a - s2 * u, f2 = o - c * u, p = d * d + f2 * f2;
    p < r && (r = p);
  }
  return Math.sqrt(r);
}
function zp(e, t) {
  let n = 1 / 0, r = 1 / 0, i = -1 / 0, a = -1 / 0, o = 1 / 0, { segments: s2, halfWidth: c } = e;
  if (c > 0 && e.ellipseMix < 1 && s2.length > 0) {
    for (let e2 = 0; e2 < s2.length; e2 += Np) for (let [t2, o2] of [[s2[e2], s2[e2 + 1]], [s2[e2] + s2[e2 + 2], s2[e2 + 1] + s2[e2 + 3]]]) n = Math.min(n, t2 - c), r = Math.min(r, o2 - c), i = Math.max(i, t2 + c), a = Math.max(a, o2 + c);
    o = c;
  }
  if (e.ellipseMix > 0 && (n = Math.min(n, -e.rx), r = Math.min(r, -e.ry), i = Math.max(i, e.rx), a = Math.max(a, e.ry), o = Math.min(o, e.rx, e.ry)), !(i > n && a > r)) return [];
  let l = Math.max(Math.min(Ap, o / 3), Math.max(i - n, a - r) / jp);
  return Cu((t2, n2) => Lp(e, t2, n2), { x0: n - 2 * l, y0: r - 2 * l, step: l, nx: Math.ceil((i - n) / l) + 4, ny: Math.ceil((a - r) / l) + 4 }, { deviation: t, edge: Math.sqrt(4 * t) });
}
function Bp(e, t, n) {
  let r = Math.min(1, Math.max(0, (n - e) / (t - e)));
  return r * r * (3 - 2 * r);
}
var Vp = 48;
var Hp = 11;
var Up = 0.055;
var Wp = Math.PI * 0.999;
var Gp = 0.4;
var Kp = 35e-4;
var qp = 0.75;
var Jp = 0.45;
var Yp = 1.8;
var Xp = 0.8;
var Zp = Cr.map(om);
var Qp = 192;
var $p = Math.PI / 48;
function em(e, t, n, r = {}) {
  let i = e.zoom * n / 2, [a, o] = e.squash;
  if (i === 0 || a === 0 || o === 0) return { size: n, body: ``, eyes: ``, glow: null, proof: null };
  let s2 = [Math.abs(a), Math.abs(o)], c = n / 2 + i * e.offset[0], l = n / 2 - i * (e.squashAnchor * (1 - o) + e.offset[1]), u = (e2) => `${ym(c + e2[0] * i)} ${ym(l - e2[1] * i)}`, d = (e2) => e2.map((e3) => sm(e3, u, Math.abs(i))).join(``), f2 = tm(e, Math.abs(i));
  return { size: n, body: d(t.cutout ? pp(s2, f2) : [mp(s2, 1)]), eyes: t.cutout ? `` : d(f2), glow: e.glow === null ? null : lm(e.glow, s2, u, Math.abs(i)), proof: r.isProof === true ? um(e, t, s2, u, i, n) : null };
}
function tm(e, t) {
  if (e.eyes === null) return [];
  let n = fr(e.quat), r = [Math.abs(e.squash[0]), Math.abs(e.squash[1])], i = r[0] < 1 || r[1] < 1, a = [];
  return e.eyes.forEach((e2, o) => {
    for (let s2 of am(e2, Cr[o], Zp[o], n, t)) {
      let e3 = i ? fp(s2, r) : s2;
      e3 !== null && a.push(e3);
    }
  }), a;
}
function nm(e, t) {
  let n = e.zoom * t / 2, [r, i] = e.squash, a = [t / 2 + n * e.offset[0], t / 2 - n * (e.squashAnchor * (1 - i) + e.offset[1])], o = Math.abs(n), s2 = ([e2, t2]) => [a[0] + e2 * n, a[1] - t2 * n];
  return { center: a, radius: o, body: [Gf(a, [Math.abs(r) * o, Math.abs(i) * o], Qp)], eyes: tm(e, o).map((e2) => rm(e2).map(s2)) };
}
function rm(e) {
  let t = [], n = e[e.length - 1]?.to ?? [0, 0];
  for (let r of e) {
    if (r.kind === `arc`) {
      let e2 = Math.atan2(n[1], n[0]), i = Math.max(1, Math.ceil(Math.abs(r.sweep) / $p));
      for (let n2 = 1; n2 < i; n2++) t.push(hp(r.radii, e2 + r.sweep * n2 / i));
    }
    t.push(r.to), n = r.to;
  }
  return t;
}
function im(e, t, n = `gb-avatar-sphere`, r = e.size) {
  let i = [], a = [], o = Oa(t);
  if (e.glow?.halo != null && (i.push(_m(`${n}-halo`, e.glow.halo.gradient)), a.push(Y(`path`, { d: e.glow.halo.d, fill: `url(#${n}-halo)`, "fill-rule": `evenodd` }))), e.proof === null ? e.glow !== null && (o = `url(#${n}-body)`, i.push(_m(`${n}-body`, e.glow.body))) : (o = `url(#${n}-light)`, i.push(_m(`${n}-light`, e.proof.light), Y(`clipPath`, { id: `${n}-proof` }, [Y(`path`, { d: e.body, "clip-rule": `evenodd` })]))), a.push(Y(`path`, { d: e.body, fill: o, "fill-rule": `evenodd` })), e.eyes !== `` && a.push(Y(`path`, { d: e.eyes, fill: ka(t) })), e.proof !== null) {
    let t2 = e.proof.lines.filter((e2) => e2.d !== ``).map((e2) => Y(`path`, { d: e2.d, fill: `none`, stroke: e2.color, "stroke-width": ym(e2.width), "stroke-opacity": e2.opacity }));
    a.push(Y(`g`, { "clip-path": `url(#${n}-proof)` }, t2));
  }
  return sf(e.size, n, r, [...i.length > 0 ? [Y(`defs`, {}, i)] : [], ...a]);
}
function am(e, t, n, r, i) {
  let a = Fp(e, i * Math.max(1, e.lidY));
  if (a.length === 0) return [];
  let o = L(r, t.M), s2 = L(r, t.C), c = L(r, t.T), l = Math.atan2(o[1], o[0]), u = Math.cos(e.tilt), d = Math.sin(e.tilt), [f2, p] = e.off, m = ([t2, n2]) => {
    let r2 = n2 * e.lidY, i2 = f2 + u * t2 + d * r2, a2 = p - d * t2 + u * r2, l2 = Math.sqrt(i2 * i2 + a2 * a2), m2 = l2 > 1e-12 ? Math.sin(l2) / l2 : 1, h2 = Math.cos(l2);
    return [h2 * o[0] + m2 * (i2 * s2[0] + a2 * c[0]), h2 * o[1] + m2 * (i2 * s2[1] + a2 * c[1]), h2 * o[2] + m2 * (i2 * s2[2] + a2 * c[2])];
  }, h = [];
  for (let e2 of a) {
    let t2 = e2.map(m);
    n && t2.reverse();
    let r2 = dp(t2, l);
    r2 !== null && h.push(r2);
  }
  return h;
}
function om({ M: e, T: t, C: n }) {
  let r = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
  return r[0] * e[0] + r[1] * e[1] + r[2] * e[2] < 0;
}
function sm(e, t, n) {
  let r = e[e.length - 1].to, i = `M${t(r)}`;
  for (let a of e) i += a.kind === `line` ? `L${t(a.to)}` : cm(r, a, t, n), r = a.to;
  return `${i}Z`;
}
function cm(e, t, n, r) {
  if (t.sweep === 0) return ``;
  if (Math.abs(t.sweep) > Wp) {
    let i = t.sweep / 2, a = hp(t.radii, Math.atan2(e[1], e[0]) + i);
    return cm(e, { ...t, to: a, sweep: i }, n, r) + cm(a, { ...t, sweep: i }, n, r);
  }
  return `A${`${ym(t.radii[0] * r)} ${ym(t.radii[1] * r)}`} 0 0 ${t.sweep > 0 ? 0 : 1} ${n(t.to)}`;
}
function lm(e, t, n, r) {
  let i = 0.42 + 0.16 * e.midT, a = [];
  for (let t2 = 0; t2 <= Vp; t2++) {
    let n2 = 1 - (1 - t2 / Vp) ** 2;
    a.push({ offset: n2, color: Da(hm(e, i, n2)), opacity: 1 });
  }
  let o = { transform: gm(t, n, r), focus: 0, stops: a };
  if (!(e.halo > 0)) return { body: o, halo: null };
  let s2 = [];
  for (let t2 = 0; t2 <= Hp; t2++) {
    let n2 = Up * t2 / Hp, r2 = Math.min(1, e.halo * (1 - vm(0, Up, n2)));
    s2.push({ offset: (1 + n2) / 1.055, color: Da(e.rim), opacity: r2 });
  }
  let c = [t[0] * 1.055, t[1] * 1.055];
  return { body: o, halo: { d: sm(mp(c, 1), n, r) + sm(mp(t, 1), n, r), gradient: { transform: gm(c, n, r), focus: 0, stops: s2 } } };
}
function um(e, t, n, r, i, a) {
  let o = fr(e.quat), s2 = ``, c = ``;
  for (let e2 of ql) {
    let t2 = Yl(e2, o);
    t2 !== null && (e2.isEquator ? c += dm(t2, r, i) : s2 += dm(t2, r, i));
  }
  let l = pm(t.ink, [1, 1, 1], Gp), u = Zl(), d = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2] > 0.6 ? `#000000` : `#ffffff`, f2 = Math.max(qp, a * Kp);
  return { light: { transform: fm(u, n, r, i), focus: u.focus, stops: u.stops.map((e2) => ({ offset: e2.offset, color: Da(pm([0, 0, 0], l, e2.shade)), opacity: 1 })) }, lines: [{ d: s2, color: d, width: f2, opacity: Jp }, { d: c, color: d, width: f2 * Yp, opacity: Xp }] };
}
function dm(e, t, n) {
  let r = (t2) => [e.center[0] + e.a[0] * Math.cos(t2) + e.b[0] * Math.sin(t2), e.center[1] + e.a[1] * Math.cos(t2) + e.b[1] * Math.sin(t2)], i = 0.5 * Math.atan2(2 * mm(e.a, e.b), mm(e.a, e.a) - mm(e.b, e.b)), [a, o] = [Math.cos(i), Math.sin(i)], s2 = [e.a[0] * a + e.b[0] * o, e.a[1] * a + e.b[1] * o], c = [e.b[0] * a - e.a[0] * o, e.b[1] * a - e.a[1] * o], l = `${ym(Math.hypot(s2[0], s2[1]) * Math.abs(n))} ${ym(Math.hypot(c[0], c[1]) * Math.abs(n))}`, u = Math.round(Math.atan2(-s2[1] * n, s2[0] * n) * (180 / Math.PI) * 1e3) / 1e3, d = e.a[0] * e.b[1] - e.a[1] * e.b[0] > 0 ? 0 : 1, f2 = Math.ceil((e.to - e.from) / Wp), p = `M${t(r(e.from))}`;
  for (let n2 = 1; n2 <= f2; n2++) p += `A${l} ${u} 0 ${d} ${t(r(e.from + (e.to - e.from) * n2 / f2))}`;
  return p;
}
function fm(e, t, n, r) {
  let [i, a] = e.axisX, [o, s2] = e.axisY, c = [i * t[0] * r, -a * t[1] * r, o * t[0] * r, -s2 * t[1] * r], l = n([e.origin[0] * t[0], e.origin[1] * t[1]]);
  return `matrix(${c.map((e2) => Math.round(e2 * 1e4) / 1e4).join(` `)} ${l})`;
}
function pm(e, t, n) {
  return [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n, e[2] + (t[2] - e[2]) * n];
}
function mm(e, t) {
  return e[0] * t[0] + e[1] * t[1];
}
function hm(e, t, n) {
  let r = vm(0.12, t, n), i = vm(t, 0.93, n), a = 0.9 + 0.1 * Math.max(0, 1 - n * n) ** 0.225, o = (t2) => {
    let n2 = e.inner[t2] + (e.mid[t2] - e.inner[t2]) * r;
    return (n2 + (e.rim[t2] - n2) * i) * a;
  };
  return [o(0), o(1), o(2)];
}
function gm(e, t, n) {
  return `matrix(${ym(e[0] * n)} 0 0 ${ym(e[1] * n)} ${t([0, 0])})`;
}
function _m(e, t) {
  return Y(`radialGradient`, { id: e, gradientUnits: `userSpaceOnUse`, cx: 0, cy: 0, r: 1, fx: t.focus, fy: 0, gradientTransform: t.transform }, t.stops.map((e2) => Y(`stop`, { offset: e2.offset, "stop-color": e2.color, "stop-opacity": e2.opacity })));
}
function vm(e, t, n) {
  let r = Math.min(1, Math.max(0, (n - e) / (t - e)));
  return r * r * (3 - 2 * r);
}
function ym(e) {
  return String(Math.round(e * 100) / 100);
}
var bm = 114.5;
var xm = 0.62;
var Sm = 96;
var Cm = Math.PI * 2;
var wm = { dots: 22, orbit: 19, radar: 19, progress: 19, gather: 19, wave: 16, send: 20, receive: 20, dock: 20, ball: 18, pencil: 17, bang: 13, standby: 13 };
var Tm = { dots: 1.5, orbit: 1.14, radar: 1.14, progress: 1.32, gather: 1.15, wave: 1.42, send: 1.12, receive: 1.12, dock: 1.3, ball: 1.22, pencil: 1.18, bang: 1.28, standby: 1.75 };
var Em = 22;
var Dm = 62;
var Om = 0.84;
var km = 0.22;
var Am = 1.02;
var jm = 9;
var Mm = 1400;
var Nm = 1500;
var Pm = 1700;
var Fm = 2500;
var Im = 0.68;
var Lm = Fm * Im;
var Rm = 2.4;
var zm = 120;
var Bm = Gi(`progress`) * 1e3;
var Vm = Gi(`spawning`) * 1e3;
var Hm = [-2, -1, 1, 2];
var Um = (e) => (e % 1 + 1) % 1;
var Wm = (e, t) => {
  let n = e.length, r = t / n * Math.PI * 2, i = Math.cos(r), a = Math.sin(r);
  return Array.from({ length: n }, (r2, o) => {
    let [s2, c] = e[((o - t) % n + n) % n], l = s2 - B, u = c - B;
    return [B + l * i - u * a, B + l * a + u * i];
  });
};
var Gm = Array.from({ length: Sm }, (e, t) => {
  let n = t / Sm * Cm;
  return [B + Math.cos(n) * B, B + Math.sin(n) * B];
});
var Km = hs(88, 18).ring;
var qm = Wm(Km, Km.length / 2);
var Jm = (e) => e === `pencil` ? qm : Gm;
var Ym = (e, t) => {
  let n = e / 2, r = B - t / 2 + n, i = B + t / 2 - n;
  return `M${B - n} ${r}A${n} ${n} 0 0 1 ${B + n} ${r}L${B + n} ${i}A${n} ${n} 0 0 1 ${B - n} ${i}Z`;
};
var Xm = (e, t, n) => {
  let r = e / 2, i = t / 2, a = B - n / 2, o = B + n / 2;
  return `M${B - r} ${a + r}A${r} ${r} 0 0 1 ${B + r} ${a + r}L${B + i} ${o - i}A${i} ${i} 0 0 1 ${B - i} ${o - i}Z`;
};
var Zm = Ym(30, 88);
var Qm = Xm(30, 17, 96);
var $m = (e, t, n, r, i) => ({ type: `disc`, key: e, cx: t, cy: n, r, opacity: i });
var eh = (e, t, n, r) => ({ type: `ring`, key: e, cx: B, cy: B, r: t, width: n, opacity: r });
var th = (e, t, n, r) => ({ type: `shape`, key: e, d: t, transform: n, opacity: r });
var nh = (e, t, n, r) => ({ type: `stroke`, key: e, d: t, width: n, opacity: r });
var rh = { lift: 0, pop: 1, tone: 1 };
var ih = (e, t, n, r) => {
  let i = Um(e.stateTime * 1e3 / Mm + 0.119), a = Math.abs(i - t / 3), o = Math.min(a, 1 - a), s2 = r ? 1 : Math.exp(-(o * o) / 0.045), c = +!r;
  return { lift: s2 * jm * n * c, pop: 1 + c * (Om + km * s2 - 1), tone: 1 - c * 0.5 * (1 - s2) };
};
var ah = (e) => 0.42 + 0.29 * Math.sin(e * 21e-4) * Math.sin(e * 34e-4) + 0.29 * Math.sin(e * 13e-4 + 1.7);
var oh = (e, t) => ah(e) * (0.55 + 0.45 * Math.sin(e * 0.012 - Math.abs(t) * 1.05));
var sh = (e) => -Math.PI * 1.25 + Wi(e)() * Math.PI * 1.5;
var ch = (e) => {
  let t = 0.62, n = 416 / (t * t), r = Math.sqrt(80 / n);
  if (e < r) return 0.5 * n * e * e;
  let i = Um((e - r) / t);
  return 40 - 208 * i * (1 - i);
};
var lh = (e) => {
  let t = Um(e / Fm);
  if (t < Im) {
    let n2 = t / Im, r = n2 * n2 * (3 - 2 * n2), i = F(n2 / 0.08, 0, 1) * F((1 - n2) / 0.08, 0, 1);
    return { x: -54 + 118 * r, y: 26, wig: Math.sin(n2 * 24) * 3.2 * i, rot: 17 + Math.sin(e * 6e-4) * 1 };
  }
  let n = Un((t - Im) / 0.31999999999999995);
  return { x: 64 - 118 * n, y: 26 - 20 * Math.sin(n * Math.PI), wig: 0, rot: 17 - 2 * Math.sin(n * Math.PI) + Math.sin(e * 6e-4) * 1 };
};
var uh = (e) => {
  let t = lh(e);
  return [B + t.x, B + t.y + t.wig + 19];
};
var dh = (() => {
  let e = [];
  for (let t = 0; t < Lm; t++) {
    let n = uh(t), r = e[e.length - 1];
    (r === void 0 || Math.hypot(n[0] - r.point[0], n[1] - r.point[1]) > Rm) && e.push({ at: t, point: n });
  }
  return e;
})();
var fh = (e) => {
  let t = Um(e / Fm) * Fm, n = Math.min(t, Lm), r = dh.filter((e2) => e2.at <= n), i = n > (r.length > 0 ? r[r.length - 1].at : n) ? [uh(n)] : [], a = [...r.map((e2) => e2.point), ...i].slice(-64);
  return t < Lm ? a : a.slice(Math.floor((t - Lm) / 1e3 * zm));
};
var ph = (e) => {
  let t = e.length, n = `M${e[0][0].toFixed(1)} ${e[0][1].toFixed(1)}`;
  if (t === 2) return n + `L${e[1][0].toFixed(1)} ${e[1][1].toFixed(1)}`;
  for (let r = 0; r < t - 1; r++) {
    let i = e[Math.max(r - 1, 0)], a = e[r], o = e[r + 1], s2 = e[Math.min(r + 2, t - 1)], c = a[0] + (o[0] - i[0]) / 6, l = a[1] + (o[1] - i[1]) / 6, u = o[0] - (s2[0] - a[0]) / 6, d = o[1] - (s2[1] - a[1]) / 6;
    n += `C${c.toFixed(1)} ${l.toFixed(1)} ${u.toFixed(1)} ${d.toFixed(1)} ${o[0].toFixed(1)} ${o[1].toFixed(1)}`;
  }
  return n;
};
var mh = (e, t, n) => {
  let r = [B - Dm, B + Dm], i = [];
  for (let a = 0; a < 2; a++) {
    let o = F((e - a * 0.12) / (1 - a * 0.12), 0, 1);
    if (o <= 4e-3) continue;
    let s2 = I(o), c = Wn(o), l = ih(t, a === 0 ? 0 : 2, e, n);
    i.push($m(`dots.${a}`, B + (r[a] - B) * c, B - l.lift, Em * s2 * l.pop * Am, s2 * l.tone));
  }
  return i;
};
var hh = (e, t) => {
  let n = I(e), r = 52 * Wn(e), i = t.stateTime * 1e3 * 17e-4;
  return Array.from({ length: 5 }, (e2, t2) => {
    let a = i + t2 * Math.PI * 2 / 5, o = Math.cos(a), s2 = 0.5 + 0.5 * F(o, 0, 1);
    return $m(`orbit.${t2}`, B + r * Math.sin(a), B - r * 0.42 * Math.cos(a), Math.max(12 * s2 * n, 0.3), F((o + 0.4) / 0.6, 0.18, 1) * n);
  });
};
var gh = (e, t, n) => {
  let r = I(e);
  return Array.from({ length: 3 }, (e2, i) => {
    let a = Um(t.stateTime * 1e3 / 1300 + i / 3);
    return eh(`radar.${i}`, n + (104 - n) * a, 3.4 * (1 - a * 0.55), r * (1 - a) * 0.9);
  });
};
var _h = (e, t) => {
  let n = I(e), r = 62 * Wn(e), i = F(F(t.shotTime * 1e3 / Bm, 0, 1) / 0.85, 0, 1), a = eh(`progress.track`, r, 5, n * 0.16);
  return i <= 0 ? [a] : [a, { type: `ring`, key: `progress.arc`, cx: B, cy: B, r, width: 5, opacity: n, arc: { fraction: i, startDeg: -90 } }];
};
var vh = (e, t) => {
  let n = I(e), r = [];
  for (let e2 = 0; e2 < 5; e2++) {
    let i = F((t.shotTime * 1e3 / Vm - e2 * 0.09) / 0.62, 0, 1);
    if (i >= 1) continue;
    let a = 1 - (1 - i) ** 3, o = e2 * 2.4 + i * 2.2, s2 = 96 * (1 - a);
    r.push($m(`gather.${e2}`, B + s2 * Math.cos(o), B + s2 * Math.sin(o) * 0.8, 9 * (0.5 + 0.5 * a) * n, n * F(i * 5, 0, 1) * (1 - a * 0.25)));
  }
  return r;
};
var yh = (e, t) => {
  let n = t.stateTime * 1e3, r = [];
  for (let t2 of Hm) {
    let i = F((e - Math.abs(t2) * 0.1) / (1 - Math.abs(t2) * 0.1), 0, 1);
    if (i <= 4e-3) continue;
    let a = Wn(i), o = oh(n, t2), s2 = (7 + 9 * F(o, 0.08, 1)) * I(i), c = 6 * F(o, 0, 1) * i;
    r.push($m(`wave.${t2}`, B + t2 * 44 * a, B - c, s2, i));
  }
  return r;
};
var bh = (e, t) => {
  let n = I(e), r = Um(t.stateTime * 1e3 / Nm), i = F((r - 0.18) / 0.55, 0, 1), a = i * i * (0.4 + 0.6 * i), o = 0.74, s2 = -0.62, c = [];
  if (i > 0 && i < 1) {
    let e2 = 108 * a;
    c.push($m(`send.packet`, B + o * e2, B + s2 * e2, 10 * (1 - a * 0.55) * n, n * (1 - a * a)));
  }
  let l = F((r - 0.26) / 0.55, 0, 1), u = l * l * (0.4 + 0.6 * l);
  if (i > 0 && l > 0 && l < 1) {
    let e2 = 108 * u;
    c.push($m(`send.streak`, B + o * e2, B + s2 * e2, 5 * (1 - u * 0.6) * n, n * 0.3 * (1 - u)));
  }
  let d = F((r - 0.18) / 0.3, 0, 1);
  return d > 0 && d < 1 && c.push(eh(`send.launch`, 20 + 34 * I(d), 2.8 * (1 - d), n * (1 - d) * 0.8)), c;
};
var xh = (e, t) => {
  let n = I(e), r = t.stateTime * 1e3, i = sh(Math.floor(r / Pm)), a = Um(r / Pm), o = F(a / 0.6, 0, 1), s2 = 1 - (1 - o) ** 3, c = Math.cos(i), l = Math.sin(i), u = 108 * (1 - s2), d = [];
  if (o < 1) {
    let e2 = 18 * Math.sin(o * Math.PI) * (1 - s2 * 0.7);
    d.push($m(`receive.packet`, B + c * u - l * e2, B + l * u + c * e2, 3.5 + 6.5 * s2, n * F(o * 3.5, 0, 1) * (0.3 + 0.7 * s2)));
  }
  let f2 = F((a - 0.58) / 0.32, 0, 1);
  return f2 > 0 && f2 < 1 && d.push(eh(`receive.absorb`, 20 + 26 * I(f2), 2.8 * (1 - f2), n * (1 - f2) * 0.8)), d;
};
var Sh = (e, t) => {
  let n = I(e), r = t.stateTime * 1e3, i = [];
  for (let e2 = 0; e2 < 2; e2++) {
    let a = F((t.stateTime - (0.2 + e2 * 1.3)) / 0.9, 0, 1);
    if (a <= 0) continue;
    let o = 1 - (1 - a) ** 3, s2 = r * 1e-3 * 1.1 + e2 * Math.PI, c = B + 42 * Math.sin(s2), l = B + 21 * Math.cos(s2) + Math.sin(r * 3e-3 + e2) * 2, u = B - 120 + e2 * 30, d = B + 95;
    i.push($m(`dock.${e2}`, u + (c - u) * o, d + (l - d) * o, (7 + 3 * o) * n, n * F(a * 4, 0, 1)));
  }
  return i;
};
var Ch = (e, t) => {
  let n = t.stateTime * 1e3, r = lh(n), i = (r.rot - 90) * Math.PI / 180, a = Math.cos(i) * 68, o = Math.sin(i) * 68, s2 = B + (r.x + a) * e, c = B + (r.y + r.wig * 0.15 + o) * e, l = [th(`pencil.shaft`, Zm, `translate(${s2.toFixed(1)} ${c.toFixed(1)}) rotate(${(r.rot * e).toFixed(1)}) scale(${I(e).toFixed(3)}) translate(${-B} ${-B})`, F(e * 1.6 - 0.3, 0, 1))], u = fh(n);
  return u.length >= 2 && l.push(nh(`pencil.ink`, ph(u), 6, F(e * 1.2, 0, 1))), l;
};
var wh = (e, t) => {
  let n = t.stateTime, r = I(F(e * 1.1, 0, 1)), i = Math.exp(-(n % 2.2) * 5.5), a = Math.sin(n * 42) * 2.2 * i;
  return [th(`bang.bar`, Qm, `translate(0 ${(-26 - (1 - r) * 70).toFixed(1)}) rotate(${a.toFixed(2)} ${B} ${(B - 74).toFixed(1)}) translate(${B} ${B}) scale(${F(e * 1.2, 0, 1).toFixed(3)}) translate(${-B} ${-B})`, F(e * 1.5 - 0.2, 0, 1))];
};
var Th = (e, t) => {
  let n = 0.5 + 0.5 * Math.sin(t.stateTime * 1e3 * 16e-4);
  return [$m(`standby.halo`, B, B, 26 + 7 * n, I(e) * (0.06 + 0.1 * n))];
};
var Eh = (e, t, n, r, i) => {
  switch (e) {
    case `dots`:
      return mh(t, n, i);
    case `orbit`:
      return hh(t, n);
    case `radar`:
      return gh(t, n, r);
    case `progress`:
      return _h(t, n);
    case `gather`:
      return vh(t, n);
    case `wave`:
      return yh(t, n);
    case `send`:
      return bh(t, n);
    case `receive`:
      return xh(t, n);
    case `dock`:
      return Sh(t, n);
    case `ball`:
      return [];
    case `pencil`:
      return Ch(t, n);
    case `bang`:
      return wh(t, n);
    case `standby`:
      return Th(t, n);
    default:
      throw Error(`Unhandled case: ${String(e)}`);
  }
};
function Dh(e, t) {
  let { kind: n, isReducedMotion: r } = e, i = F(e.amount, 0, 1), a = F(e.swap, 0, 1), o = a < 0.999 ? e.outgoing : null, s2 = (e2) => e2 === n ? i * a : e2 === o ? i * (1 - a) : 0, c = (t2) => t2 === n ? e.clock : e.outgoingClock, l = F(i / xm, 0, 1), u = n !== `pencil` && o !== `pencil` ? Gm : a >= 0.999 ? Jm(n) : go(Jm(o), Jm(n), Un(a)), d = n ? wm[n] * a + (o ? wm[o] : wm[n]) * (1 - a) : 19, f2 = s2(`dots`), p = n === `dots` || o === `dots`, m = p ? ih(c(`dots`), 1, i, r) : rh, h = p ? 1 + (m.pop - 1) * (f2 / Math.max(i, 1e-3)) : 1, g = s2(`receive`);
  if (g > 4e-3) {
    let e2 = F((Um(c(`receive`).stateTime * 1e3 / Pm) - 0.58) / 0.34, 0, 1);
    h *= 1 + 0.11 * Math.sin(e2 * Math.PI) * g;
  }
  let _ = s2(`send`);
  if (_ > 4e-3) {
    let e2 = Um(c(`send`).stateTime * 1e3 / Nm), t2 = e2 < 0.18 ? -0.06 * Math.sin(e2 / 0.18 * Math.PI) : 0, n2 = e2 >= 0.18 && e2 < 0.42 ? 0.05 * Math.sin((e2 - 0.18) / 0.24 * Math.PI) : 0;
    h *= 1 + (t2 + n2) * _;
  }
  let v = s2(`bang`);
  v > 4e-3 && (h *= 1 + 0.04 * Math.exp(-(c(`bang`).stateTime % 2.2) * 5.5) * v);
  let y = 0, b = 0, x = 0, S = s2(`pencil`);
  if (S > 4e-3) {
    let e2 = lh(c(`pencil`).stateTime * 1e3);
    y += e2.x * S, b += (e2.y + e2.wig * 0.5) * S, x += e2.rot * S;
  }
  v > 4e-3 && (b += 58 * v);
  let C = s2(`ball`);
  C > 4e-3 && (b += ch(c(`ball`).stateTime) * C);
  let w = d / B * h, T = s2(`standby`), E2 = T > 0 ? (0.28 + 0.2 * Math.sin(c(`standby`).stateTime * 1e3 * 16e-4)) * T : 0, D = { scale: 1 - i + w * i, dx: y * i, dy: -m.lift * f2 + b * i, rotation: x * i, opacity: (1 - (1 - m.tone) * f2) * (1 - E2), round: Un(l), ring: u }, O = 1 - Gn(F((t - 44) / 90, 0, 1)), ee = n == null ? 1 : Tm[n], k = o ? Tm[o] : ee, te = 1 + (ee * a + k * (1 - a) - 1) * i * O, ne = [];
  for (let e2 of [o, n]) {
    if (e2 == null) continue;
    let t2 = s2(e2);
    t2 > 4e-3 && ne.push(...Eh(e2, t2, c(e2), d, r));
  }
  return { core: D, isFaceVisible: i < 0.5, zoom: te, parts: ne.filter((e2) => e2.opacity > 0) };
}
var Oh = Vf(192);
var kh = Yf(96);
var Ah = 0.6;
function jh(e, t, n) {
  return t === `sphere` ? nm({ ...e, body: t }, n) : bf({ ...e, body: t }, n);
}
function Mh(e, t, n = t) {
  let r = e.bodies.map(({ body: n2, weight: r2 }) => ({ shape: jh(e, n2, t), weight: r2 })).sort((e2, t2) => t2.weight - e2.weight), i = r[0]?.shape.center ?? [t / 2, t / 2], a = r[0]?.shape.radius ?? 0, o = Uf([Oh, ...r.map(({ shape: e2 }) => Hf(Bf(e2), e2.center))]), s2 = Zf(r.map(({ shape: e2, weight: t2 }) => ({ outline: Wf(Bf(e2), e2.center, o), weight: t2 }))), c = e.morph == null ? null : Dh(e.morph, n), l = Xi * t / 2 / B, u = c?.core.round ?? 0;
  return { size: t, center: i, body: c == null || u === 0 ? s2 : Qf(s2, Fh(c, i, a, o), u), eyes: r.length === 1 ? r[0]?.shape.eyes ?? [] : Rh(r), painted: r.length === 1 ? r[0]?.shape.painted ?? [] : [], paintedOpacity: 1 - u, head: c == null || e.morph == null ? null : Ih(c, e.morph.amount, e.zoom, l), parts: c?.parts ?? [], markScale: l, zoom: c?.zoom ?? 1 };
}
function Nh(e, t, n, r, i = n, a = n) {
  return Ph(Mh(e, n, i), t, r, a);
}
function Ph(e, t, n, r = e.size) {
  let { size: i, center: a } = e, o = Oa(t), s2 = tp(e.body), c = e.eyes.map(tp).join(``), l = [], u = [Y(`path`, { d: s2, fill: o })];
  if (c !== `` && t.cutout ? (l.push(Y(`mask`, { id: `${n}-holes`, maskUnits: `userSpaceOnUse`, x: 0, y: 0, width: i, height: i }, [Y(`rect`, { width: i, height: i, fill: `#fff` }), Y(`path`, { d: c, fill: `#000` })])), u[0] = Y(`path`, { d: s2, fill: o, mask: `url(#${n}-holes)` })) : c !== `` && (l.push(Y(`clipPath`, { id: `${n}-body` }, [Y(`path`, { d: s2 })])), u.push(Y(`path`, { d: c, fill: ka(t), "clip-path": `url(#${n}-body)` }))), e.paintedOpacity > 0) {
    let t2 = e.paintedOpacity < 1 ? { opacity: Z(e.paintedOpacity, 3) } : {};
    for (let { fill: n2, loops: r2 } of e.painted) u.push(Y(`path`, { d: r2.map(tp).join(``), fill: n2, ...t2 }));
  }
  let d = e.head, f2 = d == null ? u : [Y(`g`, { transform: `translate(${Z(a[0] + d.translate[0])} ${Z(a[1] + d.translate[1])}) rotate(${Z(d.rotation)}) scale(${Z(d.scale, 5)}) translate(${Z(-a[0])} ${Z(-a[1])})`, ...d.opacity < 1 ? { opacity: Z(d.opacity, 3) } : {} }, u)], p = e.parts.length === 0 ? [] : [Y(`g`, { transform: `translate(${i / 2} ${i / 2}) scale(${Z(e.markScale, 5)}) translate(${-B} ${-B})` }, e.parts.map((e2) => Lh(e2, o)))], m = i / 2 + (bm - B) * e.markScale, h = e.zoom === 1 ? [...p, ...f2] : [Y(`g`, { transform: `translate(${Z(m)} ${Z(m)}) scale(${Z(e.zoom, 5)}) translate(${Z(-m)} ${Z(-m)})` }, [...p, ...f2])];
  return sf(i, n, r, [...l.length === 0 ? [] : [Y(`defs`, {}, l)], ...h]);
}
function Fh(e, t, n, r) {
  let i = n / B;
  return Kf(e.core.ring.map(([e2, n2]) => [t[0] + (e2 - B) * i, t[1] + (n2 - B) * i]), t, r);
}
function Ih(e, t, n, r) {
  let { core: i } = e, a = 1 - t, o = t > 0 ? (i.scale - a) / t : 0;
  return { translate: [i.dx * r, i.dy * r], rotation: i.rotation, scale: a + Xi / n * o * t, opacity: i.opacity };
}
function Lh(e, t) {
  let n = e.opacity < 1 ? { opacity: Z(e.opacity, 3) } : {};
  switch (e.type) {
    case `disc`:
      return Y(`circle`, { cx: Z(e.cx), cy: Z(e.cy), r: Z(e.r), fill: t, ...n });
    case `ring`: {
      let r = 2 * Math.PI * e.r, i = e.arc == null ? {} : { "stroke-dasharray": `${Z(r * e.arc.fraction)} ${Z(r)}`, transform: `rotate(${Z(e.arc.startDeg)} ${Z(e.cx)} ${Z(e.cy)})` };
      return Y(`circle`, { cx: Z(e.cx), cy: Z(e.cy), r: Z(e.r), fill: `none`, stroke: t, "stroke-width": Z(e.width), ...i, ...n });
    }
    case `shape`:
      return Y(`path`, { d: e.d, transform: e.transform, fill: t, ...n });
    case `stroke`:
      return Y(`path`, { d: e.d, fill: `none`, stroke: t, "stroke-width": Z(e.width), "stroke-linecap": `round`, "stroke-linejoin": `round`, ...n });
    default:
      throw Error(`Unhandled case`);
  }
}
function Rh(e) {
  let t = (e[0]?.shape.radius ?? 0) * Ah, n = [];
  return e.forEach(({ shape: r }, i) => {
    for (let a of r.eyes) {
      let r2 = ep(a), o = zh(n, i, r2, t);
      if (o != null) {
        o.loops[i] = a;
        continue;
      }
      let s2 = e.map(() => null);
      s2[i] = a, n.push({ anchor: r2, loops: s2 });
    }
  }), n.map((t2) => {
    let n2 = t2.loops.map((e2) => e2 == null ? null : qf(e2)), r = Xf([kh, ...n2.map((e2) => e2?.stations ?? [])]);
    return Zf(e.map(({ weight: e2 }, i) => {
      let a = n2[i];
      return { outline: a == null ? $f(t2.anchor, r.length) : Jf(a, r), weight: e2 };
    }));
  });
}
function zh(e, t, n, r) {
  let i = null, a = r;
  for (let r2 of e) {
    if (r2.loops[t] != null) continue;
    let e2 = Math.hypot(r2.anchor[0] - n[0], r2.anchor[1] - n[1]);
    e2 < a && (i = r2, a = e2);
  }
  return i;
}
function Z(e, t = 2) {
  let n = 10 ** t;
  return String(Math.round(e * n) / n);
}
function Bh(e, t, n, r, i = {}) {
  return cf(Vh(e, t, n, r, i));
}
function Vh(e, t, n, r, i = {}) {
  let [a, ...o] = e.bodies;
  return a == null || o.length > 0 || e.morph != null ? Nh(e, t, n, r, i.displaySize ?? n, i.extent) : a.body === `sphere` ? im(em({ ...e, body: a.body }, t, n, i), t, r, i.extent) : xf(yf({ ...e, body: a.body }, t, n, i), r, i.extent);
}

function registerCustomShape(name, options = {}) {
  if (!name || typeof name !== "string") {
    throw new Error("registerCustomShape: name must be a non-empty string");
  }
  const {
    path = "M 114.27 20 L 208.54 114.27 L 114.27 208.54 L 20 114.27 Z",
    scale = 1.2,
    eyeLayout = { width: 0.22, height: 0.48, gap: 0.5, shiftY: 0 }
  } = options;
  registerExtrusionShape(name, options);
  ds[name] = typeof path === "function" ? path : () => path;
  js[name] = () => Bs(scale, Ks(U(name)));
  Bc[name] = zc;
  Za[name] = {
    width: eyeLayout.width ?? 0.22,
    height: eyeLayout.height ?? 0.48,
    gap: eyeLayout.gap ?? 0.5,
    shiftY: eyeLayout.shiftY ?? 0
  };
  fs.delete(name);
  Ms.delete(name);
  return name;
}
export { canonicalShape };
export { computeGaze };
export { createAppearance };
import { createMotion } from "../motion/motion";
export const officialShapes: string[] = zt;
export { createMotion };

export const renderSvgString: (
  frame: any,
  appearance: Appearance,
  size: number,
  idPrefix: string,
  options?: any
) => string = Bh;
export { registerCustomShape };
