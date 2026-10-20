/* The WAI-ARIA listbox pattern: the list holds focus and handles the keys (arrows, Enter, type-ahead) on behalf of
   its options through aria-activedescendant, so the options carry roles and a click handler but no key handlers. */
/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events */
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { rootPx, scale } from '../../generated/tokens';
import { Icon } from '../Icon/Icon';
import controls from '../controls.module.css';
import { MenuPlacement } from './menuPlacement';
import styles from './SelectBase.module.css';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Common {
  label?: string;
  ariaLabel?: string;
  options: Option[];
  size?: 'default' | 'small';
  /** Hides the search field, which otherwise shows once there are at least as many options as the search threshold. */
  suppressSearch?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** A message shown when the choice is invalid. */
  error?: string;
  id?: string;
}

export type SelectBaseProps =
  | (Common & { multiple?: false; value: string; onChange: (value: string) => void; maxSelected?: undefined })
  | (Common & { multiple: true; value: string[]; onChange: (value: string[]) => void; maxSelected?: number });

const px = (rem: string) => Math.round(parseFloat(rem) * rootPx);
/** Options at or above which a search field is offered: the size of space step 3. */
export const searchThreshold = px(scale.space['3']);
/** How long typed characters keep building one search string: five fast transitions. */
const typeAheadMs = 5 * parseFloat(scale.motion.fast);

