import { AllCommunityModule, ModuleRegistry, type ColDef, type GridApi, type GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
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
  if (!theme) return null;
  return (
    <div role="region" aria-label={ariaLabelledBy ? undefined : ariaLabel} aria-labelledby={ariaLabelledBy} style={fitRows ? undefined : { height }}>
      <AgGridReact<Row>
        theme={theme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout={fitRows ? 'autoHeight' : 'normal'}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        noRowsOverlayComponent={noRowsOverlayComponent}
        loading={loading}
        onRowSelected={(e) => { if (e.node.isSelected() && e.data) onRowSelected?.(e.data); }}
        onGridReady={(e: GridReadyEvent<Row>) => onReady?.(e.api)}
      />
    </div>
  );
}
