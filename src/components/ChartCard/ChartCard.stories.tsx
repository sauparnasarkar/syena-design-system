import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { observed, scenarios } from '../../specimens/data';
import { Chart, chartTable, type ChartSeries } from '../Chart/Chart';
import { Table } from '../Table/Table';
import { ChartCard } from './ChartCard';

const series: ChartSeries[] = [
  { name: 'Observed', x: observed.map((p) => p.year), y: observed.map((p) => p.value), slot: 1 },
  { name: 'Current policies', projected: true, slot: 2, x: scenarios[0].points.map((p) => p.year), y: scenarios[0].points.map((p) => p.value) },
];
const { columns, rows } = chartTable(series, 'Year');
const chart = <Chart series={series} yTitle="GtCO₂ a year" projectionFrom={2024} ariaLabel="Annual emissions to 2024 with a projection to 2050." />;
const table = <Table columns={columns as never} rows={rows as never} caption="Values behind the annual emissions chart" size="small" />;

const meta: Meta<typeof ChartCard> = {
  title: 'Data/ChartCard',
  component: ChartCard,
  args: { title: 'Annual emissions', supportText: 'GtCO₂ a year; observed to 2024, then current policies.', source: 'illustrative values for layout review', asOf: 'October 2026', children: chart },
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-4)', width: 'min(100%, 56rem)' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ChartCard>;

export const Anatomy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Annual emissions' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 3, name: 'Annual emissions' })).toBeInTheDocument();
    // The footer carries the source and the as-of date, and describes the card.
    await expect(canvas.getByText(/Source: illustrative values/)).toBeInTheDocument();
    await expect(canvas.getByText(/As of October 2026/)).toBeInTheDocument();
    await waitFor(() => expect(canvasElement.querySelector('.main-svg')).not.toBeNull(), { timeout: 8000 });
  },
};

export const StaleDataSaysSo: Story = {
  args: { stale: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/As of October 2026 \(stale\)/)).toBeInTheDocument();
  },
};

export const ViewAsTableSwapsTheChart: Story = {
  args: { tableView: table },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'View Annual emissions as a table' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('table', { name: /Values behind/ })).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(canvas.queryByRole('table')).toBeNull();
  },
};

export const ExpandsAndReturnsFocus: Story = {
  args: { expandable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const expand = canvas.getByRole('button', { name: 'Expand Annual emissions' });
    await userEvent.click(expand);
    const dialog = await canvas.findByRole('dialog', { name: 'Annual emissions' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(canvas.getByRole('button', { name: 'Expand Annual emissions' })).toHaveFocus();
  },
};

export const Loading: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByLabelText('Loading Annual emissions')).toHaveAttribute('aria-busy', 'true'); },
};

export const EmptySaysWhy: Story = {
  args: { state: 'empty', emptyMessage: 'No data for this country and period. Choose a different period.' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByText(/No data for this country/)).toBeInTheDocument(); },
};

export const ErrorOffersARetry: Story = {
  args: { state: 'error', onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

export const CardsInARowKeepTheirOwnHeight: Story = {
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-4)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--syn-layout-gutter)', width: 'min(100%, 72rem)' }}><Story /><ChartCard title="A short card" source="example" state="empty" emptyMessage="Nothing here.">{null}</ChartCard></div>],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('.main-svg')).not.toBeNull(), { timeout: 8000 });
    const [a, b] = [...canvasElement.querySelectorAll('section')].map((s) => s.getBoundingClientRect().height);
    await expect(Math.abs(a - b)).toBeGreaterThan(20);
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' }, args: { tableView: table } };
export const Night: Story = { globals: { theme: 'night' } };
