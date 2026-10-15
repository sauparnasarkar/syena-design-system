import type { ColDef } from 'ag-grid-community';
import { useId, useMemo, type ReactNode } from 'react';
import { numericColumn, ThemedGrid } from '../../grid/ThemedGrid';
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
  /** The height of the table in pixels, unless `autoHeight`. */
  height?: number;
  loading?: boolean;
  /** Why there is nothing to show; offer the way out with `emptyAction`. */
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRowSelected?: (row: Row) => void;
}

const tokenNames = ['space-10', 'layout-field-min', 'layout-control-height'] as const;

/**
 * A sortable, scrollable data grid. Columns fill the width, the first stays pinned, numbers and their
 * headers are right-aligned in the figure face. The caption sits outside the scrolling area.
 */
export function DataTable<Row extends Record<string, unknown>>({ columns, rows, caption, height, loading, emptyMessage = 'Nothing to show.', emptyAction, onRowSelected }: DataTableProps<Row>) {
  const captionId = useId();
  const t = useResolvedTokens(tokenNames);
  const columnDefs = useMemo<ColDef<Row>[] | null>(() => {
    if (!t) return null;
    const minWidth = toPx(t['space-10']);
    const firstWidth = toPx(t['layout-field-min']);
    return columns.map((col, i) => {
      const pinned = col.pinned ?? i === 0;
      return {
        field: col.key as never,
        headerName: col.unit ? `${col.header} (${col.unit})` : col.header,
        sortable: col.sortable ?? true,
        // Pinned columns keep a fixed width; the others share what is left, so the last one reaches the edge.
        ...(pinned ? { pinned: 'left' as const, width: firstWidth } : { flex: 1, minWidth }),
        ...(col.numeric ? numericColumn<Row>() : {}),
        valueFormatter: col.format ? (p) => col.format!(p.value, p.data as Row) : col.numeric ? (p) => (typeof p.value === 'number' ? p.value.toLocaleString('en-GB') : String(p.value ?? '')) : undefined,
      } satisfies ColDef<Row>;
    });
  }, [columns, t]);

  const rowHeight = t ? toPx(t['layout-control-height']) : 0;
  const gridHeight = height ?? (rowHeight ? rowHeight * (Math.min(rows.length, 10) + 2) : 0);
  // The grid's overlay does not take pointer events, so the message is in it and the action is below the grid.
  const empty = (): ReactNode => <div className={styles.empty}>{emptyMessage}</div>;

  if (!columnDefs) return null;
  return (
    <div className={styles.wrap}>
      <p id={captionId} className={styles.caption}>{caption}</p>
      <ThemedGrid<Row> rowData={rows} columnDefs={columnDefs} ariaLabelledBy={captionId} ariaLabel={caption} height={gridHeight} loading={loading} noRowsOverlayComponent={empty} onRowSelected={onRowSelected} />
      {rows.length === 0 && emptyAction ? <div className={styles.action}><Button size="small" onClick={emptyAction.onClick}>{emptyAction.label}</Button></div> : null}
    </div>
  );
}
