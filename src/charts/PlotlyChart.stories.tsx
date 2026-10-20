import type { Data } from 'plotly.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { anomaly, emitters, observed, scenarios, composition, compositionNames } from '../specimens/data';
import { divergingColour, projectionDash, seriesColour } from './palette';
import { PlotlyChart } from './PlotlyChart';
import { useChartTokens, type ChartTokens } from './tokens';

function Panel({ build, label, height = 320 }: { build: (t: ChartTokens) => { data: Data[]; layout?: object }; label: string; height?: number }) {
  const t = useChartTokens();
  if (!t) return null;
  const { data, layout } = build(t);
  return (
    <div style={{ padding: 'var(--syn-space-4)', width: 'min(100%, 900px)' }}>
      <div style={{ padding: 'var(--syn-space-3)', borderRadius: 'var(--syn-radius-card)', background: 'var(--syn-data-surface)' }}>
        <PlotlyChart data={data} layout={layout} ariaLabel={label} height={height} />
      </div>
    </div>
  );
}

const rendered = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await waitFor(() => expect(canvasElement.querySelector('.main-svg')).not.toBeNull(), { timeout: 8000 });
};

const lineWithRange = (t: ChartTokens) => {
  const sc = scenarios[0].points;
  const last = observed[observed.length - 1];
  const band = [...sc.map((p) => ({ x: p.year, y: p.high })), ...[...sc].reverse().map((p) => ({ x: p.year, y: p.low }))];
  const data: Data[] = [
    { type: 'scatter', mode: 'lines', name: '66% range', x: band.map((p) => p.x), y: band.map((p) => p.y), fill: 'toself', fillcolor: seriesColour(t, 1), opacity: t.bandOpacity, line: { width: 0 }, hoverinfo: 'skip' },
    { type: 'scatter', mode: 'lines', name: 'Observed', x: observed.map((p) => p.year), y: observed.map((p) => p.value), line: { color: seriesColour(t, 1) } },
    { type: 'scatter', mode: 'lines', name: 'Current policies (projection)', x: [last.year, ...sc.slice(1).map((p) => p.year)], y: [last.value, ...sc.slice(1).map((p) => p.value)], line: { color: seriesColour(t, 1), dash: projectionDash(t) } },
  ];
  return { data, layout: { yaxis: { title: { text: 'GtCO₂ a year' } } } };
};

const bars = (t: ChartTokens) => ({
  data: [{ type: 'bar', orientation: 'h', x: emitters.map((e) => e.value).reverse(), y: emitters.map((e) => e.name).reverse(), marker: { color: seriesColour(t, 1) }, name: 'GtCO₂ in 2024' } as Data],
  layout: { xaxis: { title: { text: 'GtCO₂ in 2024' } }, hovermode: 'closest' as const },
});

const diverging = (t: ChartTokens) => ({
  data: [{ type: 'bar', x: anomaly.map((a) => a.year), y: anomaly.map((a) => a.value), marker: { color: anomaly.map((a) => divergingColour(t, a.value, 0.5)) }, name: 'Anomaly' } as Data],
  layout: { yaxis: { title: { text: '°C against the 1991 to 2020 baseline' }, zeroline: true, zerolinecolor: t.annotation } },
});

const categorical = (t: ChartTokens) => ({
  data: compositionNames.map((name, k): Data => ({
    type: 'scatter', mode: 'lines', name, x: composition.map((c) => c.year), y: composition.map((c) => c.parts[k]),
    line: { color: k === 3 ? t.other : seriesColour(t, k + 1) },
  })),
  layout: { yaxis: { title: { text: 'Share of CO₂-equivalent (%)' }, rangemode: 'tozero' as const } },
});

const meta: Meta = { title: 'Charts/Themed Plotly chart', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const make = (build: Parameters<typeof Panel>[0]['build'], label: string): Story['render'] => () => <Panel build={build} label={label} />;
const LINE = 'Annual emissions, observed to 2024 with a projection to 2050 and its range.';
const BAR = 'Emissions in 2024 for eight countries, largest first.';
const DIV = 'Yearly temperature anomaly against the 1991 to 2020 baseline.';
const CAT = 'Share of greenhouse gas emissions by gas, four series.';

export const LineWithRangeNight: Story = { render: make(lineWithRange, LINE), play: rendered, globals: { theme: 'night' } };
export const LineWithRangeTidewater: Story = { render: make(lineWithRange, LINE), play: rendered, globals: { theme: 'tidewater' } };
export const BarNight: Story = { render: make(bars, BAR), play: rendered, globals: { theme: 'night' } };
export const BarTidewater: Story = { render: make(bars, BAR), play: rendered, globals: { theme: 'tidewater' } };
export const DivergingNight: Story = { render: make(diverging, DIV), play: rendered, globals: { theme: 'night' } };
export const DivergingTidewater: Story = { render: make(diverging, DIV), play: rendered, globals: { theme: 'tidewater' } };
export const CategoricalNight: Story = { render: make(categorical, CAT), play: rendered, globals: { theme: 'night' } };
export const CategoricalTidewater: Story = { render: make(categorical, CAT), play: rendered, globals: { theme: 'tidewater' } };

export const AFailedDrawSaysSoAndOffersAReload: StoryObj<typeof PlotlyChart> = {
  render: () => (
    <div style={{ padding: 'var(--syn-space-4)', width: 'min(100%, 900px)' }}>
      {/* A trace that throws when it is read makes the draw reject, as a chart that fails to load does. */}
      <PlotlyChart data={[{ type: 'scatter', get x(): never { throw new Error('unreadable'); }, y: [1, 2] } as unknown as Data]} ariaLabel="A chart that cannot be drawn" height={200} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert', undefined, { timeout: 8000 });
    await expect(alert).toHaveTextContent(/chart failed to load/i);
    await expect(within(canvasElement).getByRole('button', { name: 'Reload' })).toBeEnabled();
    // Not a blank panel: the failed chart is no longer announced as a picture.
    await expect(canvasElement.querySelector('[role="img"]')).toBeNull();
  },
};
