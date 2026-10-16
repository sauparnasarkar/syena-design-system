import { useEffect, useRef, useState } from 'react';
import { toPx } from '../../theme/lengths';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import styles from './Sparkline.module.css';

export interface SparklineProps {
  /** The values in order. `null` leaves a gap: the line breaks and is never joined across it. */
  values: Array<number | null>;
  /** What is plotted, the period and the reading, for example "Emissions 1990 to 2024, rising from 22 to 37 gigatonnes". Required. */
  ariaLabel: string;
  /** `card` for a card or the page; `panel` for the dark data panel. The colour is taken from tokens that read on that ground. */
  surface?: 'card' | 'panel';
  size?: 'sm' | 'md';
  /** Marks the last value with a dot. */
  showEnd?: boolean;
  /** Fills under the line at the band opacity. */
  filled?: boolean;
}

const tokenNames = ['layout-focus-ring-width'] as const;

/**
 * A line with no axes, for a trend inside a figure: it stretches to the width of its container.
 * It is drawn in the pixels of its own box, inset on every side by the end dot's radius (or by half the line's
 * stroke when there is no dot), so nothing paints outside the box and the dot is round at any size.
 */
export function Sparkline({ values, ariaLabel, surface = 'card', size = 'sm', showEnd = true, filled = false }: SparklineProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const t = useResolvedTokens(tokenNames);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ring = t ? toPx(t['layout-focus-ring-width']) : 0;
  // The dot's stroke is three line widths, so its radius is one and a half; without a dot only the line's half width is needed.
  const inset = showEnd ? 1.5 * ring : ring / 2;
  const { w, h } = box;
  const ready = w > 0 && h > 0 && ring > 0;

  const present = values.filter((v): v is number => v !== null);
  const lo = present.length ? Math.min(...present) : 0;
  const hi = present.length ? Math.max(...present) : 1;
  const span = hi - lo;
  const x = (i: number) => (values.length > 1 ? inset + (i / (values.length - 1)) * (w - 2 * inset) : w / 2);
  // A flat series sits in the middle.
  const y = (v: number) => (span === 0 ? h / 2 : h - inset - ((v - lo) / span) * (h - 2 * inset));

  const runs: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  if (ready) {
    values.forEach((v, i) => {
      if (v === null) { if (current.length) runs.push(current); current = []; } else current.push([x(i), y(v)]);
    });
    if (current.length) runs.push(current);
  }

  const trace = (run: Array<[number, number]>) => run.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join('');
  const d = runs.map(trace).join('');
  const area = runs.filter((r) => r.length > 1).map((run) => `${trace(run)}L${run[run.length - 1][0].toFixed(2)} ${h}L${run[0][0].toFixed(2)} ${h}Z`).join('');
  let lastIndex = -1;
  values.forEach((v, i) => { if (v !== null) lastIndex = i; });

  return (
    <svg ref={ref} className={[styles.spark, styles[surface], styles[size]].join(' ')} viewBox={`0 0 ${Math.max(w, 1)} ${Math.max(h, 1)}`} role="img" aria-label={ariaLabel}>
      {ready && filled && area ? <path className={styles.fill} d={area} /> : null}
      {ready ? <path className={styles.line} d={d} /> : null}
      {ready && showEnd && lastIndex >= 0 ? (
        // A zero-length stroke with round caps: a round dot at any size, since the drawing is 1:1 with the pixels.
        <path className={styles.end} d={`M${x(lastIndex).toFixed(2)} ${y(values[lastIndex] as number).toFixed(2)}h0`} />
      ) : null}
    </svg>
  );
}
