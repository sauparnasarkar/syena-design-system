import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Table, type TableColumn } from './Table';

type Row = { indicator: string; y1990: number; y2000: number; y2010: number; y2024: number; change: string };
const rows: Row[] = [
  { indicator: 'Total CO₂ emissions', y1990: 412, y2000: 468, y2010: 521, y2024: 449, change: '+9.0%' },
  { indicator: 'Emissions per person', y1990: 7.7, y2000: 7.9, y2010: 8.1, y2024: 6.4, change: '−16.9%' },
  { indicator: 'Renewable share of electricity', y1990: 18.2, y2000: 20.5, y2010: 26.9, y2024: 43.7, change: '+140.1%' },
];
const columns: TableColumn<Row>[] = [
  { key: 'indicator', header: 'Indicator' },
  { key: 'y1990', header: '1990', numeric: true },
  { key: 'y2000', header: '2000', numeric: true },
  { key: 'y2010', header: '2010', numeric: true },
  { key: 'y2024', header: '2024', numeric: true },
  { key: 'change', header: 'Change since 1990', unit: 'per cent', numeric: true },
];

const meta: Meta<typeof Table<Row>> = { title: 'Data/Table', component: Table, args: { columns, rows, caption: 'Indicators for the example country, 1990 to 2024. Illustrative values.' }, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 56rem)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Table<Row>>;

export const Structure: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The caption names both the scrolling region and the table, and sits outside the scrolling area.
    const region = canvas.getByRole('region', { name: /Indicators for the example country/ });
    const table = canvas.getByRole('table', { name: /Indicators for the example country/ });
    await expect(region.contains(table)).toBe(true);
    await expect(region.contains(canvas.getByText(/Indicators for the example country/))).toBe(false);
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(6);
    await expect(canvas.getAllByRole('rowheader').map((h) => h.textContent)).toContain('Emissions per person');
  },
};

export const NumbersAreRightAlignedInTheFigureFace: Story = {
  play: async ({ canvasElement }) => {
    const cell = within(canvasElement).getByText('449');
    await expect(getComputedStyle(cell).textAlign).toBe('end');
    await expect(getComputedStyle(cell).fontFamily).toContain('Syn Figure');
    await expect(getComputedStyle(cell).fontFeatureSettings).toContain('tnum');
  },
};

export const UnitUnderTheHeader: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('columnheader', { name: /Change since 1990.*per cent/ })).toBeInTheDocument();
  },
};

export const GroupedHeaders: Story = {
  args: { groups: [{ label: '', span: 1 }, { label: 'Level', span: 4 }, { label: 'Change', span: 1 }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('columnheader', { name: 'Level' })).toHaveAttribute('colspan', '4');
    // Each group label's cell covers exactly the columns it spans, edge to edge.
    const heads = canvas.getAllByRole('columnheader').filter((h) => !h.hasAttribute('colspan'));
    const edges = (el: Element) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; };
    const level = edges(canvas.getByRole('columnheader', { name: 'Level' }));
    const change = edges(canvas.getByRole('columnheader', { name: 'Change' }));
    await expect(level).toEqual([edges(heads[1])[0], edges(heads[4])[1]]);
    await expect(change).toEqual(edges(heads[5]));
    // The empty cell sits over the Indicator column, and its text sits in the middle of its own span.
    const gap = canvasElement.querySelector('thead tr:first-child td') as HTMLElement;
    await expect(edges(gap)).toEqual(edges(heads[0]));
    await expect(getComputedStyle(canvas.getByRole('columnheader', { name: 'Level' })).textAlign).toBe('center');
  },
};

export const SelectedRow: Story = {
  args: { selectedIndex: 1 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('row')[2]).toHaveAttribute('aria-selected', 'true');
  },
};

export const Striped: Story = { args: { striped: true, size: 'small' } };

export const NarrowKeepsTheFirstColumnAndScrollsInsideItsRegion: Story = {
  decorators: [(Story) => <div style={{ width: 'min(100%, 20rem)', padding: 'var(--syn-space-3)' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: /Indicators/ });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    // The page does not scroll sideways; the region does, and it can be reached by keyboard.
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await expect(region).toHaveAttribute('tabindex', '0');
    const first = canvas.getByRole('rowheader', { name: 'Total CO₂ emissions' });
    const before = first.getBoundingClientRect().left;
    region.scrollLeft = 200;
    await expect(Math.abs(first.getBoundingClientRect().left - before)).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(first).position).toBe('sticky');
    region.scrollLeft = 0;
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' }, args: { selectedIndex: 0 } };
