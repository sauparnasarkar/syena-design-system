import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import styles from './SourceStrip.module.css';

export interface SourceStripProps {
  /** One line: source names, the period shown and the as-of date. */
  summary: string;
  /** The shortened line shown at compact widths. */
  compactSummary?: string;
  /** Sources: name, publisher, licence, release date, link. */
  sources?: ReactNode;
  /** Definitions: metric, unit, baseline, adjustments. */
  definitions?: ReactNode;
  /** Method notes: how projections and ranges are produced. */
  methodNotes?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** The source and methodology strip: always visible, with a disclosure for the detail. */
export function SourceStrip({ summary, compactSummary = 'Sources', sources, definitions, methodNotes, open, defaultOpen = false, onOpenChange }: SourceStripProps) {
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const compact = useIsMobile();
  const panel = useId();
  const set = (next: boolean) => { setOwn(next); onOpenChange?.(next); };
  const strip = useRef<HTMLElement>(null);
  const close = useRef(set);
  useEffect(() => { close.current = set; });
  // Escape closes the panel while focus is inside the strip.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && strip.current?.contains(document.activeElement)) close.current(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);
  return (
    <aside ref={strip} aria-label="Sources and methodology" className={styles.strip} data-syn-sticky="bottom">
      {isOpen ? (
        <div id={panel} className={styles.panel}>
          <section className={styles.column}><h2 className={styles.heading}>Sources</h2>{sources}</section>
          <section className={styles.column}><h2 className={styles.heading}>Definitions</h2>{definitions}</section>
          <section className={styles.column}><h2 className={styles.heading}>Method notes</h2>{methodNotes}</section>
        </div>
      ) : null}
      <div className={styles.line}>
        <span className={styles.text}>{compact ? compactSummary : summary}</span>
        <button type="button" className={styles.button} aria-expanded={isOpen} aria-controls={isOpen ? panel : undefined} onClick={() => set(!isOpen)}>
          Methodology
        </button>
      </div>
    </aside>
  );
}
