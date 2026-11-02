import { bandTokens } from './bands';
import styles from './StepLegend.module.css';

export interface StepLegendProps {
  /** What the colours measure, with its unit. */
  label: string;
  /** The range written under each band, lightest first (eight). */
  bandLabels: string[];
  /** How many countries are in each band; when given, a count line is written under each range. */
  counts?: number[];
  /** How a count is written; "12 countries" by default. */
  formatCount?: (count: number) => string;
  /** How many countries have no data, written after "No data" ("No data · 3 countries") so the legend adds up to all of them; nothing is added when it is 0 or not given. */
  noDataCount?: number;
  noDataLabel?: string;
  /** A key for the outline the map draws round chosen countries, written beside No data ("Selected"): a swatch of the same double stroke. Nothing when not given. */
  outlineLabel?: string;
  /** Drawn on the mid-tone map panel rather than the dark data panel. */
  onMap?: boolean;
}

const defaultCount = (n: number) => `${n} ${n === 1 ? 'country' : 'countries'}`;

/**
 * The legend of a banded map: eight equal swatches in a row, the range under each (and, optionally, how many countries are in it), then a hatched
 * No data swatch. On a narrow screen the bands are two rows of four.
 */
export function StepLegend({ label, bandLabels, counts, formatCount = defaultCount, noDataLabel = 'No data', noDataCount, outlineLabel, onMap = false }: StepLegendProps) {
  return (
    <div className={onMap ? `${styles.legend} ${styles.onMap}` : styles.legend}>
      <div className={styles.inner}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <ol className={styles.bands} aria-label={`${label}, in ${bandTokens.length} bands from lowest to highest`}>
          {bandTokens.map((token, i) => (
            <li key={token} className={styles.band}>
              <span className={styles.swatch} style={{ background: `var(--syn-${token})` }} aria-hidden="true" />
              <span className={styles.range}>{bandLabels[i]}</span>
              {counts ? <span className={styles.count}>{formatCount(counts[i] ?? 0)}</span> : null}
            </li>
          ))}
        </ol>
        <div className={styles.keys}>
          <span className={styles.key}>
            <span className={`${styles.swatch} ${styles.hatched}`} aria-hidden="true" />
            <span className={styles.range}>{noDataCount ? `${noDataLabel} · ${formatCount(noDataCount)}` : noDataLabel}</span>
          </span>
          {outlineLabel ? (
            <span className={styles.key}>
              <span className={`${styles.swatch} ${styles.outlined}`} aria-hidden="true" />
              <span className={styles.range}>{outlineLabel}</span>
            </span>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
