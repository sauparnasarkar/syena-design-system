import type { ReactNode } from 'react';
import { Icon, type IconProps } from '../Icon/Icon';
import styles from './EmptyState.module.css';

export type EmptyTone = 'neutral' | 'caution' | 'negative';

interface Base {
  title: string;
  message?: ReactNode;
  /** A glyph above the title. A `caution` or `negative` state has one by default. */
  icon?: IconProps['name'];
  /** The level of the title, which is a real heading. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** A failed load (`negative`) always offers a way to try again, so its actions are required. */
export type EmptyStateProps = Base & (
  | { tone?: 'neutral' | 'caution'; actions?: ReactNode; afterAction?: undefined }
  | { tone: 'negative'; actions: ReactNode; afterAction?: boolean }
);

const defaultIcon: Record<EmptyTone, IconProps['name'] | undefined> = { neutral: undefined, caution: 'warning', negative: 'error' };

/** Says that a region has nothing to show, and why. */
export function EmptyState({ title, message, icon, headingLevel = 3, tone = 'neutral', actions, afterAction = false }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h3';
  const glyph = icon ?? defaultIcon[tone];
  // A failure that follows the reader's own action is announced at once; anything else is announced politely.
  const role = tone === 'negative' && afterAction ? 'alert' : 'status';
  return (
    <div role={role} className={[styles.empty, styles[tone]].join(' ')}>
      {glyph ? <Icon name={glyph} size="large" className={styles.icon} /> : null}
      <Heading className={styles.title}>{title}</Heading>
      {message ? <p className={styles.message}>{message}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
