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

const W = 100;
const H = 100;

/** A line with no axes, for a trend inside a figure: it stretches to the width of its container. */
export function Sparkline({ values, ariaLabel, surface = 'card', size = 'sm', showEnd = true, filled = false }: SparklineProps) {
  const present = values.filter((v): v is number => v !== null);
  const lo = present.length ? Math.min(...present) : 0;
  const hi = present.length ? Math.max(...present) : 1;
  const span = hi - lo;
  const x = (i: number) => (values.length > 1 ? (i / (values.length - 1)) * W : W / 2);
  // A flat series sits in the middle; the rest fill the height, with room for the stroke at both edges.
  const y = (v: number) => (span === 0 ? H / 2 : H - 6 - ((v - lo) / span) * (H - 12));

  const runs: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  values.forEach((v, i) => {
    if (v === null) { if (current.length) runs.push(current); current = []; } else current.push([x(i), y(v)]);
  });
  if (current.length) runs.push(current);

  const d = runs.map((run) => run.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join('')).join('');
  const area = runs.filter((r) => r.length > 1).map((run) => `${run.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join('')}L${run[run.length - 1][0].toFixed(2)} ${H}L${run[0][0].toFixed(2)} ${H}Z`).join('');
  let lastIndex = -1;
  values.forEach((v, i) => { if (v !== null) lastIndex = i; });

  return (
    <svg className={[styles.spark, styles[surface], styles[size]].join(' ')} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
      {filled && area ? <path className={styles.fill} d={area} /> : null}
      <path className={styles.line} d={d} vectorEffect="non-scaling-stroke" />
      {showEnd && lastIndex >= 0 ? (
        // A dot that is round at any width: a zero-length stroke with round caps, not a stretched circle.
        <path className={styles.end} d={`M${x(lastIndex).toFixed(2)} ${y(values[lastIndex] as number).toFixed(2)}h0`} vectorEffect="non-scaling-stroke" />
      ) : null}
    </svg>
  );
}
