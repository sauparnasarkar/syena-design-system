import { useId, type ChangeEventHandler, type ReactNode } from 'react';
import controls from '../controls.module.css';
import styles from './Radio.module.css';

export interface RadioProps {
  name: string;
  label: ReactNode;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  error?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

/** A native radio with a visible label; the label is part of the target. */
export function Radio({ name, label, value, checked, defaultChecked, disabled, error, onChange }: RadioProps) {
  return (
    <label className={[styles.radio, disabled ? styles.disabled : ''].join(' ')}>
      <input type="radio" className={styles.input} name={name} value={value} checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />
      <span className={[styles.mark, error ? styles.error : ''].join(' ')} aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

export interface RadioGroupOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The group's visible name. */
  legend: string;
  name?: string;
  options: RadioGroupOption[];
  value: string;
  onChange: (value: string) => void;
  /** A message shown when the choice is invalid; it names the problem. */
  error?: string;
}

/** A group of radios in a fieldset with a legend. */
export function RadioGroup({ legend, name, options, value, onChange, error }: RadioGroupProps) {
  const generated = useId();
  const group = name ?? generated;
  const message = `${group}-error`;
  return (
    <fieldset className={styles.group} aria-describedby={error ? message : undefined}>
      <legend className={controls.label}>{legend}</legend>
      {options.map((option) => (
        <Radio key={option.value} name={group} value={option.value} label={option.label} disabled={option.disabled} checked={option.value === value} error={!!error} onChange={() => onChange(option.value)} />
      ))}
      {error ? <span id={message} className={controls.message}>{error}</span> : null}
    </fieldset>
  );
}
