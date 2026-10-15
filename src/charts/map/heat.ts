// The heat scale on a log axis, shared by the globe and the flat map.

export type Domain = [number, number];

/** Tick values: every power of ten from the domain's low end to its high end (0.01, 0.1, 1 … 10,000). */
export function logTicks([lo, hi]: Domain): number[] {
  const first = Math.ceil(Math.log10(lo) - 1e-9);
  const last = Math.floor(Math.log10(hi) + 1e-9);
  return Array.from({ length: last - first + 1 }, (_, i) => Number((10 ** (first + i)).toPrecision(12)));
}

/** Where a value sits on the scale, 0 to 1, on a log axis; values outside the domain clamp to its ends. */
export function logPosition(value: number, [lo, hi]: Domain): number {
  const t = (Math.log10(Math.max(value, Number.MIN_VALUE)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
  return Math.min(1, Math.max(0, t));
}

type Rgb = [number, number, number];

const parse = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
};

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, fromLinear(c)))) as Rgb;
}

const toHex = (rgb: Rgb) => `#${rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;

/** The colour at position `t` (0 to 1) along evenly spaced stops, blended in OKLab so no step looks muddy. */
export function blendStops(stops: string[], t: number): string {
  const scaled = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const a = toOklab(parse(stops[i]));
  const b = toOklab(parse(stops[i + 1]));
  return toHex(fromOklab([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]));
}

/** The heat colour for a value on the log scale. `null` and non-positive values are the caller's no-data case. */
export const heatColour = (value: number, domain: Domain, stops: string[]) => blendStops(stops, logPosition(value, domain));

/** Heat stops are laid at the powers of ten, so the legend and the map agree: stop i is tick i when the domain spans stops.length - 1 decades. */
export const formatTick = (v: number) => (v >= 1000 ? v.toLocaleString('en-GB') : String(v));
