import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { anomaly, composition, compositionNames, emitters, observed, scenarios } from '../../specimens/data';
import { Chart, chartTable, type ChartSeries } from './Chart';

const panel = (width = 'min(100%, 56rem)') => (Story: () => ReactElement) => (
  <div style={{ padding: 'var(--syn-space-4)', width }}>
    <div style={{ padding: 'var(--syn-space-3)', borderRadius: 'var(--syn-radius-card)', background: 'var(--syn-data-surface)' }}><Story /></div>
  </div>
);

const years = observed.map((p) => p.year);
const lineSeries: ChartSeries[] = [
  { name: 'Observed', x: years, y: observed.map((p) => p.value), slot: 1 },
  { name: 'Current policies', projected: true, x: scenarios[0].points.map((p) => p.year), y: scenarios[0].points.map((p) => p.value), band: { low: scenarios[0].points.map((p) => p.low), high: scenarios[0].points.map((p) => p.high), label: '66% range' }, slot: 2 },
  { name: 'Net zero pathway', projected: true, x: scenarios[2].points.map((p) => p.year), y: scenarios[2].points.map((p) => p.value), slot: 3 },
];

const meta: Meta<typeof Chart> = { title: 'Data/Chart', component: Chart, args: { yTitle: 'GtCO₂ a year', ariaLabel: 'Annual emissions, observed to 2024 with two projections to 2050.' }, decorators: [panel()] };
export default meta;
type Story = StoryObj<typeof Chart>;

const drawn = async (el: HTMLElement) => waitFor(() => expect(el.querySelector('.main-svg')).not.toBeNull(), { timeout: 8000 });
const svgText = (el: HTMLElement) => [...el.querySelectorAll('.main-svg text')].map((t) => t.textContent).join('|');

export const ObservedAndProjections: Story = {
  args: { series: lineSeries, projectionFrom: 2024, referenceX: { x: 2030, label: '2030 milestone' } },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    await expect(within(canvasElement).getByRole('img', { name: /Annual emissions/ })).toBeInTheDocument();
    await waitFor(() => expect(svgText(canvasElement)).toContain('Projection'));
    await expect(svgText(canvasElement)).toContain('2030 milestone');
    // With few lines and room, lines are named directly at their ends.
    await expect(svgText(canvasElement)).toContain('Net zero pathway');
  },
};

export const LabelsClearTheBandAndTheAxisEndsAtTheData: Story = {
  args: { series: lineSeries, projectionFrom: 2024 },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    await waitFor(() => expect(svgText(canvasElement)).toContain('Observed'));
    const box = (e: Element) => e.getBoundingClientRect();
    const band = canvasElement.querySelector('.scatterlayer path.js-fill');
    await expect(band).not.toBeNull();
    const b = box(band!);
    const labels = [...canvasElement.querySelectorAll('g.annotation')].filter((g) => ['Observed', 'Current policies', 'Net zero pathway'].includes(g.textContent ?? ''));
    await expect(labels).toHaveLength(3);
    // No direct label overlaps the range band.
    for (const label of labels) {
      const r = box(label);
      const overlaps = r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
      await expect(overlaps).toBe(false);
    }
    // Labels do not overlap each other.
    for (let i = 0; i < labels.length; i += 1) for (let j = i + 1; j < labels.length; j += 1) {
      const a = box(labels[i]); const c = box(labels[j]);
      await expect(a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top).toBe(false);
    }
    // The x-axis ends at the last data year, not at a padded tick.
    const ticks = [...canvasElement.querySelectorAll('.xtick text')].map((t) => t.textContent);
    await expect(ticks).toContain('2050');
    await expect(ticks).not.toContain('2060');
    // The plot uses the width: the labels end near the right edge of the chart.
    const svg = box(canvasElement.querySelector('.main-svg')!);
    const rightmost = Math.max(...labels.map((l) => box(l).right));
    await expect(svg.right - rightmost).toBeLessThanOrEqual(48);
  },
};

export const LegendTogglesSeriesAndKeepsOne: Story = {
  args: { series: lineSeries.slice(0, 2) },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const canvas = within(canvasElement);
    const observedKey = canvas.getByRole('button', { name: 'Observed' });
    const policiesKey = canvas.getByRole('button', { name: 'Current policies (projection)' });
    await expect(observedKey).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(observedKey);
    await expect(observedKey).toHaveAttribute('aria-pressed', 'false');
    // The last visible series cannot be hidden.
    await userEvent.click(policiesKey);
    await expect(policiesKey).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(observedKey);
    await expect(observedKey).toHaveAttribute('aria-pressed', 'true');
  },
};

export const LegendNamesTheBand: Story = {
  args: { series: lineSeries },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('66% range')).toBeInTheDocument();
  },
};

const withBand = (i: number, label: string): ChartSeries => ({ ...lineSeries[1], name: `Path ${i + 1}`, slot: i + 2, band: { low: scenarios[i].points.map((p) => p.low), high: scenarios[i].points.map((p) => p.high), label }, x: scenarios[i].points.map((p) => p.year), y: scenarios[i].points.map((p) => p.value) });

