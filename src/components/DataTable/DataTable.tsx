import type { ColDef, GridApi, ICellRendererParams, IHeaderParams } from 'ag-grid-community';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { numericColumn, ThemedGrid } from '../../grid/ThemedGrid';
import { useWidth } from '../../hooks/useWidth';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import { toPx } from '../../theme/lengths';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  key: keyof Row & string;
  header: string;
  /** Written after the header, once, instead of in every cell. */
  unit?: string;
  /** Right-aligned in the figure face, header included. When left out, a column whose values are all numbers is numeric. */
  numeric?: boolean;
  /** Stays in view when the table scrolls sideways. The first column is pinned by default. */
  pinned?: boolean;
  sortable?: boolean;
  /** How a cell is written; the raw value by default. */
  format?: (value: unknown, row: Row) => string;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** What the table holds and the period. Shown above the table, outside the scrolling area, and names it. */
  caption: string;
  /** More rows than this scroll inside a fixed-height grid; fewer fit the grid to its rows. */
  maxVisibleRows?: number;
  loading?: boolean;
  /** Why there is nothing to show; offer the way out with `emptyAction`. */
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRowSelected?: (row: Row) => void;
}

const tokenNames = ['space-2', 'space-4', 'space-8', 'icon-small', 'layout-control-height', 'family-ui', 'family-figure', 'type-text-sm-size'] as const;

let ruler: CanvasRenderingContext2D | null = null;
const textWidth = (text: string, font: string) => {
  ruler ??= document.createElement('canvas').getContext('2d');
  if (!ruler) return text.length * 8;
  ruler.font = font;
  return Math.ceil(ruler.measureText(text).width);
};

/** A column header: its name, which wraps at spaces, and the unit on its own smaller line, as in `Table`. */
function ColumnHeader({ displayName, unit, numeric, column, progressSort }: IHeaderParams & { unit?: string; numeric?: boolean }) {
  const [sort, setSort] = useState(column.getSort() ?? null);
  useEffect(() => {
    const listener = () => setSort(column.getSort() ?? null);
    column.addEventListener('sortChanged', listener);
    return () => column.removeEventListener('sortChanged', listener);
  }, [column]);
  return (
    <div role="presentation" className={[styles.header, numeric ? styles.numeric : ''].join(' ')} onClick={(event) => progressSort(event.shiftKey)}>
      <span className={styles.headerText}>
        <span>{displayName}</span>
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </span>
      {sort ? <Icon name={sort === 'asc' ? 'up' : 'down'} size="small" /> : null}
    </div>
  );
}

/** A label that wraps: at spaces only, so no word is ever split. */
function WrappedLabel({ valueFormatted, value }: ICellRendererParams) {
  return <span className={styles.label}>{String(valueFormatted ?? value ?? '')}</span>;
}

const cellText = <Row extends object>(col: DataTableColumn<Row>, row: Row) => {
  const value = (row as Record<string, unknown>)[col.key];
  if (col.format) return col.format(value, row);
  return col.numeric && typeof value === 'number' ? value.toLocaleString('en-GB') : String(value ?? '');
};

/**
 * A sortable, scrollable data grid. The first column is pinned and sized to its content, capped so at
 * least two number columns show beside it; the others take their content width and share the rest, so
 * the last column meets the right edge. Numbers and their headers are right-aligned in the figure face.
 */
