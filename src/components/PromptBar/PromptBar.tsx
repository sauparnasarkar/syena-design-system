import { useId, useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Button } from '../Button/Button';
import controls from '../controls.module.css';
import styles from './PromptBar.module.css';

export interface PromptBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Called when the stop control is used while loading. */
  onStop?: () => void;
  /** `default` is a raised card; `plain` drops the card for use on an empty page. */
  variant?: 'default' | 'plain';
  /** Sticks the bar to the bottom of the canvas, above the source strip. */
  pinned?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Names the field; required because the field has no visible label. */
  ariaLabel: string;
  placeholder?: string;
  /** Help text under the field, associated with it. */
  hint?: ReactNode;
  /** A slot above the field, for suggestions. */
  aboveContent?: ReactNode;
  /** A slot below the hint. */
  belowContent?: ReactNode;
  /** The textarea, for focusing it. */
  ref?: Ref<HTMLTextAreaElement>;
}

/** The longest the field grows, in lines. */
export const MAX_LINES = 6;

/** Free-text question entry. Enter submits; Shift+Enter inserts a line break. */
export function PromptBar({ value, onChange, onSubmit, onStop, variant = 'default', pinned, loading, disabled, ariaLabel, placeholder, hint, aboveContent, belowContent, ref }: PromptBarProps) {
  const own = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  useImperativeHandle(ref, () => own.current as HTMLTextAreaElement);

  // Grow with the content up to the limit set in CSS (max-height), then scroll.
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const submit = () => { if (!loading && !disabled && value.trim()) onSubmit(value); };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); }
  };

  return (
    <div className={[styles.bar, variant === 'default' ? styles.card : '', pinned ? styles.pinned : ''].filter(Boolean).join(' ')} {...(pinned ? { 'data-syn-sticky': 'bottom' } : {})}>
      {aboveContent ? <div className={styles.above}>{aboveContent}</div> : null}
      <div className={styles.row}>
        <textarea
          ref={own}
          className={styles.field}
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {loading ? (
          <Button variant="primary" icon="stop" aria-label="Stop answering" onClick={onStop} />
        ) : (
          <Button variant="primary" icon="send" aria-label="Send question" disabled={disabled || !value.trim()} onClick={submit} />
        )}
      </div>
      {hint ? <p id={hintId} className={styles.hint}>{hint}</p> : null}
      {belowContent}
      <span className={controls.srOnly} role="status" aria-live="polite">{loading ? 'Answering' : ''}</span>
    </div>
  );
}
