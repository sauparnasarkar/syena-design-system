// Colour generation. Every derived colour comes from the seeds in tokens/primitives/seeds.json
// by the rules in FOUNDATIONS.md section 3. Rules are expressed in OKLCH.
import {
  interpolate, converter, formatHex, formatHex8, wcagContrast, clampChroma, inGamut,
  filterDeficiencyProt, filterDeficiencyDeuter, filterDeficiencyTrit,
} from 'culori';

const toOklch = converter('oklch');
const toOklab = converter('oklab');
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Colours are quantised to the 8-bit sRGB values that are emitted, so every check measures
// exactly what ships.
const toRgb = converter('rgb');
export const ok = (l, c, h) => toRgb(formatHex(clampChroma({ mode: 'oklch', l: clamp01(l), c: Math.max(0, c), h }, 'oklch', 'rgb')));
export const hex = (color) => formatHex(color);
export const hex8 = (color, alpha) => formatHex8({ ...toRgbObj(color), alpha });
const toRgbObj = (color) => converter('rgb')(color);
export const lch = (value) => {
  const x = toOklch(value);
  return { l: x.l, c: x.c ?? 0, h: x.h ?? 0 };
};
export const contrast = (a, b) => wcagContrast(a, b);
export const hueDistance = (a, b) => {
  const d = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return d;
};

const views = {
  normal: (c) => c,
  protanopia: filterDeficiencyProt(1),
  deuteranopia: filterDeficiencyDeuter(1),
  tritanopia: filterDeficiencyTrit(1),
};
export const viewNames = Object.keys(views);
export const distance = (a, b, view = 'normal') => {
  const x = toOklab(views[view](a));
  const y = toOklab(views[view](b));
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
};
export const minViewDistance = (a, b) => Math.min(...viewNames.map((v) => distance(a, b, v)));

/**
 * Move lightness away from `against` (all backgrounds) in small steps until every pair meets
 * `target` contrast. Hue and chroma are held (chroma is clamped to the gamut).
 */
export function solveLightness({ from, direction, backgrounds, target, step = 0.002 }) {
  const { l, c, h } = lch(from);
  let L = l;
  for (let i = 0; i < 600; i += 1) {
    const color = ok(L, c, h);
    if (backgrounds.every((background) => contrast(color, background) >= target)) return color;
    L += direction * step;
    if (L < 0 || L > 1) break;
  }
  throw new Error(`no lightness reaches contrast ${target} from ${hex(from)}`);
}

/** Neutral or tinted colour at exactly the lightness giving `target` contrast against `background`. */
export function atContrast({ hue, chroma, background, target, direction }) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    const cr = contrast(ok(mid, chroma, hue), background);
    // moving lighter increases contrast against a dark background; decreases against a light background
    const lighterMoreContrast = direction === 'lighter';
    if (cr < target === lighterMoreContrast) lo = mid; else hi = mid;
  }
  const L = direction === 'lighter' ? hi : lo;
  return ok(L, chroma, hue);
}

/** Ramp: lightness steps L(i) = top * ratio^-i, chroma follows a bell. */
export function ramp({ hue, peak, ratio, top, steps }) {
  const out = [];
  for (let i = 0; i < steps; i += 1) {
    const L = top * ratio ** -i;
    const t = i / (steps - 1);
    out.push({ index: i, color: ok(L, peak * 4 * t * (1 - t), hue) });
  }
  return out;
}

export { inGamut, formatHex };

/** The colour a thin dashed line presents: its colour mixed into the ground by the dash duty (linear light). */
export const asThinLine = (color, ground, duty) => toRgb(formatHex(interpolate([ground, color], 'lrgb')(duty)));
