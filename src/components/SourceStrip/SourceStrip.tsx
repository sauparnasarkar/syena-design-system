import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useShell } from '../AppShell/ShellContext';
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

/** How far a phone reader scrolls on, in pixels, before the strip gives way to its tab. */
const tuckAfter = 64;

/**
 * The source and methodology strip: always visible, with a disclosure for the detail. It holds no room in the page: it floats over the
 * bottom edge of the view and, at the end of the page, rests in the canvas's own bottom space, above the footer. On a phone it tucks into
 * a small tab while the page is scrolled, and is back in full at the end of the page or when the tab is pressed.
 */
export function SourceStrip({ summary, compactSummary = 'Sources', sources, definitions, methodNotes, open, defaultOpen = false, onOpenChange }: SourceStripProps) {
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const compact = useIsMobile();
  const phone = useShell()?.compact === true;
  const panel = useId();
  const set = (next: boolean) => { setOwn(next); onOpenChange?.(next); };
  const strip = useRef<HTMLElement>(null);
  const [tucked, setTucked] = useState(false);
  const anchor = useRef(0);
  const close = useRef(set);
  useEffect(() => { close.current = set; });
  // On a phone the strip tucks away once the page has been scrolled on from where it was last shown, unless its panel is open;
  // it comes back at the very end of the page, where it rests above the footer.
  useEffect(() => {
    if (!phone || isOpen) { setTucked(false); return undefined; }
    anchor.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 1) { setTucked(false); anchor.current = y; }
      else if (y < anchor.current) anchor.current = y;
      else if (y - anchor.current > tuckAfter) setTucked(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [phone, isOpen]);
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
    <aside ref={strip} aria-label="Sources and methodology" className={styles.strip}>
      <div className={[styles.body, tucked ? styles.tucked : ''].filter(Boolean).join(' ')} data-syn-sticky="bottom">
      {tucked ? (
        <button type="button" className={styles.tab} aria-label="Show sources and methodology" onClick={() => { anchor.current = window.scrollY; setTucked(false); }}>{compactSummary}</button>
      ) : null}
      {tucked ? null : isOpen ? (
        <div id={panel} className={[styles.panel, phone ? styles.phonePanel : ''].filter(Boolean).join(' ')}>
          <section className={styles.column}><h2 className={styles.heading}>Sources</h2>{sources}</section>
          <section className={styles.column}><h2 className={styles.heading}>Definitions</h2>{definitions}</section>
          <section className={styles.column}><h2 className={styles.heading}>Method notes</h2>{methodNotes}</section>
        </div>
      ) : null}
      {tucked ? null : (
        <div className={[styles.line, phone ? styles.phoneLine : ''].filter(Boolean).join(' ')}>
          <span className={styles.text}>{compact ? compactSummary : summary}</span>
          <button type="button" className={styles.button} aria-expanded={isOpen} aria-controls={isOpen ? panel : undefined} onClick={() => set(!isOpen)}>
            Methodology
          </button>
        </div>
      )}
      </div>
    </aside>
  );
}
