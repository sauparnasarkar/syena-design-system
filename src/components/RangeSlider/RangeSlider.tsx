import { useId } from 'react';
import controls from '../controls.module.css';
import styles from './RangeSlider.module.css';

export interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  /** The span: `[from, to]`. */
  value: [number, number];
  onChange: (value: [number, number]) => void;
  /** Names of the two thumbs, for example `['From year', 'To year']`. */
  thumbLabels?: [string, string];
  unit?: string;
  disabled?: boolean;
}

const percent = (value: number, min: number, max: number) => ((value - min) / (max - min)) * 100;

/** Choose a span with two thumbs that cannot cross. Two native range inputs share one track. */
export function RangeSlider({ label, min, max, step = 1, value, onChange, thumbLabels = ['From', 'To'], unit, disabled }: RangeSliderProps) {
  const group = useId();
  const [from, to] = value;
  const a = percent(from, min, max);
  const b = percent(to, min, max);
  const text = (v: number) => (unit ? `${v} ${unit}` : String(v));
  // When both thumbs sit at the top, the lower one must stay reachable.
  const lowerOnTop = from >= max - step;
  return (
    <div role="group" aria-labelledby={`${group}-label`} className={controls.field}>
      <div className={styles.head}>
        <span id={`${group}-label`} className={controls.label}>{label}</span>
        <span className={styles.value}>{text(from)} to {text(to)}</span>
      </div>
      <div className={styles.track} style={{ background: `linear-gradient(to right, var(--syn-color-border-default) ${a}%, var(--syn-color-accent-fill) ${a}%, var(--syn-color-accent-fill) ${b}%, var(--syn-color-border-default) ${b}%)` }}>
        <input type="range" className={styles.input} style={{ zIndex: lowerOnTop ? 'var(--syn-layer-sticky)' : undefined }} min={min} max={max} step={step} value={from} disabled={disabled} aria-label={thumbLabels[0]} aria-valuetext={text(from)} onChange={(e) => onChange([Math.min(Number(e.target.value), to), to])} />
        <input type="range" className={styles.input} min={min} max={max} step={step} value={to} disabled={disabled} aria-label={thumbLabels[1]} aria-valuetext={text(to)} onChange={(e) => onChange([from, Math.max(Number(e.target.value), from)])} />
      </div>
      <div className={styles.range} aria-hidden="true"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}
