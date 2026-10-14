import type { ColDef } from 'ag-grid-community';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { figureCell, ThemedGrid } from './ThemedGrid';

type Row = { indicator: string; y1990: number; y2000: number; y2010: number; y2024: number; change: number };

const rows: Row[] = [
  { indicator: 'Total CO₂ emissions (MtCO₂)', y1990: 412, y2000: 468, y2010: 521, y2024: 449, change: 9.0 },
  { indicator: 'Emissions per person (tCO₂)', y1990: 7.7, y2000: 7.9, y2010: 8.1, y2024: 6.4, change: -16.9 },
  { indicator: 'Emissions per unit of output (kgCO₂ per $)', y1990: 0.62, y2000: 0.51, y2010: 0.41, y2024: 0.27, change: -56.5 },
  { indicator: 'Renewable share of electricity (%)', y1990: 18.2, y2000: 20.5, y2010: 26.9, y2024: 43.7, change: 140.1 },
  { indicator: 'Forest cover (% of land)', y1990: 31.4, y2000: 30.2, y2010: 29.8, y2024: 29.1, change: -7.3 },
];

const numeric = (field: keyof Row, headerName: string): ColDef<Row> => ({
  field, headerName, type: 'rightAligned', cellStyle: figureCell, width: 110,
  valueFormatter: (p) => (typeof p.value === 'number' ? p.value.toLocaleString('en-GB') : ''),
});

const columns = (extra: Partial<ColDef<Row>> = {}): ColDef<Row>[] => [
  { field: 'indicator', headerName: 'Indicator', flex: 1, minWidth: 280, pinned: 'left', ...extra },
  numeric('y1990', '1990'), numeric('y2000', '2000'), numeric('y2010', '2010'), numeric('y2024', '2024'),
  { ...numeric('change', 'Change since 1990 (%)'), width: 190, valueFormatter: (p) => `${p.value > 0 ? '+' : '−'}${Math.abs(p.value).toFixed(1)}%`, sort: undefined },
];

const meta: Meta = { title: 'Grid/Themed grid', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

const wide = { width: 'min(100%, 1000px)' } as const;

const grid = (props: Partial<React.ComponentProps<typeof ThemedGrid<Row>>> = {}, colExtra: Partial<ColDef<Row>> = {}) => (
  <div style={{ padding: 'var(--syn-space-4)', ...wide }}>
    <ThemedGrid<Row> rowData={rows} columnDefs={columns(colExtra)} ariaLabel="Indicators, 1990 to 2024" height={300} {...props} />
  </div>
);

const noRows = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-2)', justifyItems: 'center', padding: 'var(--syn-space-4)', color: 'var(--syn-color-text-secondary)' }}>
    <span>No indicators match these filters.</span>
    <button type="button">Clear filters</button>
  </div>
);

const stories = {
  Default: { render: () => grid(), play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.ag-row')).not.toBeNull());
  } },
  SortedColumn: { render: () => grid({}, {}), play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelector('.ag-row')).not.toBeNull());
    await userEvent.click(canvas.getByText('Change since 1990 (%)'));
    await userEvent.click(canvas.getByText('Change since 1990 (%)'));
    await waitFor(() => expect(canvasElement.querySelector('[aria-sort="descending"]')).not.toBeNull());
  } },
  SelectedRow: { render: () => grid(), play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.ag-row')).not.toBeNull());
    const first = canvasElement.querySelector('.ag-grid-scrolling-rows .ag-row') as HTMLElement;
    await userEvent.click(first.querySelector('.ag-cell') as HTMLElement);
    await waitFor(() => expect(canvasElement.querySelector('.ag-row-selected')).not.toBeNull());
  } },
  HoveredRow: { render: () => grid(), play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.ag-row')).not.toBeNull());
    const second = canvasElement.querySelectorAll('.ag-grid-scrolling-rows .ag-row')[1] as HTMLElement;
    await userEvent.hover(second.querySelector('.ag-cell') as HTMLElement);
    await waitFor(() => expect(canvasElement.querySelector('.ag-row-hover')).not.toBeNull());
  } },
  PinnedColumn: { render: () => grid(), play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.ag-cell-last-left-pinned')).not.toBeNull());
  } },
  Empty: { render: () => grid({ rowData: [], noRowsOverlayComponent: noRows }), play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await waitFor(() => expect(within(canvasElement).getByText('No indicators match these filters.')).toBeInTheDocument());
  } },
} satisfies Record<string, Story>;

export const DefaultNight: Story = { ...stories.Default, globals: { theme: 'night' } };
export const DefaultTidewater: Story = { ...stories.Default, globals: { theme: 'tidewater' } };
export const SortedColumnNight: Story = { ...stories.SortedColumn, globals: { theme: 'night' } };
export const SortedColumnTidewater: Story = { ...stories.SortedColumn, globals: { theme: 'tidewater' } };
export const SelectedRowNight: Story = { ...stories.SelectedRow, globals: { theme: 'night' } };
export const SelectedRowTidewater: Story = { ...stories.SelectedRow, globals: { theme: 'tidewater' } };
export const HoveredRowNight: Story = { ...stories.HoveredRow, globals: { theme: 'night' } };
export const HoveredRowTidewater: Story = { ...stories.HoveredRow, globals: { theme: 'tidewater' } };
export const PinnedColumnNight: Story = { ...stories.PinnedColumn, globals: { theme: 'night' } };
export const PinnedColumnTidewater: Story = { ...stories.PinnedColumn, globals: { theme: 'tidewater' } };
export const EmptyNight: Story = { ...stories.Empty, globals: { theme: 'night' } };
export const EmptyTidewater: Story = { ...stories.Empty, globals: { theme: 'tidewater' } };
