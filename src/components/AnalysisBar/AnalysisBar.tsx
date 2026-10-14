import type { ReactNode } from 'react';
import { useShell } from '../AppShell/ShellContext';
import styles from './AnalysisBar.module.css';

export interface AnalysisBarProps {
  /** The view title. It is the page heading, unless the shell is compact (then the top bar holds the heading). */
  title: string;
  /** One sentence saying what question the view answers. */
  purpose?: string;
  /** The controls that set context for every module: geography, period, metric, scenario. */
  children?: ReactNode;
}

export function AnalysisBar({ title, purpose, children }: AnalysisBarProps) {
  const shell = useShell();
  const compact = shell?.compact ?? false;
  const Heading = compact ? 'h2' : 'h1';
  return (
    <section aria-label="Analysis controls" className={[styles.bar, compact ? styles.sheet : ''].join(' ')} data-syn-sticky={compact ? undefined : 'top'}>
      <div className={styles.titleRow}>
        <Heading className={styles.title}>{title}</Heading>
        {purpose ? <p className={styles.purpose}>{purpose}</p> : null}
      </div>
      {children ? <div className={styles.controls}>{children}</div> : null}
    </section>
  );
}
