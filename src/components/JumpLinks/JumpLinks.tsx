import type { MouseEvent } from 'react';
import { scrollToJumpTarget } from '../../lib/scrollToJumpTarget';
import styles from './JumpLinks.module.css';

export interface JumpLinkItem {
  id: string;
  label: string;
  /** Runs before the jump, for example to open the panel the target is in. The jump waits for it, then for the page to settle. */
  onBeforeJump?: () => void | Promise<void>;
  /** Marks a section that sits next to the top of the page: if it is already fully in view the page does not scroll (focus still moves). The first item always behaves this way. */
  topSection?: boolean;
}

export interface JumpLinksProps {
  items: JumpLinkItem[];
  /** The id of the section currently in view. */
  activeId?: string;
  onSelect?: (id: string) => void;
}

/** In-page navigation between the sections of a long view. Choosing one scrolls to it, moves focus there and puts its id in the address (`#id`). */
export function JumpLinks({ items, activeId, onSelect }: JumpLinksProps) {
  const go = (item: JumpLinkItem, index: number) => async (event: MouseEvent) => {
    event.preventDefault();
    if (item.onBeforeJump) {
      await item.onBeforeJump();
      // The change it made (a panel opening) needs a frame or two to lay out before the target's position is known.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    const found = scrollToJumpTarget(item.id, { skipIfVisible: index === 0 || !!item.topSection });
    // The click is handled here, so the browser does not follow the link: write the section into the address ourselves, so the URL can be copied, shared and
    // reloaded to the same place. Replaced, not pushed (Back would otherwise step through sections without scrolling), and the router's history state is kept.
    if (found) window.history.replaceState(window.history.state, '', `#${item.id}`);
    onSelect?.(item.id);
  };
  return (
    <nav aria-label="On this page" className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={styles.link} aria-current={item.id === activeId ? 'location' : undefined} onClick={go(item, index)}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
