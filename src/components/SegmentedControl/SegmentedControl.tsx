import { useId } from 'react';
import controls from '../controls.module.css';
import styles from './SegmentedControl.module.css';

export interface SegmentedItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items: SegmentedItem[];
  value: string;
  onChange: (value: string) => void;
  /** Names the radio group; generated when omitted. */
  name?: string;
  /** The visible label above the control. Without it, `ariaLabel` names the group. */
  label?: string;
  ariaLabel?: string;
  size?: 'default' | 'small';
}

/** Switches between mutually exclusive views of the same data. Native radios give one tab stop and arrow-key selection. */
export function SegmentedControl({ items, value, onChange, name, label, ariaLabel, size = 'default' }: SegmentedControlProps) {
  const generated = useId();
  const group = name ?? generated;
  const labelId = `${group}-label`;
  return (
    <div className={controls.field}>
      {label ? <span id={labelId} className={controls.label}>{label}</span> : null}
      <div role="radiogroup" aria-labelledby={label ? labelId : undefined} aria-label={label ? undefined : ariaLabel} className={[styles.group, size === 'small' ? styles.small : ''].join(' ')}>
        {items.map((item) => (
          <label key={item.value} className={styles.option}>
            <input type="radio" className={styles.input} name={group} value={item.value} checked={item.value === value} disabled={item.disabled} onChange={() => onChange(item.value)} />
            <span className={[controls.box, styles.face, size === 'small' ? controls.small : ''].join(' ')}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
