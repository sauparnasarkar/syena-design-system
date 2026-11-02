// Fixed colour bands for a map: eight bands between seven ascending breaks, darker = more. Unlike the heat scale the bands do not depend on the data shown,
// so a country that changes colour has crossed a band (the point of using them to compare years).

/** The eight band tokens, lightest to darkest. */
export const bandTokens = ['data-band-1', 'data-band-2', 'data-band-3', 'data-band-4', 'data-band-5', 'data-band-6', 'data-band-7', 'data-band-8'] as const;
export const bandCount = bandTokens.length;

/** Seven breaks for annual emissions in MtCO₂, used when none are given. */
export const defaultBreaks = [1, 10, 100, 250, 500, 1000, 2500];

/** Which band a value falls in, 0 to 7. A value equal to a break goes in the upper band; values below the first break are in the first, above the last in the eighth. */
export function bandIndex(value: number, breaks: ReadonlyArray<number>): number {
  let band = 0;
  while (band < breaks.length && value >= breaks[band]) band += 1;
  return band;
}

/** How many of the values are in each band. */
export function bandCounts(values: ReadonlyArray<number>, breaks: ReadonlyArray<number>): number[] {
  const counts = Array.from({ length: breaks.length + 1 }, () => 0);
  for (const v of values) counts[bandIndex(v, breaks)] += 1;
  return counts;
}

const compact = (v: number) => (v >= 1000 ? `${Number((v / 1000).toPrecision(3))}k` : String(v));

/** "<1", "1–10" … "2.5k+": the range of each band, from the breaks, when no labels are given. */
export function defaultBandLabels(breaks: ReadonlyArray<number>): string[] {
  return [`<${compact(breaks[0])}`, ...breaks.slice(1).map((b, i) => `${compact(breaks[i])}–${compact(b)}`), `${compact(breaks[breaks.length - 1])}+`];
}

/** Valid breaks: seven finite, strictly ascending values. */
export const validBreaks = (breaks: ReadonlyArray<number>) => breaks.length === bandCount - 1 && breaks.every((b, i) => Number.isFinite(b) && (i === 0 || b > breaks[i - 1]));
