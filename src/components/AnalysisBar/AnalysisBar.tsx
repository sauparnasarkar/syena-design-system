import type { ReactNode } from 'react';
import { MenuPlacement } from '../SelectBase/menuPlacement';
import { useShell } from '../AppShell/ShellContext';
import styles from './AnalysisBar.module.css';

export interface AnalysisBarProps {
  /** The view title. It is the page heading, unless the shell is compact (then the top bar holds the heading). */
  title: string;
  /** One sentence saying what question the view answers. */
  purpose?: string;
  /** The controls that set context for every module: geography, period, metric, scenario. */
  children?: ReactNode;
  /** The heading of the controls sheet at compact widths, where the top bar already holds the page title. */
  sheetTitle?: string;
}

export function AnalysisBar({ title, purpose, children, sheetTitle = 'Filters' }: AnalysisBarProps) {
  const shell = useShell();
  const compact = shell?.compact ?? false;
  // At compact widths the page title is in the top bar; the sheet names itself, so the title is not shown twice.
  return (
    <section aria-label="Analysis controls" className={[styles.bar, compact ? styles.sheet : ''].join(' ')} data-syn-sticky={compact ? undefined : 'top'}>
      <div className={styles.titleRow}>
        {compact ? <h2 className={styles.title}>{sheetTitle}</h2> : <h1 className={styles.title}>{title}</h1>}
        {purpose ? <p className={styles.purpose}>{purpose}</p> : null}
      </div>
      {children ? <div className={styles.controls}><MenuPlacement.Provider value={compact ? 'inline' : 'floating'}>{children}</MenuPlacement.Provider></div> : null}
    </section>
  );
}
