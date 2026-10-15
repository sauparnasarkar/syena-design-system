import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DataTable, type DataTableColumn } from './DataTable';

type Row = { indicator: string; y1990: number; y2000: number; y2010: number; y2024: number; change: number };
const rows: Row[] = [
  { indicator: 'Total CO₂ emissions (MtCO₂)', y1990: 412, y2000: 468, y2010: 521, y2024: 449, change: 9.0 },
  { indicator: 'Emissions per person (tCO₂)', y1990: 7.7, y2000: 7.9, y2010: 8.1, y2024: 6.4, change: -16.9 },
  { indicator: 'Emissions per unit of output', y1990: 0.62, y2000: 0.51, y2010: 0.41, y2024: 0.27, change: -56.5 },
  { indicator: 'Renewable share of electricity', y1990: 18.2, y2000: 20.5, y2010: 26.9, y2024: 43.7, change: 140.1 },
  { indicator: 'Forest cover (% of land)', y1990: 31.4, y2000: 30.2, y2010: 29.8, y2024: 29.1, change: -7.3 },
];
const signed = (v: unknown) => `${(v as number) > 0 ? '+' : '−'}${Math.abs(v as number).toFixed(1)}%`;
const columns: DataTableColumn<Row>[] = [
  { key: 'indicator', header: 'Indicator' },
  { key: 'y1990', header: '1990', numeric: true },
  { key: 'y2000', header: '2000', numeric: true },
  { key: 'y2010', header: '2010', numeric: true },
  { key: 'y2024', header: '2024', numeric: true },
  { key: 'change', header: 'Change since 1990', numeric: true, format: signed },
];

const frame = (width = 'min(100%, 62rem)') => (Story: () => ReactElement) => <div style={{ padding: 'var(--syn-space-4)', width }}><Story /></div>;
const CAPTION = 'Indicators for the example country, 1990 to 2024. Illustrative values.';

const meta: Meta<typeof DataTable<Row>> = { title: 'Data/DataTable', component: DataTable, args: { columns, rows, caption: CAPTION }, decorators: [frame()] };
export default meta;
type Story = StoryObj<typeof DataTable<Row>>;

const ready = (el: HTMLElement) => waitFor(() => expect(el.querySelector('.ag-row')).not.toBeNull());
const textRight = (el: Element) => { const r = document.createRange(); r.selectNodeContents(el); return Math.round(r.getBoundingClientRect().right); };

export const Structure: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement);
    // The visible caption sits outside the grid and names it.
    const region = canvas.getByRole('region', { name: CAPTION });
    await expect(region.contains(canvas.getByText(CAPTION))).toBe(false);
    await expect(canvasElement.querySelector('[role="grid"]')).not.toBeNull();
  },
};

export const ColumnsFillTheWidth: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    // No empty band to the right of the last column: rows reach the edge of the header and the container.
    await waitFor(() => {
      const root = canvasElement.querySelector('.ag-root') as HTMLElement;
      const lastHeader = [...canvasElement.querySelectorAll('.ag-header-cell')].pop() as HTMLElement;
      expect(Math.abs(lastHeader.getBoundingClientRect().right - root.getBoundingClientRect().right)).toBeLessThanOrEqual(2);
    });
    const lastCell = canvasElement.querySelector('.ag-grid-scrolling-rows .ag-row [col-id="change"]') as HTMLElement;
    const root = canvasElement.querySelector('.ag-root') as HTMLElement;
    await expect(Math.abs(lastCell.getBoundingClientRect().right - root.getBoundingClientRect().right)).toBeLessThanOrEqual(2);
  },
};

export const LabelColumnIsNotTruncatedWhileNumbersHaveSlack: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const first = [...canvasElement.querySelectorAll('.ag-grid-pinned-left-cells .ag-cell')];
    await expect(first.length).toBeGreaterThan(0);
    for (const cell of first) await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
    // Number columns take their content plus padding; the spare width is shared, not left to the label.
    const header = within(canvasElement).getByText('Indicator').closest('.ag-header-cell') as HTMLElement;
    const number = within(canvasElement).getByText('2024').closest('.ag-header-cell') as HTMLElement;
    await expect(header.getBoundingClientRect().width).toBeLessThan(number.getBoundingClientRect().width * 3);
  },
};