export function DataTable<Row extends object>({ columns: given, rows, caption, maxVisibleRows = 10, loading, emptyMessage = 'Nothing to show.', emptyAction, onRowSelected }: DataTableProps<Row>) {
  // A column that does not say whether it is numeric is, when every value in it that is there is a number.
  const columns = useMemo(() => given.map((col) => {
    if (col.numeric !== undefined) return col;
    const values = rows.map((r) => (r as Record<string, unknown>)[col.key]).filter((v) => v !== null && v !== undefined && v !== '');
    return { ...col, numeric: values.length > 0 && values.every((v) => typeof v === 'number') };
  }), [given, rows]);
  const captionId = useId();
  const t = useResolvedTokens(tokenNames);
  const [wrap, width] = useWidth<HTMLDivElement>();
  // Widths are measured with the faces the grid draws in, so wait until they are loaded.
  const [fontsReady, setFontsReady] = useState(false);
  const faces = t ? [`400 ${t['type-text-sm-size']} ${t['family-ui']}`, `600 ${t['type-text-sm-size']} ${t['family-ui']}`, `500 ${t['type-text-sm-size']} ${t['family-figure']}`] : [];
  const faceKey = faces.join('|');
  useEffect(() => {
    if (!faceKey) return;
    let live = true;
    void Promise.all(faceKey.split('|').map((f) => document.fonts.load(f, '0123456789 Aa'))).then(() => document.fonts.ready).then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, [faceKey]);

  const columnDefs = useMemo<{ defs: ColDef<Row>[]; scrolls: boolean } | null>(() => {
    if (!t || width === 0 || !fontsReady) return null;
    const pad = 2 * toPx(t['space-4']);
    const sortIcon = toPx(t['icon-small']) + toPx(t['space-2']);
    const size = toPx(t['type-text-sm-size']);
    const ui = `${size}px ${t['family-ui']}`;
    const figure = `500 ${size}px ${t['family-figure']}`;
    const minPx = toPx(t['space-8']);
    // A little slack, since the ruler and the grid round glyph advances differently.
    const slack = (n: number) => Math.ceil(n * 1.03) + pad + 2;
    const longestWord = (texts: string[], font: string) => Math.max(0, ...texts.flatMap((x) => x.split(/\s+/)).map((w) => textWidth(w, font)));
    const headerFont = `600 ${ui}`;
    const info = columns.map((col) => {
      const texts = rows.map((row) => cellText(col, row));
      const cellFont = col.numeric ? figure : ui;
      // Whole text: the widest cell. Never narrower than the longest word anywhere in the column, header included.
      const whole = Math.max(0, ...texts.map((x) => textWidth(x, cellFont)));
      const word = Math.max(longestWord(texts, cellFont), longestWord([col.header, col.unit ?? ''], headerFont) + sortIcon);
      return { whole: slack(Math.max(whole, word)), word: slack(word) };
    });
    const isPinned = columns.map((col, i) => col.pinned ?? i === 0);
    const free = info.filter((_, i) => !isPinned[i]);
    // Beside the pinned column the first two others are shown if they fit; if they cannot, one is shown and the rest scroll.
    const room = width - (free[0]?.whole ?? 0) - (free[1]?.whole ?? 0) - toPx(t['space-2']);
    let total = 0;
    const defs = columns.map((col, i) => {
      const base = {
        field: col.key as never,
        headerName: col.header,
        headerComponent: ColumnHeader,
        headerComponentParams: { unit: col.unit, numeric: !!col.numeric },
        sortable: col.sortable ?? true,
        ...(col.numeric ? numericColumn<Row>() : {}),
        valueFormatter: (p) => cellText(col, p.data as Row),
      } satisfies ColDef<Row>;
      if (isPinned[i]) {
        // The label column is as wide as its text up to what leaves room for two number columns, and never
        // narrower than its longest word. A label that does not fit wraps at spaces, never inside a word.
        const w = Math.max(Math.max(minPx, info[i].word), Math.min(info[i].whole, room));
        total += w;
        return {
          ...base, pinned: 'left' as const, width: w,
          ...(w < info[i].whole ? { wrapText: true, autoHeight: true, cellRenderer: WrappedLabel, cellStyle: { lineHeight: 'var(--syn-type-text-sm-line)', paddingBlock: 'var(--syn-space-2)' } } : {}),
        };
      }
      const min = Math.max(minPx, info[i].word);
      total += info[i].whole;
      return { ...base, flex: info[i].whole, minWidth: min };
    });
    return { defs, scrolls: total > width };
  }, [columns, rows, t, width, fontsReady]);

  // Row heights follow the wrapped labels, so they are measured again whenever the columns change width,
  // the rows change, or a face finishes loading; the grid then re-fits its height to the new rows.
  const [api, setApi] = useState<GridApi<Row> | null>(null);
  useEffect(() => {
    if (!api || api.isDestroyed()) return undefined;
    const settle = () => { if (!api.isDestroyed()) api.resetRowHeights(); };
    let second = 0;
    const first = requestAnimationFrame(() => { settle(); second = requestAnimationFrame(settle); });
    api.addEventListener('columnResized', settle);
    document.fonts.addEventListener('loadingdone', settle);
    return () => {
      cancelAnimationFrame(first); cancelAnimationFrame(second);
      if (!api.isDestroyed()) api.removeEventListener('columnResized', settle);
      document.fonts.removeEventListener('loadingdone', settle);
    };
  }, [api, columnDefs, rows]);

  const fits = rows.length <= maxVisibleRows;
  const rowHeight = t ? toPx(t['layout-control-height']) : 0;
  const empty = (): ReactNode => <div className={styles.empty}>{emptyMessage}</div>;

  return (
    <div ref={wrap} className={styles.wrap}>
      <p id={captionId} className={styles.caption}>{caption}</p>
      {columnDefs ? (
        <ThemedGrid<Row> rowData={rows} columnDefs={columnDefs.defs} suppressHorizontalScroll={!columnDefs.scrolls} ariaLabelledBy={captionId} ariaLabel={caption} fitRows={fits && rows.length > 0} height={rows.length === 0 ? rowHeight * 5 : rowHeight * (maxVisibleRows + 1)} loading={loading} onReady={setApi} noRowsOverlayComponent={empty} onRowSelected={onRowSelected} />
      ) : null}
      {rows.length === 0 && emptyAction ? <div className={styles.action}><Button size="small" onClick={emptyAction.onClick}>{emptyAction.label}</Button></div> : null}
    </div>
  );
}
