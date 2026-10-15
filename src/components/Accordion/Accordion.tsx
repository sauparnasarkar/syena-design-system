import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Accordion.module.css';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Ids of the open items. Uncontrolled when omitted. */
  openIds?: string[];
  defaultOpenIds?: string[];
  onOpenChange?: (openIds: string[]) => void;
  /** Allow several items open at once. */
  multiple?: boolean;
  /** The heading level of each item's title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** Reveals supporting detail. Header buttons expose their state; arrow keys, Home and End move between headers. */
export function Accordion({ items, openIds, defaultOpenIds = [], onOpenChange, multiple = false, headingLevel = 3 }: AccordionProps) {
  const [own, setOwn] = useState(defaultOpenIds);
  const open = openIds ?? own;
  const base = useId();
  const headers = useRef<Array<HTMLButtonElement | null>>([]);
  const Heading = `h${headingLevel}` as 'h2';

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    const next = isOpen ? open.filter((x) => x !== id) : multiple ? [...open, id] : [id];
    setOwn(next);
    onOpenChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
    const at = enabled.indexOf(index);
    const to = { ArrowDown: enabled[(at + 1) % enabled.length], ArrowUp: enabled[(at - 1 + enabled.length) % enabled.length], Home: enabled[0], End: enabled[enabled.length - 1] }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    headers.current[to]?.focus();
  };

  return (
    <div className={styles.accordion}>
      {items.map((item, index) => {
        const isOpen = open.includes(item.id);
        const header = `${base}-${item.id}-header`;
        const panel = `${base}-${item.id}-panel`;
        return (
          <div key={item.id} className={styles.item}>
            <Heading className={styles.heading}>
              <button
                ref={(el) => { headers.current[index] = el; }}
                id={header}
                type="button"
                className={styles.header}
                aria-expanded={isOpen}
                aria-controls={panel}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
              >
                <span>{item.title}</span>
                <Icon name="chevron" size="small" className={isOpen ? styles.turned : undefined} />
              </button>
            </Heading>
            <div className={[styles.wrap, isOpen ? styles.wrapOpen : ''].join(' ')}>
              <div id={panel} role="region" aria-labelledby={header} className={styles.panel}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
