import { Button } from '../Button/Button';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** The current page, counted from 1. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** How many numbered buttons show each side of the current page. */
  siblingCount?: number;
  /** Only previous and next, with "Page X of Y". */
  compact?: boolean;
  /** The accessible name of the navigation. */
  label?: string;
}

type Slot = number | 'gap-start' | 'gap-end';

/** The numbers to show: the first and last page, the current page with its siblings, and a gap where pages are left out. */
export function pageSlots(page: number, pageCount: number, siblingCount: number): Slot[] {
  const window = siblingCount * 2 + 5; // first, last, current, siblings and two gaps
  if (pageCount <= window) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const left = Math.max(page - siblingCount, 1);
  const right = Math.min(page + siblingCount, pageCount);
  const showStartGap = left > 3;
  const showEndGap = right < pageCount - 2;
  const edge = siblingCount * 2 + 3; // numbered buttons kept at the end that has no gap
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (!showStartGap && showEndGap) return [...range(1, edge), 'gap-end', pageCount];
  if (showStartGap && !showEndGap) return [1, 'gap-start', ...range(pageCount - edge + 1, pageCount)];
  return [1, 'gap-start', ...range(left, right), 'gap-end', pageCount];
}

/** Pages through a long list. An end that cannot move is `aria-disabled`, so it stays focusable; activating it does nothing. */
export function Pagination({ page, pageCount, onChange, siblingCount = 1, compact = false, label = 'Pagination' }: PaginationProps) {
  const current = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
  const atStart = current <= 1;
  const atEnd = current >= pageCount;
  const go = (next: number, blocked: boolean) => () => { if (!blocked) onChange(next); };
  const edgeButton = (name: string, icon: 'previous' | 'next', blocked: boolean, next: number) => (
    <Button variant="secondary" icon={icon} aria-label={name} aria-disabled={blocked || undefined} onClick={go(next, blocked)} />
  );
  return (
    <nav aria-label={label} className={styles.nav}>
      {edgeButton('Previous page', 'previous', atStart, current - 1)}
      {compact ? (
        <span className={styles.status} aria-live="polite">Page {current} of {pageCount}</span>
      ) : (
        <ol className={styles.pages}>
          {pageSlots(current, pageCount, siblingCount).map((slot) => (typeof slot === 'number' ? (
            <li key={slot}>
              <button type="button" className={styles.page} aria-label={`Page ${slot}`} aria-current={slot === current ? 'page' : undefined} onClick={go(slot, slot === current)}>{slot}</button>
            </li>
          ) : (
            <li key={slot} className={styles.gap} aria-hidden="true">…</li>
          )))}
        </ol>
      )}
      {edgeButton('Next page', 'next', atEnd, current + 1)}
    </nav>
  );
}
