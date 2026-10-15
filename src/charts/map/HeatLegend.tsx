import { formatTick, logPosition, logTicks, type Domain } from './heat';
import styles from './HeatLegend.module.css';

export interface HeatLegendProps {
  /** What the colours measure, with its unit. */
  label: string;
  domain: Domain;
  /** How a tick is written. */
  formatValue?: (value: number) => string;
  noDataLabel?: string;
}

/** The heat scale as a bar with a tick at every power of ten, and the no-data swatch beside it. */
export function HeatLegend({ label, domain, formatValue = formatTick, noDataLabel = 'No data' }: HeatLegendProps) {
  const ticks = logTicks(domain);
  return (
    <div className={styles.legend}>
      <span className={styles.label}>{label}, log scale</span>
      <div className={styles.row}>
        <div className={styles.scale}>
          <span className={styles.bar} aria-hidden="true" />
          <ul className={styles.ticks}>
            {ticks.map((t) => (
              <li key={t} style={{ insetInlineStart: `${logPosition(t, domain) * 100}%` }}>{formatValue(t)}</li>
            ))}
          </ul>
        </div>
        <span className={styles.nodata}><span className={styles.swatch} aria-hidden="true" />{noDataLabel}</span>
      </div>
    </div>
  );
}
