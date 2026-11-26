import { useId } from 'react';
import { Figure, formatFigure } from '../Figure/Figure';
import styles from './Gauge.module.css';

export interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  /** Written after the value, for example `%`. */
  unit?: string;
  /** The unit spelled for screen readers. `%` is read as "percent" when this is not given. */
  unitLabel?: string;
  /** What is measured. Required. */
  label: string;
  /** `accent` unless the metric says whether a value is good (`positive`), worth a look (`caution`) or bad (`negative`). */
  tone?: 'accent' | 'positive' | 'caution' | 'negative';
}

/** The decimal places a number has, whatever its notation (4e-7 has seven), up to twenty: the figure shows what the meter announces. */
const places = (value: number) => {
  const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
  return Math.min(20, Math.max(0, (mantissa.split('.')[1] ?? '').length - Number(exponent)));
};

/** One value on a bounded scale. It is a measurement, not progress toward a goal: that is `Progress`. The bar is held to the scale; the written and spoken value is always the real one, so what is seen and what is heard agree. */
export function Gauge({ value, min = 0, max = 100, unit, unitLabel, label, tone = 'accent' }: GaugeProps) {
  const id = useId();
  const clamped = Math.min(max, Math.max(min, value));
  const span = max - min;
  const percent = span > 0 ? ((clamped - min) / span) * 100 : 0;
  const spoken = unitLabel ?? (unit === '%' ? 'percent' : unit);
  return (
    <div className={styles.gauge}>
      <div className={styles.head}>
        <span id={id} className={styles.label}>{label}</span>
        <Figure size="sm" value={value} decimals={places(value)} unit={unit} unitLabel={unitLabel} tone="primary" />
      </div>
      <div role="meter" aria-labelledby={id} aria-valuemin={min} aria-valuemax={max} aria-valuenow={clamped} aria-valuetext={[formatFigure(value, { decimals: places(value) }), spoken].filter((part) => part !== undefined && part !== '').join(' ')} className={styles.track}>
        {percent > 0 ? <div className={[styles.fill, styles[tone]].join(' ')} style={{ width: `${percent}%` }} /> : <div className={styles.none} />}
      </div>
    </div>
  );
}