export const SeveralRangesShareOneNeutralKey: Story = {
  args: { series: [lineSeries[0], withBand(0, '66% range'), withBand(1, '66% range'), withBand(2, '66% range')] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One swatch for three ranges would wear one path's colour: the key is neutral and says so.
    await expect(canvas.getAllByText(/66% range/)).toHaveLength(1);
    await expect(canvas.getByText('66% range, in each path’s colour')).toBeInTheDocument();
    const swatch = canvas.getByText(/in each path/).previousElementSibling as HTMLElement;
    const seriesSwatches = [...canvasElement.querySelectorAll('button svg line')].map((l) => getComputedStyle(l).stroke);
    await expect(seriesSwatches).not.toContain(getComputedStyle(swatch).backgroundColor);
  },
};

export const RangesWithDifferentNamesEachGetTheirOwnSwatch: Story = {
  args: { series: [lineSeries[0], withBand(0, 'Range, path 1'), withBand(1, 'Range, path 2')] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByText('Range, path 1').previousElementSibling as HTMLElement;
    const second = canvas.getByText('Range, path 2').previousElementSibling as HTMLElement;
    await expect(getComputedStyle(first).backgroundColor).not.toBe(getComputedStyle(second).backgroundColor);
  },
};

export const NarrowDropsDirectLabelsAndKeepsTheLegend: Story = {
  decorators: [panel('min(100%, 22rem)')],
  args: { series: lineSeries },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    await waitFor(() => expect(svgText(canvasElement)).not.toContain('Net zero pathway'));
    await expect(within(canvasElement).getByRole('button', { name: 'Net zero pathway (projection)' })).toBeInTheDocument();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};

export const RankingBars: Story = {
  args: { series: [{ name: 'GtCO₂ in 2024', kind: 'bar', x: emitters.map((e) => e.name).reverse(), y: emitters.map((e) => e.value).reverse() }], orientation: 'h', yTitle: 'Country', xTitle: 'GtCO₂ in 2024', showLegend: false, ariaLabel: 'Emissions in 2024 for eight countries, largest first.' },
  play: async ({ canvasElement }) => { await drawn(canvasElement); await expect(svgText(canvasElement)).toContain('Country A'); },
};

export const StackedShareOfTotal: Story = {
  args: { series: compositionNames.map((name, k): ChartSeries => ({ name, kind: 'area', x: composition.map((c) => c.year), y: composition.map((c) => c.parts[k]), slot: k === 3 ? 9 : k + 1 })), stackedAreaMode: 'percent', yTitle: 'Share of CO₂-equivalent (%)', ariaLabel: 'Share of greenhouse gas emissions by gas.' },
  play: async ({ canvasElement }) => { await drawn(canvasElement); await expect(within(canvasElement).getAllByRole('button')).toHaveLength(4); },
};

export const SecondAxis: Story = {
  args: { series: [{ name: 'Emissions', x: years, y: observed.map((p) => p.value) }, { name: 'Anomaly', axis: 'y2', x: anomaly.map((a) => a.year), y: anomaly.map((a) => a.value) }], y2Title: '°C', ariaLabel: 'Emissions with temperature anomaly on a second axis.' },
  play: async ({ canvasElement }) => { await drawn(canvasElement); await expect(svgText(canvasElement)).toContain('°C'); },
};

export const MarkersAreNotJoined: Story = {
  args: {
    series: [{ name: 'Annual readings', kind: 'marker', x: observed.map((p) => p.value), y: observed.map((p, i) => 0.04 * (p.value - 22) + 0.08 * Math.sin(i * 1.7)) }],
    xTitle: 'Emissions, GtCO₂ a year', yTitle: 'Temperature anomaly, °C', ariaLabel: 'Each year plotted as a point: emissions against temperature anomaly. Illustrative values.',
  },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    // One point per reading, and no line drawn through them.
    await waitFor(() => expect(canvasElement.querySelectorAll('.scatterlayer .points path.point')).toHaveLength(observed.length));
    await expect(canvasElement.querySelector('.scatterlayer .lines path')).toBeNull();
    // The legend key is a dot, in the series colour.
    await expect(within(canvasElement).getByRole('button', { name: 'Annual readings' })).toBeInTheDocument();
  },
};

export const TableOfTheValues: Story = {
  args: { series: lineSeries.slice(0, 2) },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const { columns, rows } = chartTable(lineSeries.slice(0, 2), 'Year');
    await expect(columns.map((c) => c.header)).toEqual(['Year', 'Observed', 'Current policies (projection)']);
    await expect(rows[0]).toMatchObject({ x: 1990 });
    await expect(rows.length).toBe(new Set([...lineSeries[0].x, ...lineSeries[1].x]).size);
  },
};

export const NightAndTidewater: Story = { args: { series: lineSeries, projectionFrom: 2024 }, globals: { theme: 'tidewater' } };
