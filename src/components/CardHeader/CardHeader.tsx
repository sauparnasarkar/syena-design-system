import type { ReactNode } from 'react';
import styles from './CardHeader.module.css';

export interface CardHeaderProps {
  title: string;
  /** One line of context under the title. */
  supportText?: string;
  /** The heading level of the title, so the page outline stays correct. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Controls at the end: download, view as table, expand. */
  actions?: ReactNode;
  /** A hairline under the header. */
  divider?: boolean;
}

export function CardHeader({ title, supportText, headingLevel = 3, actions, divider }: CardHeaderProps) {
  const Heading = `h${headingLevel}` as 'h2';
  return (
    <div className={[styles.header, divider ? styles.divider : ''].filter(Boolean).join(' ')}>
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        {supportText ? <p className={styles.support}>{supportText}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
