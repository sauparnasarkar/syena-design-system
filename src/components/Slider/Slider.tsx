import { useId, type KeyboardEvent } from 'react';
import { Figure } from '../Figure/Figure';
import controls from '../controls.module.css';
import styles from './Slider.module.css';

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Show the current value beside the label. */
  showValue?: boolean;
  showRangeLabels?: boolean;
  /** Show a bubble with the value above the thumb. */
  showThumbValue?: boolean;
  /** Written after the value and spoken with it ("2050 years"); also in the value text. */
  unit?: string;
  /** How the value is written; plain digits by default, so a year is not grouped as 2,000. */
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

const percent = (value: number, min: number, max: number) => ((value - min) / (max - min)) * 100;
/** Page keys jump by this many steps. */
export const PAGE_STEPS = 10;

export function Slider({ label, min, max, step = 1, value, onChange, showValue, showRangeLabels, showThumbValue, unit, formatValue = String, disabled }: SliderProps) {
  const id = useId();
  const fill = percent(value, min, max);
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
    event.preventDefault();
    const next = value + (event.key === 'PageUp' ? 1 : -1) * PAGE_STEPS * step;
    onChange(Math.min(max, Math.max(min, next)));
  };
  return (
    <div className={controls.field}>
      <div className={styles.head}>
        <label htmlFor={id} className={controls.label}>{label}</label>
        {showValue ? <Figure size="sm" value={formatValue(value)} unit={unit} tone="primary" /> : null}
      </div>
      <div className={styles.track}>
        <input
          id={id}
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={unit ? `${formatValue(value)} ${unit}` : formatValue(value)}
          style={{ background: `linear-gradient(to right, var(--syn-color-accent-fill) ${fill}%, var(--syn-color-border-default) ${fill}%)` }}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={onKeyDown}
        />
        {showThumbValue ? <span className={styles.bubble} style={{ insetInlineStart: `${fill}%`, transform: `translateX(-${fill}%)` }} aria-hidden="true">{formatValue(value)}</span> : null}
      </div>
      {showRangeLabels ? (
        <div className={styles.range} aria-hidden="true"><span>{min}</span><span>{max}</span></div>
      ) : null}
    </div>
  );
}
