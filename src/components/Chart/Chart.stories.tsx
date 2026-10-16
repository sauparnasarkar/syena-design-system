import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { anomaly, composition, countryObserved, compositionNames, emitters, observed, scenarios } from '../../specimens/data';
import { Chart, chartTable, signedText, type ChartSeries } from './Chart';

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

const decades = ['1990s', '2000s', '2010s', '2020s'];
const parts = [[62, 66, 70, 72], [22, 20, 18, 16], [6, 6, 6, 6], [10, 8, 6, 6]].map((row, k) => row.map((v, i) => v * (1 + 0.15 * i) * (1 + 0.1 * k)));

export const PercentStackedBarsShowSharesOfEachTotal: Story = {
  args: {
    series: compositionNames.map((name, k): ChartSeries => ({ name, kind: 'bar', x: decades, y: parts[k], slot: k === 3 ? 9 : k + 1 })),
    barmode: 'percent', yTitle: 'Share of CO₂-equivalent (%)', ariaLabel: 'Share of greenhouse gas emissions by gas in each decade, bars stacked to 100 percent. Illustrative values.',
  },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll('.barlayer .point')).toHaveLength(16));
    // The totals differ (the inputs are not shares), but every bar is stacked to the same full height.
    const bars = [...canvasElement.querySelectorAll<SVGPathElement>('.barlayer .point')].map((b) => b.getBBox());
    const byColumn = new Map<number, number>();
    for (const b of bars) byColumn.set(Math.round(b.x), (byColumn.get(Math.round(b.x)) ?? 0) + b.height);
    const heights = [...byColumn.values()];
    await expect(heights).toHaveLength(4);
    await expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1.5);
    await expect(svgText(canvasElement)).toContain('100');
  },
};

export const BarsColouredByASecondValue: Story = {
  args: {
    series: [{ name: 'Emissions in 2024', kind: 'bar', x: emitters.map((e) => e.name), y: emitters.map((e) => e.value), colorValues: emitters.map((_, i) => 6 + i * 3), colorLabel: 'Reduction under the scenario, %', formatColorValue: (v: number) => `${v}%`, slot: 1 }],
    yTitle: 'GtCO₂ in 2024', showLegend: true, ariaLabel: 'Emissions in 2024 for eight countries, each bar coloured by its reduction under a scenario. Illustrative values.',
  },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll('.barlayer .point')).toHaveLength(emitters.length));
    // Bars with larger values are drawn in different colours, one step of the ramp apart at the ends.
    const fills = [...canvasElement.querySelectorAll<SVGPathElement>('.barlayer .point path')].map((b) => getComputedStyle(b).fill);
    await expect(new Set(fills).size).toBe(emitters.length);
    // The legend does not show a solid swatch in a colour no bar uses: the key is the ramp.
    await expect(canvasElement.querySelector('button [class*="__swatch__"]')).toBeNull();
    await expect(canvasElement.querySelector('button [class*="__rampSwatch__"]')).not.toBeNull();
    // The ramp names what the colour measures and labels both ends.
    await expect(canvas.getAllByText('Reduction under the scenario, %').length).toBeGreaterThan(0);
    await expect(canvas.getByText('6%')).toBeInTheDocument();
    await expect(canvas.getByText('27%')).toBeInTheDocument();
    // The values are in the table form too.
    const { columns } = chartTable([{ name: 'Emissions in 2024', kind: 'bar', x: ['a'], y: [1], colorValues: [5], colorLabel: 'Reduction' }]);
    await expect(columns.map((c) => c.header)).toEqual(['Period', 'Emissions in 2024', 'Emissions in 2024: Reduction']);
  },
};

const yoy = countryObserved.slice(1).map((p, i) => ({ year: p.year, change: ((p.value - countryObserved[i].value) / countryObserved[i].value) * 100 }));

export const SignedBarsColourRisesAndFallsAndSayThemInWords: Story = {
  args: {
    series: [{ name: 'Year-on-year change', kind: 'bar', signed: 'change', x: yoy.map((d) => d.year), y: yoy.map((d) => Number(d.change.toFixed(1))) }],
    yTitle: 'Change on the year before (%)', ariaLabel: 'Year-on-year change in annual emissions for the example country from 1991 to 2024: rises to about 2010, falls after. Illustrative values.',
  },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll('.barlayer .point')).toHaveLength(yoy.length));
    const probe = (css: string) => { const p = document.createElement('span'); p.style.color = css; canvasElement.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const fall = probe('var(--syn-data-change-decrease)');
    const rise = probe('var(--syn-data-change-increase)');
    const bars = [...canvasElement.querySelectorAll<SVGPathElement>('.barlayer .point path')].map((b) => getComputedStyle(b).fill);
    // A change that rounds to zero has no bar, so only bars with a height are checked.
    yoy.forEach((d, i) => { const v = Number(d.change.toFixed(1)); if (v !== 0) expect(bars[i]).toBe(v < 0 ? fall : rise); });
    await expect(bars).toContain(fall);
    await expect(bars).toContain(rise);
    // The legend keeps only the two signs (no repeated series entry), each with a glyph, so colour is not the only carrier.
    await expect(canvas.queryByRole('button', { name: 'Year-on-year change' })).toBeNull();
    await expect(canvas.getByText('Falls')).toBeInTheDocument();
    await expect(canvas.getByText('Rises')).toBeInTheDocument();
    // And the values are written with their sign and the true minus in the table form.
    const { rows } = chartTable([{ name: 'a', kind: 'bar', signed: 'change', x: ['x', 'y', 'z'], y: [2.5, -1.25, 0] }]);
    await expect(rows.map((r) => r.s0)).toEqual(['+2.5', '\u22121.25', '0']);
    await expect(signedText(-3)).toBe('\u22123');
  },
};

export const SignedBarsCanUseTheDivergingRamp: Story = {
  args: {
    series: [{ name: 'Anomaly', kind: 'bar', signed: 'diverging', signLabels: ['Below the baseline', 'Above the baseline'], x: anomaly.map((a) => a.year), y: anomaly.map((a) => Number(a.value.toFixed(2))) }],
    yTitle: '°C against the 1991 to 2020 baseline', ariaLabel: 'Yearly temperature anomaly from 2004 to 2024 against the 1991 to 2020 baseline. Illustrative values.',
  },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll('.barlayer .point')).toHaveLength(anomaly.length));
    await expect(canvas.getByText('Below the baseline')).toBeInTheDocument();
    await expect(canvas.getByText('Above the baseline')).toBeInTheDocument();
    const fills = new Set([...canvasElement.querySelectorAll<SVGPathElement>('.barlayer .point path')].map((b) => getComputedStyle(b).fill));
    await expect(fills.size).toBe(2);
  },
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
    // Every marker is drawn whole, including the ones on the edges of the plot: the trace is not clipped at the axes,
    // and each marker lies inside the chart's own box.
    const box = (canvasElement.querySelector('.main-svg') as SVGElement).getBoundingClientRect();
    const markers = [...canvasElement.querySelectorAll<SVGPathElement>('.scatterlayer .points path.point')];
    for (let e: Element | null = markers[0]; e && e.tagName.toLowerCase() !== 'svg'; e = e.parentElement) await expect(getComputedStyle(e).clipPath).toBe('none');
    for (const m of markers) {
      const r = m.getBoundingClientRect();
      await expect(r.left).toBeGreaterThanOrEqual(box.left); await expect(r.right).toBeLessThanOrEqual(box.right);
      await expect(r.top).toBeGreaterThanOrEqual(box.top); await expect(r.bottom).toBeLessThanOrEqual(box.bottom);
    }
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
