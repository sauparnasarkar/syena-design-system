import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** The id of the selected tab. */
  activeId: string;
  onChange: (id: string) => void;
  /** `underline` is a row with a bar under the selected tab; `segmented` is a boxed set. */
  variant?: 'underline' | 'segmented';
  size?: 'default' | 'small';
  /** The accessible name of the tab list. */
  label: string;
  /** Makes the ids unique when a page holds several sets of tabs. Defaults to a generated one. */
  idPrefix?: string;
}

/** The id of a tab, for the panel's `aria-labelledby`. */
export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
/** The id a panel takes, so the tab's `aria-controls` finds it. */
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/** Switches between views of one subject on one page. The consumer renders each panel with `role="tabpanel"`, `id={panelId(...)}` and `aria-labelledby={tabId(...)}`. */
export function Tabs({ items, activeId, onChange, variant = 'underline', size = 'default', label, idPrefix }: TabsProps) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const enabled = items.filter((item) => !item.disabled);
  // One tab stop: the selected tab, or the first available one when the selection is not among the items.
  const stop = enabled.some((item) => item.id === activeId) ? activeId : enabled[0]?.id;

  // A list wider than its container scrolls; the selected tab stays in view.
  useEffect(() => {
    refs.current.get(activeId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  const move = (from: string, step: number | 'first' | 'last') => {
    const at = enabled.findIndex((item) => item.id === from);
    if (!enabled.length) return;
    const target = step === 'first' ? 0 : step === 'last' ? enabled.length - 1 : (at + step + enabled.length) % enabled.length;
    refs.current.get(enabled[target].id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const key = event.key;
    if (key === 'ArrowRight') move(id, 1);
    else if (key === 'ArrowLeft') move(id, -1);
    else if (key === 'Home') move(id, 'first');
    else if (key === 'End') move(id, 'last');
    else return;
    event.preventDefault();
  };

  return (
    <div role="tablist" aria-label={label} className={[styles.list, styles[variant], size === 'small' ? styles.small : ''].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <button
          key={item.id}
          ref={(node) => { if (node) refs.current.set(item.id, node); else refs.current.delete(item.id); }}
          type="button"
          role="tab"
          id={tabId(prefix, item.id)}
          aria-selected={item.id === activeId}
          aria-controls={panelId(prefix, item.id)}
          tabIndex={item.id === stop ? 0 : -1}
          disabled={item.disabled}
          className={styles.tab}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => onKeyDown(event, item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
