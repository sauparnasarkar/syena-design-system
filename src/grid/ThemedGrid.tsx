import { AllCommunityModule, ModuleRegistry, type ColDef, type GridApi, type GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useGridTheme } from './theme';

ModuleRegistry.registerModules([AllCommunityModule]);

/** Cell styling for figures: the figure face with tabular, lining numerals. */
export const figureCell: Record<string, string> = {
  fontFamily: 'var(--syn-family-figure)',
  fontFeatureSettings: 'var(--syn-figure-feature-settings)',
};

export interface ThemedGridProps<Row> {
  rowData: Row[];
  columnDefs: ColDef<Row>[];
  /** The accessible name of the table: what it holds and the period. */
  ariaLabel: string;
  height: number;
  onReady?: (api: GridApi<Row>) => void;
  /** Shown instead of rows when there are none: say why, and offer the way out. */
  noRowsOverlayComponent?: () => React.ReactNode;
}

/** A data grid themed from tokens. The data table component builds on this. */
export function ThemedGrid<Row>({ rowData, columnDefs, ariaLabel, height, onReady, noRowsOverlayComponent }: ThemedGridProps<Row>) {
  const theme = useGridTheme();
  if (!theme) return null;
  return (
    <div role="region" aria-label={ariaLabel} style={{ height }}>
      <AgGridReact<Row>
        theme={theme}
        rowData={rowData}
        columnDefs={columnDefs}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        noRowsOverlayComponent={noRowsOverlayComponent}
        onGridReady={(e: GridReadyEvent<Row>) => onReady?.(e.api)}
      />
    </div>
  );
}
