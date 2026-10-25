import { useLayoutEffect, useRef, useState } from 'react';
import { formatTick, logPosition, logTicks, type Domain } from './heat';
import styles from './HeatLegend.module.css';

export interface HeatLegendProps {
  /** What the colours measure, with its unit. */
  label: string;
  domain: Domain;
  /** How a tick is written. */
  formatValue?: (value: number) => string;
  noDataLabel?: string;
  /** The name shares a row with the scale instead of sitting above it. */
  inline?: boolean;
  /** For a narrow, short space: the name is kept for a screen reader but not drawn, and `endNote` follows the last tick. */
  dense?: boolean;
  /** Written after the last tick when `dense`, for example the unit and the scale's kind. */
  endNote?: string;
}

/**
 * The heat scale as a bar with a tick at every power of ten, and the no-data swatch beside it. When the bar is too
 * narrow for every label, labels are thinned (every other tick, then every third, …), always keeping both ends; the
 * first label starts at the bar's start and the last ends at its end, so no label runs past the bar.
 */
export function HeatLegend({ label, domain, formatValue = formatTick, noDataLabel = 'No data', inline = false, dense = false, endNote }: HeatLegendProps) {
  const ticks = logTicks(domain);
  const textKey = ticks.map(formatValue).join('|');
  const list = useRef<HTMLUListElement>(null);
  const [kept, setKept] = useState<number[] | null>(null);

  // Every label is laid out (the thinned ones are only hidden from view), so they can be measured; the thinning
  // is the smallest step at which the kept labels do not touch.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return undefined;
    const measure = () => {
      const items = [...el.children] as HTMLElement[];
      const boxes = items.map((li) => li.getBoundingClientRect());
      const gap = parseFloat(getComputedStyle(el).getPropertyValue('column-gap')) || 4;
      for (let s = 1; s < items.length; s += 1) {
        const kept = items.map((_, i) => i).filter((i) => i % s === 0 || i === items.length - 1);
        // With a step above one, where the last label is too near the one before it, that one goes, not the end.
        const clean = s === 1 ? kept : kept.filter((i, k) => !(i !== items.length - 1 && k === kept.length - 2 && boxes[kept[k + 1]].left - boxes[i].right < gap));
        if (clean.every((i, k) => k === 0 || boxes[i].left - boxes[clean[k - 1]].right >= gap)) { setKept(clean); return; }
      }
      setKept([0, items.length - 1]);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [textKey]);

  const last = ticks.length - 1;
  const shown = new Set(kept ?? ticks.map((_, i) => i));
  return (
    <div className={styles.legend}>
      {inline || dense ? null : <span className={styles.label}>{label}, log scale</span>}
      <div className={[styles.row, inline || dense ? styles.rowInline : ''].filter(Boolean).join(' ')}>
        {inline || dense ? <span className={dense ? `${styles.label} ${styles.srOnly}` : styles.label}>{label}, log scale</span> : null}
        <div className={styles.scale}>
          <span className={styles.bar} aria-hidden="true" />
          <ul ref={list} className={styles.ticks}>
            {ticks.map((t, i) => (
              <li
                key={t}
                className={[i === 0 ? styles.first : i === last ? styles.last : '', shown.has(i) ? '' : styles.thinned].join(' ')}
                aria-hidden={shown.has(i) ? undefined : 'true'}
                style={{ insetInlineStart: `${logPosition(t, domain) * 100}%` }}
              >
                {dense && endNote && i === last ? `${formatValue(t)} ${endNote}` : formatValue(t)}
              </li>
            ))}
          </ul>
        </div>
        <span className={styles.nodata}><span className={styles.swatch} aria-hidden="true" />{noDataLabel}</span>
      </div>
    </div>
  );
}