export const GridIsAsTallAsItsRows: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const rowsEls = [...canvasElement.querySelectorAll('.ag-grid-scrolling-rows .ag-row')];
    await expect(rowsEls).toHaveLength(rows.length);
    const last = rowsEls.reduce((m, r) => Math.max(m, r.getBoundingClientRect().bottom), 0);
    const root = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
    // No empty strip under the last row (the frame's own border is allowed).
    await expect(root.getBoundingClientRect().bottom - last).toBeLessThanOrEqual(3);
  },
};

export const NumbersAndHeadersAreRightAligned: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    for (const year of ['1990', '2000', '2010', '2024']) {
      const header = within(canvasElement).getByText(year).closest('.ag-header-cell') as HTMLElement;
      const cell = canvasElement.querySelector(`.ag-grid-scrolling-rows .ag-row [col-id="${header.getAttribute('col-id')}"]`) as HTMLElement;
      await expect(getComputedStyle(cell).textAlign).toBe('right');
      await expect(Math.abs(textRight(header.querySelector('.ag-header-cell-text')!) - textRight(cell))).toBeLessThanOrEqual(1);
    }
  },
};

export const SortsThreeStates: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const header = within(canvasElement).getByText('2024').closest('.ag-header-cell') as HTMLElement;
    const label = header.querySelector('.ag-header-cell-label') as HTMLElement;
    await userEvent.click(label);
    await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'ascending'));
    await userEvent.click(label);
    await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'descending'));
    await userEvent.click(label);
    await waitFor(() => expect(['none', null]).toContain(header.getAttribute('aria-sort')));
  },
};

export const FirstColumnIsPinned: Story = {
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await expect(canvasElement.querySelector('.ag-cell-last-left-pinned')).not.toBeNull();
  },
};

export const SelectingARowReportsIt: Story = {
  args: { onRowSelected: fn() },
  play: async ({ canvasElement, args }) => {
    await ready(canvasElement);
    await userEvent.click(canvasElement.querySelector('.ag-grid-scrolling-rows .ag-row .ag-cell') as HTMLElement);
    await waitFor(() => expect(args.onRowSelected).toHaveBeenCalledOnce());
    await expect(canvasElement.querySelector('.ag-row-selected')).not.toBeNull();
  },
};

export const EmptyStateSaysWhyAndOffersTheWayOut: Story = {
  args: { rows: [], emptyMessage: 'No indicators match these filters.', emptyAction: { label: 'Clear filters', onClick: fn() } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('No indicators match these filters.')).toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }));
    await expect(args.emptyAction!.onClick).toHaveBeenCalledOnce();
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.ag-overlay-loading-wrapper, .ag-overlay')).not.toBeNull());
  },
};

export const PhoneWidthFillsAndKeepsTwoNumberColumnsBesideTheLabel: Story = {
  decorators: [frame('min(100%, 22rem)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const wrapEl = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
    const holder = (wrapEl.closest('[role="region"]') as HTMLElement).getBoundingClientRect();
    // The grid fills its container's width.
    await expect(Math.abs(wrapEl.getBoundingClientRect().right - holder.right)).toBeLessThanOrEqual(2);
    // The label is capped and wraps; at least two number columns are fully visible beside it.
    const view = (canvasElement.querySelector('.ag-grid-viewport') as HTMLElement).getBoundingClientRect();
    const seen = [...canvasElement.querySelectorAll('.ag-header-cell:not(.ag-column-first)')].filter((h) => { const r = h.getBoundingClientRect(); return r.left >= view.left - 1 && r.right <= view.right + 1; });
    await expect(seen.length).toBeGreaterThanOrEqual(2);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

export const NarrowScrollsInsideItsRegionAndKeepsTheFirstColumn: Story = {
  decorators: [frame('min(100%, 20rem)')],
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    const viewport = canvasElement.querySelector('.ag-body-horizontal-scroll-viewport') as HTMLElement;
    await waitFor(() => expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth));
    await expect(canvasElement.querySelector('.ag-cell-last-left-pinned')).not.toBeNull();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
export const Night: Story = { globals: { theme: 'night' } };
