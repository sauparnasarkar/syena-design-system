import { useId, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { CardHeader } from '../CardHeader/CardHeader';
import { InlineAlert } from '../InlineAlert/InlineAlert';
import styles from './ChartCard.module.css';

export type ChartCardState = 'ready' | 'loading' | 'empty' | 'error';

export interface ChartCardProps {
  title: string;
  supportText?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** The source, written out. A chart card without a source is not valid. */
  source: string;
  /** When the data was last updated, for example "October 2026". */
  asOf?: string;
  /** The data is older than its stated update interval: the as-of date says so. */
  stale?: boolean;
  /** Extra controls in the header, after the built-in ones. */
  actions?: ReactNode;
  /** The values behind the chart, shown in place of it by "View as table". Pass a `Table`. */
  tableView?: ReactNode;
  /** Adds an expand control that opens the card across the canvas. */
  expandable?: boolean;
  state?: ChartCardState;
  /** Shown when `state` is `empty`: why there is nothing to show and what to change. */
  emptyMessage?: string;
  /** Shown when `state` is `error`. */
  errorMessage?: string;
  onRetry?: () => void;
  id?: string;
  className?: string;
  /** The `Chart`, or a function that returns it and is told whether the card is expanded (to give an expanded chart more height). */
  children: ReactNode | ((expanded: boolean) => ReactNode);
}

function Frame({ expanded, onClose, label, children }: { expanded: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, expanded, onClose);
  // The same elements are kept whether or not the card is expanded, so focus stays on the control that was used.
  return (
    <div className={expanded ? styles.overlay : undefined}>
      {expanded ? <div className={styles.scrim} onClick={onClose} aria-hidden="true" /> : null}
      <div ref={panel} {...(expanded ? { role: 'dialog', 'aria-modal': true, 'aria-label': label, tabIndex: -1 } : {})} className={expanded ? styles.dialog : undefined}>{children}</div>
    </div>
  );
}

/** A card that frames a chart: header, a dark data panel, a footer with the source and the as-of date. */
export function ChartCard({ title, supportText, headingLevel = 3, source, asOf, stale, actions, tableView, expandable, state = 'ready', emptyMessage = 'Nothing to show for this selection.', errorMessage = 'The chart could not be loaded.', onRetry, id, className, children }: ChartCardProps) {
  const [table, setTable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const footerId = useId();
  const header = (
    <CardHeader
      title={title}
      supportText={supportText}
      headingLevel={headingLevel}
      actions={
        <>
          {tableView ? <Button size="small" variant="ghost" icon="table" aria-label={`View ${title} as a table`} aria-pressed={table} onClick={() => setTable((v) => !v)} /> : null}
          {expandable ? <Button size="small" variant="ghost" icon={expanded ? 'close' : 'filters'} aria-label={expanded ? `Close expanded ${title}` : `Expand ${title}`} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} /> : null}
          {actions}
        </>
      }
    />
  );
  const body = (
    <>
      {state === 'loading' ? <div className={styles.panel} role="status" aria-busy="true" aria-label={`Loading ${title}`}><div className={styles.skeleton}>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={styles.bar} style={{ height: `${30 + i * 12}%` }} />)}</div></div> : null}
      {state === 'empty' ? <div className={styles.panel}><p className={styles.message}>{emptyMessage}</p></div> : null}
      {state === 'error' ? <div className={styles.panel}><InlineAlert variant="error" title="Error" onDismiss={undefined}>{errorMessage}</InlineAlert>{onRetry ? <div className={styles.retry}><Button size="small" onClick={onRetry}>Try again</Button></div> : null}</div> : null}
      {state === 'ready' ? (table && tableView ? <div className={styles.tableView}>{tableView}</div> : <div className={styles.panel}>{typeof children === 'function' ? children(expanded) : children}</div>) : null}
    </>
  );
  return (
    <Frame expanded={expanded} onClose={() => setExpanded(false)} label={title}>
      <Card as="section" aria-label={title} aria-describedby={footerId} id={id} className={[styles.card, className ?? ''].filter(Boolean).join(' ')} header={header}>
        {body}
        <p id={footerId} className={styles.footer}>
          <span>Source: {source}</span>
          {asOf ? <span className={stale ? styles.stale : undefined}> · As of {asOf}{stale ? ' (stale)' : ''}</span> : null}
        </p>
      </Card>
    </Frame>
  );
}
