import { useId, useMemo, useState } from 'react';
import { PanelButton } from '../../charts/map/MapControls';
import { blendStops } from '../../charts/map/heat';
import { squarify } from '../../charts/treemap/squarify';
import { useWidth } from '../../hooks/useWidth';
import { bestInk } from '../../lib/colour';
import { toPx } from '../../theme/lengths';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import styles from './Treemap.module.css';

export interface TreemapItem {
  id: string;
  label: string;
  /** Sets the tile's area. */
  value: number;
  /** A group the tile belongs to; tiles of one group share a colour when `colorBy` is `group`. */
  group?: string;
  /** Sets the tile's colour when `colorBy` is `value`. */
  colorValue?: number;
}

export interface TreemapProps {
  items: TreemapItem[];
  /** What is shown, the unit and the period, in one sentence. Required. */
  ariaLabel: string;
  /** What the area measures, with its unit: the value column's header and the legend title. */
  valueLabel: string;
  unit?: string;
  formatValue?: (value: number) => string;
  /** `group`: one categorical colour per group, largest first. `value`: the sequential ramp by `colorValue`. */
  colorBy?: 'group' | 'value';
  /** The range the ramp covers when colouring by value. The range of the values by default. */
  colorDomain?: [number, number];
  /** Colours by value on the diverging ramp, centred on zero: for a change, where below and above zero differ in meaning. The range is symmetrical about zero. */
  diverging?: boolean;
  /** What the colour measures, when colouring by value. */
  colorLabel?: string;
  formatColorValue?: (value: number) => string;
  height?: number;
  /** Makes every tile a button that reports its id: for choosing a tile where hover is not available. */
  onSelect?: (id: string) => void;
  /** The chosen tile, marked on the chart. */
  selectedId?: string;
  /** A shorter figure: the pointed-at tile is read out over the tiles' bottom corner, and the colour key and the table switch share one row. */
  compact?: boolean;
}

const catNames = ['data-cat-1', 'data-cat-2', 'data-cat-3', 'data-cat-4', 'data-cat-5', 'data-cat-6', 'data-cat-7', 'data-cat-8'] as const;
const seqNames = ['data-seq-1', 'data-seq-2', 'data-seq-3', 'data-seq-4', 'data-seq-5', 'data-seq-6', 'data-seq-7'] as const;
const divNames = ['data-div-neg-3', 'data-div-neg-2', 'data-div-neg-1', 'data-div-mid', 'data-div-pos-1', 'data-div-pos-2', 'data-div-pos-3'] as const;
const tokenNames = ['data-surface', 'data-text', 'data-text-muted', 'data-ink-dark', 'data-ink-light', 'data-other', 'space-9', 'type-text-sm-line', ...catNames, ...seqNames, ...divNames] as const;
const plain = (v: number) => v.toLocaleString('en-GB');

/**
 * A treemap: tiles whose area is the value, coloured by group or by a second value. Labels show where a tile has room
 * and are always in the table view, which is also the text alternative.
 */
