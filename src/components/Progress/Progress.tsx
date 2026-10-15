import { useId } from 'react';
import { Figure } from '../Figure/Figure';
import styles from './Progress.module.css';

export interface ProgressProps {
  /** How far along, from 0 to `max`. */
  value: number;
  /** The value that means complete. Defaults to 100, so `value` reads as a percentage. */
  max?: number;
  label: string;
  /** Print the value as a percentage beside the label. */
  showValue?: boolean;
}

/** Determinate progress. */
export function Progress({ value, max = 100, label, showValue = true }: ProgressProps) {
  const id = useId();
  const clamped = Math.min(max, Math.max(0, value));
  const percent = (clamped / max) * 100;
  return (
    <div className={styles.progress}>
      <div className={styles.head}>
        <span id={id} className={styles.label}>{label}</span>
        {showValue ? <Figure size="sm" value={Math.round(percent)} unit="%" tone="primary" /> : null}
      </div>
      <div role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={max} aria-valuenow={clamped} aria-valuetext={`${Math.round(percent)} percent`} className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
