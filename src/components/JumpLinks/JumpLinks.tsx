import type { MouseEvent } from 'react';
import { scrollToJumpTarget } from '../../lib/scrollToJumpTarget';
import styles from './JumpLinks.module.css';

export interface JumpLinkItem {
  id: string;
  label: string;
}

export interface JumpLinksProps {
  items: JumpLinkItem[];
  /** The id of the section currently in view. */
  activeId?: string;
  onSelect?: (id: string) => void;
}

/** In-page navigation between the sections of a long view. */
export function JumpLinks({ items, activeId, onSelect }: JumpLinksProps) {
  const go = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    scrollToJumpTarget(id);
    onSelect?.(id);
  };
  return (
    <nav aria-label="On this page" className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={styles.link} aria-current={item.id === activeId ? 'location' : undefined} onClick={go(item.id)}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