export function Treemap({ items, ariaLabel, valueLabel, unit, formatValue = plain, colorBy = 'group', colorDomain, diverging = false, colorLabel, formatColorValue = plain, height = 320, onSelect, selectedId, compact = false }: TreemapProps) {
  const [box, width] = useWidth<HTMLDivElement>();
  const t = useResolvedTokens(tokenNames);
  const [tableView, setTableView] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const tableId = useId();

  const groups = useMemo(() => {
    const totals = new Map<string, number>();
    for (const i of items) if (i.group) totals.set(i.group, (totals.get(i.group) ?? 0) + i.value);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [items]);
  const [lo, hi] = useMemo<[number, number]>(() => {
    if (colorDomain) return colorDomain;
    const v = items.flatMap((i) => (i.colorValue === undefined ? [] : [i.colorValue]));
    if (diverging) { const m = v.length ? Math.max(...v.map(Math.abs)) : 1; return [-m, m]; }
    return v.length ? [Math.min(...v), Math.max(...v)] : [0, 1];
  }, [colorDomain, diverging, items]);

  const fillOf = (item: TreemapItem) => {
    if (!t) return 'transparent';
    if (colorBy === 'value') return blendStops((diverging ? divNames : seqNames).map((n) => t[n]), item.colorValue === undefined ? (diverging ? 0.5 : 0) : (item.colorValue - lo) / Math.max(1e-9, hi - lo));
    const slot = item.group ? groups.indexOf(item.group) : -1;
    return slot >= 0 && slot < catNames.length ? t[catNames[slot]] : t['data-other'];
  };

  const tiles = useMemo(() => (width > 0 ? squarify(items, (i) => i.value, { x: 0, y: 0, w: width, h: height }) : []), [items, width, height]);
  const minW = t ? toPx(t['space-9']) : 0;
  const minH = t ? 2 * toPx(t['type-text-sm-line']) : 0;
  const rows = useMemo(() => [...items].sort((a, b) => b.value - a.value), [items]);
  const describe = (i: TreemapItem) => `${i.label}: ${[formatValue(i.value), unit].filter(Boolean).join(' ')}${colorBy === 'value' && i.colorValue !== undefined ? `, ${formatColorValue(i.colorValue)}` : ''}`;

  const controls = (
    <div className={styles.controls}>
      <PanelButton icon="table" pressed={tableView} onClick={() => setTableView((v) => !v)}>Table view</PanelButton>
    </div>
  );
  const key = colorBy === 'group' && t ? (
    <ul className={styles.legend} aria-label="Groups">
      {groups.map((g, k) => (
        <li key={g}><span className={styles.swatch} style={{ background: k < catNames.length ? t[catNames[k]] : t['data-other'] }} aria-hidden="true" />{g}</li>
      ))}
    </ul>
  ) : colorBy === 'value' ? (
    <div className={[styles.ramp, compact ? styles.rampInline : ''].filter(Boolean).join(' ')}>
      <span>{colorLabel ?? 'Colour value'}</span>
      <div className={styles.rampRow}>
        <span>{formatColorValue(lo)}</span>
        <span className={[styles.bar, diverging ? styles.diverging : ''].filter(Boolean).join(' ')} aria-hidden="true" />
        <span>{formatColorValue(hi)}</span>
      </div>
    </div>
  ) : null;

  return (
    <figure className={styles.treemap}>
      <div ref={box} className={[styles.stage, tableView ? styles.stageOff : ''].join(' ')} style={{ height: tableView ? 0 : height }} aria-hidden={tableView || undefined}>
        {t ? (
          <div {...(onSelect ? { role: 'group', 'aria-label': ariaLabel } : { role: 'img', 'aria-label': ariaLabel, 'aria-describedby': tableId })} className={styles.tiles} onPointerLeave={() => setHover(null)}>
            {tiles.map(({ item, x, y, w, h }) => {
              const fill = fillOf(item);
              const roomy = w >= minW && h >= minH;
              const props = {
                className: [styles.tile, onSelect ? styles.pick : '', item.id === selectedId ? styles.chosen : ''].filter(Boolean).join(' '),
                style: { left: x, top: y, width: w, height: h, background: fill, color: bestInk(fill, t['data-ink-light'], t['data-ink-dark']) },
                onPointerEnter: () => setHover(describe(item)),
              };
              const inside = (
                <>
                  {roomy ? <span className={styles.label}>{item.label}</span> : null}
                  {roomy ? <span className={styles.value}>{formatValue(item.value)}{unit ? ` ${unit}` : ''}</span> : null}
                </>
              );
              // The tiles are a picture and the table below is its text alternative; with `onSelect` each tile is a button instead, named by its own reading.
              return onSelect ? (
                <button key={item.id} type="button" aria-label={roomy ? undefined : describe(item)} aria-pressed={item.id === selectedId} onClick={() => onSelect(item.id)} {...props}>{inside}</button>
              ) : (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div key={item.id} {...props}>{inside}</div>
              );
            })}
          </div>
        ) : null}
        {compact && !tableView && hover ? <p className={styles.readoutCorner} aria-hidden="true">{hover}</p> : null}
      </div>
      {tableView || compact ? null : <p className={styles.readout} aria-hidden="true">{hover ?? ' '}</p>}
      {compact ? null : controls}
      <div className={tableView ? styles.tableView : styles.hidden} {...(tableView ? { role: 'region', 'aria-label': 'Table of values', tabIndex: 0 } : {})}>
        <table id={tableId}>
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              {groups.length ? <th scope="col">Group</th> : null}
              <th scope="col">{valueLabel}</th>
              {colorBy === 'value' ? <th scope="col">{colorLabel ?? 'Colour value'}</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <th scope="row">{i.label}</th>
                {groups.length ? <td>{i.group ?? ''}</td> : null}
                <td className={styles.num}>{formatValue(i.value)}</td>
                {colorBy === 'value' ? <td className={styles.num}>{i.colorValue === undefined ? 'No data' : formatColorValue(i.colorValue)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {compact ? <div className={styles.foot}>{key}{controls}</div> : key}
    </figure>
  );
}
