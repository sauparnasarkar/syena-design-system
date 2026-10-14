import type { Dash } from 'plotly.js';
import type { ChartTokens } from './tokens';

/** Colour for the nth series (1-based), taken in order; beyond eight the remainder is grouped as "other". */
export const seriesColour = (t: ChartTokens, n: number) => (n <= t.categorical.length ? t.categorical[n - 1] : t.other);

const scaleOf = (colours: string[]): Array<[number, string]> => colours.map((c, i) => [i / (colours.length - 1), c]);

/** Plotly colour scales built from the sequential and diverging ramps. */
export const sequentialScale = (t: ChartTokens) => scaleOf(t.sequential);
export const divergingScale = (t: ChartTokens) => scaleOf(t.diverging);

/** The dash pattern of a projected line: on for three stroke widths, off for two. */
export const projectionDash = (t: ChartTokens) => `${3 * t.strokeWidth}px,${2 * t.strokeWidth}px` as Dash;

/** The step of the diverging ramp for a signed value, with `step` the size of one band. */
export function divergingColour(t: ChartTokens, value: number, step: number) {
  const a = Math.min(3, Math.ceil(Math.abs(value) / step));
  if (a === 0) return t.diverging[3];
  return value < 0 ? t.diverging[3 - a] : t.diverging[3 + a];
}
