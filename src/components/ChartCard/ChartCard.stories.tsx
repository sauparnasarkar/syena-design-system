import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '../../lib/colour';
import { observed, scenarios } from '../../specimens/data';
import { illustrativeEmissions } from '../../specimens/countryValues';
import { Button } from '../Button/Button';
import { Chart, chartTable, type ChartSeries } from '../Chart/Chart';
import { Choropleth } from '../Choropleth/Choropleth';
import { Slider } from '../Slider/Slider';
import { withScreen } from '../storyScreen';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
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

export const ChildrenCanBeToldWhetherTheCardIsExpanded: Story = {
  args: { expandable: true, children: (expanded: boolean) => <p>{expanded ? 'Expanded chart' : 'Compact chart'}</p> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Compact chart')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Annual emissions' }));
    await expect(await canvas.findByText('Expanded chart')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.getByText('Compact chart')).toBeInTheDocument());
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

const toHex = (css: string) => `#${(css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
const opaqueBehind = (el: HTMLElement) => {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (!/rgba?\(0, 0, 0, 0\)|transparent/.test(c)) return c; }
  throw new Error('nothing opaque behind the text');
};
/** Every piece of text inside the panel reads on what is directly behind it. */
const expectTextReads = async (panel: HTMLElement) => {
  const texts = [...panel.querySelectorAll<HTMLElement>('*')].filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent?.trim()));
  await expect(texts.length).toBeGreaterThan(0);
  for (const e of texts) await expect(`${e.textContent?.trim()} ${contrastRatio(toHex(getComputedStyle(e).color), toHex(opaqueBehind(e))) >= 4.5}`).toMatch(/true$/);
};

export const ThePanelsTextReadsOnItInTheLightTheme: Story = {
  globals: { theme: 'tidewater' },
  args: { state: 'error', onRetry: fn() },
  play: async ({ canvasElement }) => { await expectTextReads(canvasElement.querySelector('section > div') as HTMLElement); },
};

export const ThePanelsTextReadsOnItInTheNightTheme: Story = {
  globals: { theme: 'night' },
  args: { state: 'error', onRetry: fn() },
  play: async ({ canvasElement }) => { await expectTextReads(canvasElement.querySelector('section > div') as HTMLElement); },
};

/** On a phone turned sideways the expanded card stays clear of the notch and the home bar. */
export const ExpandedCardStaysInsideTheSafeArea: Story = {
  args: { expandable: true },
  play: ({ canvasElement }) => withScreen({ width: 844, height: 390, insets: { left: 47, right: 47, bottom: 21 } }, async () => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Annual emissions' }));
    const dialog = await canvas.findByRole('dialog', { name: 'Annual emissions' });
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(47);
    await expect(document.documentElement.clientWidth - box.right).toBeGreaterThanOrEqual(47);
    await expect(window.innerHeight - box.bottom).toBeGreaterThanOrEqual(21);
  }),
};

/** A finger drag, as the browser would deliver it; true when the page's own scrolling was stopped. */
function dragIsStopped(target: Element, fromY: number, toY: number) {
  const at = (y: number) => new Touch({ identifier: 1, target, clientX: 20, clientY: y });
  const send = (type: string, y: number, live: boolean) => {
    const event = new TouchEvent(type, { bubbles: true, cancelable: true, touches: live ? [at(y)] : [], targetTouches: live ? [at(y)] : [], changedTouches: [at(y)] });
    target.dispatchEvent(event);
    return event;
  };
  send('touchstart', fromY, true);
  const move = send('touchmove', toY, true);
  send('touchend', toY, false);
  return move.defaultPrevented;
}

/** While a card is expanded the page behind it does not scroll, and it is given back when the card closes. */
export const ExpandedCardLocksThePage: Story = {
  args: { expandable: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Expand Annual emissions' }));
    await canvas.findByRole('dialog', { name: 'Annual emissions' });
    await expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    await expect(getComputedStyle(document.body).overflow).toBe('hidden');
    await expect(dragIsStopped(canvasElement, 400, 300)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(document.documentElement.style.overflow).toBe('');
    await expect(document.body.style.overflow).toBe('');
    await expect(dragIsStopped(canvasElement, 400, 300)).toBe(false);
  },
};

/** The slot a phone 320 pixels wide leaves a card: the page's gutters and the card's own padding are taken off. */
const narrowSlot = 288;

/** In a slot as narrow as a small phone's, the header's controls drop below the title instead of widening the card past the slot. */
export const HeaderWrapsInANarrowSlot: Story = {
  args: {
    title: 'CO₂ Emissions by Country (2024)',
    expandable: true,
    actions: <SegmentedControl ariaLabel="Basis" items={[{ value: 'absolute', label: 'Absolute' }, { value: 'cumulative', label: 'Cumulative' }]} value="absolute" onChange={() => {}} size="small" />,
  },
  // A grid cell, as on a page: it takes the width its content needs unless that is held to the slot.
  decorators: [(Story) => <div style={{ display: 'grid', gridTemplateColumns: '1fr', width: narrowSlot }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('heading', { name: 'CO₂ Emissions by Country (2024)' }).closest('section') as HTMLElement;
    const slot = card.parentElement as HTMLElement;
    const slotBox = slot.getBoundingClientRect();
    await waitFor(() => expect(card.getBoundingClientRect().right).toBeLessThanOrEqual(slotBox.right + 1));
    await expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(narrowSlot + 1);
    const control = canvas.getByRole('radiogroup', { name: 'Basis' }).getBoundingClientRect();
    await expect(control.right).toBeLessThanOrEqual(slotBox.right + 1);
    await expect(control.left).toBeGreaterThanOrEqual(slotBox.left - 1);
    // The controls sit below the title, not beside it.
    const title = canvas.getByRole('heading', { name: 'CO₂ Emissions by Country (2024)' }).getBoundingClientRect();
    await expect(control.top).toBeGreaterThanOrEqual(title.bottom - 1);
  },
};

/** Wide enough for the title and the controls on one line, they stay on one line. */
export const HeaderKeepsOneLineWhenItFits: Story = {
  args: { title: 'Annual emissions', actions: <SegmentedControl ariaLabel="Basis" items={[{ value: 'absolute', label: 'Absolute' }, { value: 'cumulative', label: 'Cumulative' }]} value="absolute" onChange={() => {}} size="small" /> },
  decorators: [(Story) => <div style={{ display: 'grid', gridTemplateColumns: '1fr', width: 360 }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole('heading', { name: 'Annual emissions' }).getBoundingClientRect();
    const control = canvas.getByRole('radiogroup', { name: 'Basis' }).getBoundingClientRect();
    await expect(control.top).toBeLessThan(title.bottom);
  },
};

// A card whose body is the mid-tone map panel: the year controls, the buttons, the map and its legend are all on it, and read there in either theme
// (axe checks every text pair in the story's own run).
const mapCard = (
  <>
    <div style={{ display: 'flex', gap: 'var(--syn-space-3)', alignItems: 'center', flexWrap: 'wrap', marginBlockEnd: 'var(--syn-space-2)' }}>
      <Button variant="ghost">Play</Button>
      <div style={{ flex: 1 }}><Slider label="Year" min={1970} max={2024} step={1} value={2024} onChange={() => {}} showValue={false} showRangeLabels showThumbValue /></div>
    </div>
    <div style={{ display: 'flex', gap: 'var(--syn-space-2)', flexWrap: 'wrap', marginBlockEnd: 'var(--syn-space-2)' }}>
      {[1970, 1990, 2024].map((y) => <Button key={y} size="small" variant={y === 2024 ? 'primary' : 'secondary'} aria-pressed={y === 2024}>{y}</Button>)}
    </div>
    <Choropleth values={illustrativeEmissions} scale="bands" surface="map" flush outline={['CHN', 'USA', 'IND', 'RUS']} unit="MtCO₂" valueLabel="CO₂ emitted in 2024, MtCO₂ (illustrative)" ariaLabel="World map of annual CO₂ emissions by country in 2024, coloured in 8 bands from pale yellow (lowest) to dark red (highest), illustrative values." />
  </>
);
const onTheMapPanel: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const panel = canvasElement.querySelector('.syn-map-panel') as HTMLElement;
  await expect(panel).not.toBeNull();
  const colour = (el: Element, prop: 'color' | 'backgroundColor' | 'borderTopColor') => {
    const [r, g, b] = getComputedStyle(el)[prop].match(/\d+/g)!.map(Number);
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  };
  // The panel is the map panel, not the dark data panel, and the controls read on it: the ghost button's text, and the pressed button's text on its tint and its border on the panel.
  const ghost = canvas.getByRole('button', { name: 'Play' });
  await expect(contrastRatio(colour(ghost, 'color'), colour(panel, 'backgroundColor'))).toBeGreaterThanOrEqual(4.5);
  const pressed = canvas.getByRole('button', { name: '2024', pressed: true });
  await expect(contrastRatio(colour(pressed, 'color'), colour(pressed, 'backgroundColor'))).toBeGreaterThanOrEqual(4.5);
  await expect(contrastRatio(colour(pressed, 'borderTopColor'), colour(panel, 'backgroundColor'))).toBeGreaterThanOrEqual(3); // a pressed button is marked by its border and text, on a faint tint
  await expect(canvas.getByRole('slider', { name: 'Year' })).toBeInTheDocument();
};
export const MapSurface: Story = { args: { surface: 'map', title: 'Where emissions come from, 2024', supportText: 'Annual MtCO₂', children: mapCard }, globals: { theme: 'tidewater' }, play: onTheMapPanel };
export const MapSurfaceNight: Story = { args: { surface: 'map', title: 'Where emissions come from, 2024', supportText: 'Annual MtCO₂', children: mapCard }, globals: { theme: 'night' }, play: onTheMapPanel };
