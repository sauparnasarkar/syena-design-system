import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** What is loading. Spoken, and shown beside the ring when motion is reduced or `showLabel` is set. */
  label?: string;
  showLabel?: boolean;
}

/** Indeterminate loading. Under reduced motion the ring stays still and the label is shown. */
export function Spinner({ label = 'Loading', showLabel = false }: SpinnerProps) {
  const reduced = useReducedMotion();
  const visible = showLabel || reduced;
  return (
    <span role="status" className={styles.spinner}>
      <span className={styles.ring} aria-hidden="true" />
      <span className={visible ? styles.label : styles.hidden}>{label}</span>
    </span>
  );
}
