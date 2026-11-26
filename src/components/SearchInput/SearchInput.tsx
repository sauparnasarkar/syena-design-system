import { useRef, type KeyboardEvent } from 'react';
import { Icon } from '../Icon/Icon';
import controls from '../controls.module.css';
import styles from './SearchInput.module.css';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called by the clear button and by Escape. Without it, clearing calls `onChange('')`. */
  onClear?: () => void;
  placeholder?: string;
  size?: 'default' | 'small';
  /** The field's accessible name. Required: a placeholder is not a name. */
  label: string;
  disabled?: boolean;
}

/** A text field that filters a list on the page. */
export function SearchInput({ value, onChange, onClear, placeholder, size = 'default', label, disabled = false }: SearchInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const clear = () => {
    if (onClear) onClear(); else onChange('');
    input.current?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value) { event.stopPropagation(); clear(); }
  };
  return (
    <div className={[controls.box, size === 'small' ? controls.small : '', styles.field, disabled ? styles.disabled : ''].filter(Boolean).join(' ')}>
      <Icon name="search" size={size === 'small' ? 'small' : 'medium'} />
      <input ref={input} type="search" className={styles.input} aria-label={label} placeholder={placeholder} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} />
      {value && !disabled ? (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={clear}>
          <Icon name="close" size="small" />
        </button>
      ) : null}
    </div>
  );
}
