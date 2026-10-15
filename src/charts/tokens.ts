import { useResolvedTokens } from '../theme/SynThemeProvider';
import { toPx } from '../theme/lengths';

const range = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i + 1));

export const chartTokenNames = [
  'data-surface', 'data-text', 'data-text-muted', 'data-gridline', 'data-annotation', 'data-uncertainty', 'data-no-data', 'data-other',
  ...range(8, (i) => `data-cat-${i}`),
  ...range(7, (i) => `data-seq-${i}`),
  ...range(7, (i) => `data-heat-${i}`),
  'data-div-neg-3', 'data-div-neg-2', 'data-div-neg-1', 'data-div-mid', 'data-div-pos-1', 'data-div-pos-2', 'data-div-pos-3',
  'data-change-decrease', 'data-change-increase',
  'color-surface-overlay', 'color-border-default', 'color-text-primary',
  'family-ui', 'family-figure', 'type-caption-size', 'type-text-sm-size', 'layout-focus-ring-width',
  'space-2', 'space-3', 'space-4', 'space-5', 'opacity-band', 'opacity-projection',
] as const;

/** The chart tokens, resolved for the theme in force and converted to the units the chart library takes. */
export function useChartTokens() {
  const raw = useResolvedTokens(chartTokenNames);
  if (!raw) return null;
  const colours = (names: string[]) => names.map((n) => raw[n as keyof typeof raw]);
  const length = (n: keyof typeof raw) => toPx(raw[n]);
  return {
    surface: raw['data-surface'],
    text: raw['data-text'],
    textMuted: raw['data-text-muted'],
    gridline: raw['data-gridline'],
    annotation: raw['data-annotation'],
    uncertainty: raw['data-uncertainty'],
    noData: raw['data-no-data'],
    other: raw['data-other'],
    categorical: colours(range(8, (i) => `data-cat-${i}`)),
    sequential: colours(range(7, (i) => `data-seq-${i}`)),
    heat: colours(range(7, (i) => `data-heat-${i}`)),
    diverging: colours(['data-div-neg-3', 'data-div-neg-2', 'data-div-neg-1', 'data-div-mid', 'data-div-pos-1', 'data-div-pos-2', 'data-div-pos-3']),
    decrease: raw['data-change-decrease'],
    increase: raw['data-change-increase'],
    overlay: raw['color-surface-overlay'],
    border: raw['color-border-default'],
    textPrimary: raw['color-text-primary'],
    familyUi: raw['family-ui'],
    familyFigure: raw['family-figure'],
    captionSize: length('type-caption-size'),
    smallSize: length('type-text-sm-size'),
    strokeWidth: length('layout-focus-ring-width'),
    space: { s2: length('space-2'), s3: length('space-3'), s4: length('space-4'), s5: length('space-5') },
    bandOpacity: parseFloat(raw['opacity-band']),
    projectionOpacity: parseFloat(raw['opacity-projection']),
  };
}

export type ChartTokens = NonNullable<ReturnType<typeof useChartTokens>>;