export function SelectBase(props: SelectBaseProps) {
  const { label, ariaLabel, options, size = 'default', suppressSearch, disabled, placeholder = 'Select', error, id } = props;
  const multiple = props.multiple === true;
  const selected: string[] = multiple ? props.value : props.value ? [props.value] : [];
  const generated = useId();
  const base = id ?? generated;
  const ids = { label: `${base}-label`, value: `${base}-value`, list: `${base}-list`, error: `${base}-error`, option: (v: string) => `${base}-option-${v}` };

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const popup = useRef<HTMLDivElement>(null);
  const inline = useContext(MenuPlacement) === 'inline';

  const searchable = !suppressSearch && options.length >= searchThreshold;
  const visible = useMemo(() => (query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options), [options, query]);
  const atLimit = multiple && props.maxSelected != null && selected.length >= props.maxSelected;
  const isDisabled = (o: Option) => !!o.disabled || (atLimit && !selected.includes(o.value));
  const enabled = visible.filter((o) => !isDisabled(o));

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    setQuery('');
    if (returnFocus) trigger.current?.focus();
  }, []);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setActive(selected[0] ?? options.find((o) => !o.disabled)?.value ?? null);
  };

  useEffect(() => {
    if (!open) return undefined;
    (search.current ?? list.current)?.focus();
    // An inline list opens in the flow, which may be below the fold of a scrolling panel: bring it into view.
    if (inline) popup.current?.scrollIntoView({ block: 'nearest' });
    const onDown = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, close, inline]);

  const choose = (option: Option) => {
    if (isDisabled(option)) return;
    if (props.multiple) {
      props.onChange(selected.includes(option.value) ? selected.filter((v) => v !== option.value) : [...selected, option.value]);
    } else {
      props.onChange(option.value);
      close(true);
    }
  };

  const move = (to: number) => {
    if (!enabled.length) return;
    const clamped = Math.max(0, Math.min(enabled.length - 1, to));
    setActive(enabled[clamped].value);
    document.getElementById(ids.option(enabled[clamped].value))?.scrollIntoView({ block: 'nearest' });
  };
  const index = enabled.findIndex((o) => o.value === active);

  const onListKey = (event: KeyboardEvent) => {
    const inSearch = event.target === search.current;
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); move(index < 0 ? 0 : index + 1); break;
      case 'ArrowUp': event.preventDefault(); move(index < 0 ? enabled.length - 1 : index - 1); break;
      case 'Home': if (!inSearch) { event.preventDefault(); move(0); } break;
      case 'End': if (!inSearch) { event.preventDefault(); move(enabled.length - 1); } break;
      case 'Enter': event.preventDefault(); { const option = enabled[index]; if (option) choose(option); } break;
      case ' ': if (!inSearch) { event.preventDefault(); const option = enabled[index]; if (option) choose(option); } break;
      // Only the list closes: the Escape is not passed on to a sheet or dialog around the field, which would close with it.
      case 'Escape': event.preventDefault(); event.stopPropagation(); close(true); break;
      case 'Tab': close(false); break;
      default:
        // Type-ahead on the list: characters typed in quick succession search by the start of a label.
        if (!inSearch && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          const now = event.timeStamp;
          typed.current = { text: (now - typed.current.at > typeAheadMs ? '' : typed.current.text) + event.key.toLowerCase(), at: now };
          const from = Math.max(0, index);
          const ordered = [...enabled.slice(from + (typed.current.text.length === 1 ? 1 : 0)), ...enabled.slice(0, from + 1)];
          const hit = ordered.find((o) => o.label.toLowerCase().startsWith(typed.current.text));
          if (hit) move(enabled.indexOf(hit));
        }
    }
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); if (!open) openList(); }
  };

  // The count, with the limit worded so it is not read as a position in the list.
  const summary = multiple && props.maxSelected != null
    ? `${selected.length} selected${atLimit ? ', limit reached' : `, up to ${props.maxSelected}`}`
    : `${selected.length} selected`;

  const chosen = options.filter((o) => selected.includes(o.value));
  const text = chosen.length === 0 ? placeholder : chosen.length <= 2 || !multiple ? chosen.map((o) => o.label).join(', ') : `${chosen[0].label} and ${chosen.length - 1} more`;

  return (
    <div ref={root} className={[controls.field, styles.root].join(' ')}>
      {label ? <span id={ids.label} className={controls.label}>{label}</span> : null}
      <button
        ref={trigger}
        type="button"
        role="combobox"
        className={[controls.box, styles.trigger, size === 'small' ? controls.small : '', error ? controls.error : ''].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? ids.list : undefined}
        aria-labelledby={label ? `${ids.label} ${ids.value}` : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? ids.error : undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onTriggerKey}
      >
        <span id={ids.value} className={[styles.value, chosen.length ? '' : styles.placeholder].join(' ')}>{text}</span>
        <Icon name="chevron" size="small" className={open ? styles.flipped : undefined} />
      </button>
      {open ? (
        <div ref={popup} className={[styles.popup, inline ? styles.inline : ''].join(' ')}>
          {searchable ? (
            <div className={styles.search}>
              <Icon name="search" size="small" />
              <input ref={search} type="search" className={styles.searchInput} aria-label="Search options" aria-controls={ids.list} aria-activedescendant={active ? ids.option(active) : undefined} value={query} onChange={(e) => { setQuery(e.target.value); setActive(null); }} onKeyDown={onListKey} />
            </div>
          ) : null}
          <ul ref={list} id={ids.list} role="listbox" tabIndex={-1} aria-multiselectable={multiple || undefined} aria-label={label ?? ariaLabel} aria-activedescendant={active ? ids.option(active) : undefined} className={styles.list} onKeyDown={onListKey}>
            {visible.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <li
                  key={option.value}
                  id={ids.option(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled(option) || undefined}
                  className={[styles.option, option.value === active ? styles.active : '', isDisabled(option) ? styles.optionDisabled : ''].join(' ')}
                  onClick={() => choose(option)}
                  onMouseMove={() => !isDisabled(option) && setActive(option.value)}
                >
                  {multiple ? <span className={[styles.box, isSelected ? styles.boxChecked : ''].join(' ')} aria-hidden="true">{isSelected ? <Icon name="check" size="small" /> : null}</span> : null}
                  <span className={styles.optionLabel}>{option.label}</span>
                  {!multiple && isSelected ? <Icon name="check" size="small" /> : null}
                </li>
              );
            })}
            {visible.length === 0 ? <li className={styles.empty} role="presentation">No options match.</li> : null}
          </ul>
          {multiple ? (
            <div className={styles.footer}>
              <span>{summary}</span>
              <button type="button" className={styles.clear} disabled={selected.length === 0} onClick={() => props.onChange([])}>Clear</button>
            </div>
          ) : null}
        </div>
      ) : null}
      {multiple ? <span className={controls.srOnly} role="status" aria-live="polite">{summary}</span> : null}
      {error ? <span id={ids.error} className={controls.message}><Icon name="warning" size="small" />{error}</span> : null}
    </div>
  );
}
