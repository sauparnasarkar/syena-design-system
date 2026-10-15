import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Usually a `CardHeader`. */
  header?: ReactNode;
  /** The hairline boundary. On by default. */
  withBorder?: boolean;
  /** Padding inside the card: spacing steps 3, 4 (default) or 5, or none for content that fills the card. */
  padding?: 'none' | 'compact' | 'default' | 'roomy';
  /** `section` when the card labels a region; give it a heading through `header` or `aria-label`. */
  as?: 'div' | 'section' | 'article';
  children?: ReactNode;
}

const padding = { none: styles.padNone, compact: styles.padCompact, default: styles.padDefault, roomy: styles.padRoomy };

/** A container for a module. Not interactive: use `Tile` for that. */
export function Card({ header, withBorder = true, padding: pad = 'default', as: Element = 'div', className, children, ...rest }: CardProps) {
  const classes = [styles.card, withBorder ? styles.bordered : '', padding[pad], className ?? ''].filter(Boolean).join(' ');
  return (
    <Element className={classes} {...rest}>
      {header}
      {children}
    </Element>
  );
}
