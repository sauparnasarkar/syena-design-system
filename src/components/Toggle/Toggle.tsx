import { useId } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Toggle.module.css';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The setting's name. Required. */
  label: string;
  /** A line under the label that says what the setting does. */
  description?: string;
  size?: 'default' | 'small';
  disabled?: boolean;
}

/** An on and off setting that takes effect at once. */
export function Toggle({ checked, onChange, label, description, size = 'default', disabled = false }: ToggleProps) {
  const descriptionId = useId();
  return (
    <label className={[styles.toggle, size === 'small' ? styles.small : '', disabled ? styles.disabled : ''].filter(Boolean).join(' ')}>
      <input type="checkbox" role="switch" aria-checked={checked} className={styles.input} checked={checked} disabled={disabled} aria-describedby={description ? descriptionId : undefined} onChange={(event) => onChange(event.target.checked)} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb}>{checked ? <Icon name="check" size={size === 'small' ? 'small' : 'medium'} /> : null}</span>
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? <span id={descriptionId} className={styles.description}>{description}</span> : null}
      </span>
    </label>
  );
}
