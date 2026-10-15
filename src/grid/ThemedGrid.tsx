import { AllCommunityModule, ModuleRegistry, type ColDef, type GridApi, type GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGridTheme } from './theme';

ModuleRegistry.registerModules([AllCommunityModule]);

/** Cell styling for figures: the figure face with tabular, lining numerals, right-aligned. */
export const figureCell: Record<string, string> = {
  fontFamily: 'var(--syn-family-figure)',
  fontFeatureSettings: 'var(--syn-figure-feature-settings)',
  textAlign: 'right',
};

/** A numeric column: header and cells right-aligned, figures in the figure face. */
export const numericColumn = <Row,>(): Pick<ColDef<Row>, 'type' | 'cellStyle' | 'headerStyle'> => ({
  type: 'rightAligned',
  cellStyle: figureCell,
  headerStyle: { textAlign: 'right' },
});

export interface ThemedGridProps<Row> {
  rowData: Row[];
  columnDefs: ColDef<Row>[];
  /** The accessible name of the table: what it holds and the period. */
  ariaLabel: string;
  /** Names the table by a visible caption elsewhere, instead of `ariaLabel`. */
  ariaLabelledBy?: string;
  loading?: boolean;
  onRowSelected?: (row: Row) => void;
  /** Fixed height in pixels. Omit with `fitRows` to size the grid to its rows. */
  height?: number;
  /** The grid is as tall as its rows, header included: no empty strip under the last row. */
  fitRows?: boolean;
  onReady?: (api: GridApi<Row>) => void;
  defaultColDef?: ColDef<Row>;
  /** Shown instead of rows when there are none: say why, and offer the way out. */
  noRowsOverlayComponent?: () => React.ReactNode;
}

/** A data grid themed from tokens. The data table component builds on this. */
export function ThemedGrid<Row>({ rowData, columnDefs, defaultColDef, ariaLabel, ariaLabelledBy, loading, onRowSelected, height, fitRows, onReady, noRowsOverlayComponent }: ThemedGridProps<Row>) {
  const theme = useGridTheme();
  const host = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<GridApi<Row> | null>(null);
  const [fitted, setFitted] = useState<number | null>(null);

  // A grid that fits its rows is as tall as its header, its rows and, when it scrolls sideways, the
  // horizontal scrollbar. Permanent scrollbars take real height; overlay scrollbars take none.
  const measure = useCallback(() => {
    const el = host.current;
    if (!el || !api || api.isDestroyed()) return;
    const header = el.querySelector<HTMLElement>('.ag-header')?.offsetHeight ?? 0;
    let bottom = 0;
    api.forEachNodeAfterFilterAndSort((node) => { bottom = Math.max(bottom, (node.rowTop ?? 0) + (node.rowHeight ?? 0)); });
    const bar = el.querySelector<HTMLElement>('.ag-body-horizontal-scroll');
    const barHeight = bar && bar.offsetHeight > 0 ? bar.offsetHeight : 0;
    const root = el.querySelector<HTMLElement>('.ag-root-wrapper');
    const frame = root ? root.offsetHeight - (root.clientHeight || root.offsetHeight) : 0;
    if (header > 0) setFitted(header + bottom + barHeight + frame);
  }, [api]);

  useEffect(() => {
    if (!fitRows || !api || api.isDestroyed()) return undefined;
    let a = 0; let b = 0;
    const run = () => { cancelAnimationFrame(a); cancelAnimationFrame(b); a = requestAnimationFrame(() => { measure(); b = requestAnimationFrame(measure); }); };
    const events = ['modelUpdated', 'columnResized', 'gridSizeChanged', 'displayedColumnsChanged', 'firstDataRendered'] as const;
    events.forEach((e) => api.addEventListener(e, run));
    document.fonts.addEventListener('loadingdone', run);
    const ro = new ResizeObserver(run);
    if (host.current) ro.observe(host.current);
    // Auto-height rows change their own height after the first paint; that shows as a style change in the rows.
    const mo = new MutationObserver(run);
    if (host.current) mo.observe(host.current, { subtree: true, attributes: true, attributeFilter: ['style'] });
    run();
    return () => {
      cancelAnimationFrame(a); cancelAnimationFrame(b); ro.disconnect(); mo.disconnect();
      document.fonts.removeEventListener('loadingdone', run);
      if (!api.isDestroyed()) events.forEach((e) => api.removeEventListener(e, run));
    };
  }, [api, fitRows, measure]);

  if (!theme) return null;
  return (
    <div ref={host} role="region" aria-label={ariaLabelledBy ? undefined : ariaLabel} aria-labelledby={ariaLabelledBy} style={{ height: fitRows ? fitted ?? height : height }}>
      <AgGridReact<Row>
        theme={theme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        suppressRowVirtualisation={fitRows}
        noRowsOverlayComponent={noRowsOverlayComponent}
        loading={loading}
        onRowSelected={(e) => { if (e.node.isSelected() && e.data) onRowSelected?.(e.data); }}
        onGridReady={(e: GridReadyEvent<Row>) => { setApi(e.api); onReady?.(e.api); }}
      />
    </div>
  );
}
