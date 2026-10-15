import type { ColDef } from 'ag-grid-community';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { numericColumn, ThemedGrid } from '../../grid/ThemedGrid';
import { useWidth } from '../../hooks/useWidth';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import { toPx } from '../../theme/lengths';
import { Button } from '../Button/Button';
import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  key: keyof Row & string;
  header: string;
  /** Written after the header, once, instead of in every cell. */
  unit?: string;
  /** Right-aligned in the figure face, header included. */
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

const cellText = <Row extends Record<string, unknown>>(col: DataTableColumn<Row>, row: Row) => {
  const value = row[col.key];
  if (col.format) return col.format(value, row);
  return col.numeric && typeof value === 'number' ? value.toLocaleString('en-GB') : String(value ?? '');
};

/**
 * A sortable, scrollable data grid. The first column is pinned and sized to its content, capped so at
 * least two number columns show beside it; the others take their content width and share the rest, so
 * the last column meets the right edge. Numbers and their headers are right-aligned in the figure face.
 */
export function DataTable<Row extends Record<string, unknown>>({ columns, rows, caption, maxVisibleRows = 10, loading, emptyMessage = 'Nothing to show.', emptyAction, onRowSelected }: DataTableProps<Row>) {
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

  const columnDefs = useMemo<ColDef<Row>[] | null>(() => {
    if (!t || width === 0 || !fontsReady) return null;
    const pad = 2 * toPx(t['space-4']);
    const sortIcon = toPx(t['icon-small']) + toPx(t['space-2']);
    const size = toPx(t['type-text-sm-size']);
    const ui = `${size}px ${t['family-ui']}`;
    const figure = `500 ${size}px ${t['family-figure']}`;
    const minPx = toPx(t['space-8']);
    // Content width: the widest of the header and every cell, plus padding, plus the sort icon on the header.
    const fit = columns.map((col) => {
      const header = textWidth(col.unit ? `${col.header} (${col.unit})` : col.header, `600 ${ui}`) + sortIcon;
      const cells = rows.map((row) => textWidth(cellText(col, row), col.numeric ? figure : ui));
      // A little slack, since the ruler and the grid round glyph advances differently.
      return Math.max(minPx, Math.ceil(Math.max(header, ...cells) * 1.03) + pad + 2);
    });
    const isPinned = columns.map((col, i) => col.pinned ?? i === 0);
    const free = fit.filter((_, i) => !isPinned[i]);
    // At least the first two of the other columns show beside the pinned one.
    const room = Math.max(minPx, width - (free[0] ?? 0) - (free[1] ?? 0) - toPx(t['space-2']));
    return columns.map((col, i) => {
      const base = {
        field: col.key as never,
        headerName: col.unit ? `${col.header} (${col.unit})` : col.header,
        sortable: col.sortable ?? true,
        ...(col.numeric ? numericColumn<Row>() : {}),
        valueFormatter: (p) => cellText(col, p.data as Row),
      } satisfies ColDef<Row>;
      if (isPinned[i]) {
        const w = Math.min(fit[i], room);
        // A pinned label that does not fit its content wraps to further lines instead of truncating.
        return { ...base, pinned: 'left' as const, width: w, ...(w < fit[i] ? { wrapText: true, autoHeight: true, wrapHeaderText: true, autoHeaderHeight: true } : {}) };
      }
      return { ...base, flex: fit[i], minWidth: fit[i] };
    });
  }, [columns, rows, t, width, fontsReady]);

  const fits = rows.length <= maxVisibleRows;
  const rowHeight = t ? toPx(t['layout-control-height']) : 0;
  const empty = (): ReactNode => <div className={styles.empty}>{emptyMessage}</div>;

  return (
    <div ref={wrap} className={styles.wrap}>
      <p id={captionId} className={styles.caption}>{caption}</p>
      {columnDefs ? (
        <ThemedGrid<Row> rowData={rows} columnDefs={columnDefs} ariaLabelledBy={captionId} ariaLabel={caption} fitRows={fits && rows.length > 0} height={rows.length === 0 ? rowHeight * 5 : rowHeight * (maxVisibleRows + 1)} loading={loading} noRowsOverlayComponent={empty} onRowSelected={onRowSelected} />
      ) : null}
      {rows.length === 0 && emptyAction ? <div className={styles.action}><Button size="small" onClick={emptyAction.onClick}>{emptyAction.label}</Button></div> : null}
    </div>
  );
}
