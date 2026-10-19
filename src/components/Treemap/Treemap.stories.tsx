import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { contrastRatio } from '../../lib/colour';
import { illustrativeEmissions } from '../../specimens/countryValues';
import { coded } from '../../charts/map/countries';
import { Treemap, type TreemapItem } from './Treemap';

const names = new Map(coded.map((c) => [c.code, c.name]));
const top = Object.entries(illustrativeEmissions).sort((a, b) => b[1] - a[1]).slice(0, 24);
// Illustrative: area is a country's emissions, colour its reduction under a scenario (a formula of its rank, not a measurement).
const byValue: TreemapItem[] = top.map(([code, value], i) => ({ id: code, label: names.get(code) ?? code, value, colorValue: 8 + ((i * 7) % 23) }));
const groupOf = (i: number) => ['Large economies', 'Mid-size economies', 'Smaller economies', 'Smallest'][Math.min(3, Math.floor(i / 6))];
const byGroup: TreemapItem[] = top.map(([code, value], i) => ({ id: code, label: names.get(code) ?? code, value, group: groupOf(i) }));

const frame = (width = 'min(100%, 56rem)') => (Story: () => ReactElement) => <div style={{ padding: 'var(--syn-space-4)', width, background: 'var(--syn-data-surface)' }}><Story /></div>;

const extras = (el: HTMLElement) => (el.querySelector('figure') as HTMLElement).getBoundingClientRect().height - (el.querySelector('[role="img"]') as HTMLElement).parentElement!.getBoundingClientRect().height;

const meta: Meta<typeof Treemap> = {
  title: 'Data/Treemap',
  component: Treemap,
  args: { items: byGroup, valueLabel: 'CO₂ emissions in 2024, MtCO₂ (illustrative)', unit: 'MtCO₂', ariaLabel: 'Treemap of annual CO₂ emissions for the 24 largest emitters in 2024, illustrative values. The tiles are sized by emissions and coloured by group of economy.' },
  decorators: [frame()],
};
export default meta;
type Story = StoryObj<typeof Treemap>;

const tilesOf = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[role="img"] > div')];
const painted = (el: HTMLElement) => waitFor(() => expect(tilesOf(el).length).toBeGreaterThan(5), { timeout: 8000 });

export const TilesAreSizedByValueAndFillTheStage: Story = {
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    const tiles = tilesOf(canvasElement);
    const stage = (tiles[0].parentElement as HTMLElement).getBoundingClientRect();
    const total = byGroup.reduce((s, i) => s + i.value, 0);
    let area = 0;
    for (const tile of tiles) {
      const r = tile.getBoundingClientRect();
      area += r.width * r.height;
      // Inside the stage.
      await expect(r.left).toBeGreaterThanOrEqual(stage.left - 1);
      await expect(r.right).toBeLessThanOrEqual(stage.right + 1);
      await expect(r.bottom).toBeLessThanOrEqual(stage.bottom + 1);
    }
    await expect(Math.abs(area - stage.width * stage.height) / (stage.width * stage.height)).toBeLessThan(0.01);
    // The largest tile is the largest value, with a share of the area close to its share of the total.
    const biggest = tiles.reduce((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height > b.getBoundingClientRect().width * b.getBoundingClientRect().height ? a : b));
    const share = (biggest.getBoundingClientRect().width * biggest.getBoundingClientRect().height) / (stage.width * stage.height);
    await expect(Math.abs(share - byGroup[0].value / total)).toBeLessThan(0.02);
  },
};

export const LabelsReadOnTheirTiles: Story = {
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    let checked = 0;
    for (const tile of tilesOf(canvasElement)) {
      const label = tile.querySelector('span');
      if (!label) continue;
      checked += 1;
      const probe = document.createElement('span');
      probe.style.color = getComputedStyle(tile).backgroundColor;
      canvasElement.appendChild(probe);
      const toHex = (css: string) => `#${(css.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
      const fill = toHex(getComputedStyle(probe).color);
      probe.remove();
      await expect(contrastRatio(toHex(getComputedStyle(tile).color), fill)).toBeGreaterThanOrEqual(4.5);
    }
    await expect(checked).toBeGreaterThan(3);
    // Small tiles have no label: their name is in the table view and the hover read-out.
    await expect(tilesOf(canvasElement).some((t) => !t.querySelector('span'))).toBe(true);
  },
};

export const HoverReadsOutTheTile: Story = {
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    const first = tilesOf(canvasElement)[0];
    await userEvent.hover(first);
    await waitFor(() => expect(within(canvasElement).getByText(/MtCO₂/, { selector: 'p' })).toBeInTheDocument());
  },
};

export const TableViewListsEveryTileLargestFirst: Story = {
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Table view' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    const table = canvas.getByRole('table', { name: /Treemap of annual CO₂ emissions/ });
    await expect(within(table).getAllByRole('row')).toHaveLength(byGroup.length + 1);
    const values = within(table).getAllByRole('cell').filter((c) => /^[\d,.]+$/.test(c.textContent ?? '')).map((c) => Number((c.textContent ?? '').replace(/,/g, '')));
    await expect(values).toEqual([...values].sort((a, b) => b - a));
    await userEvent.click(toggle);
    await expect(tilesOf(canvasElement).length).toBeGreaterThan(5);
  },
};

export const LegendNamesTheGroups: Story = {
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: 'Groups' });
    await expect(within(legend).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Large economies', 'Mid-size economies', 'Smaller economies', 'Smallest']);
  },
};

export const ColouredByAValue: Story = {
  args: { items: byValue, colorBy: 'value', colorLabel: 'Reduction under the scenario, %', formatColorValue: (v: number) => `${v}%`, ariaLabel: 'Treemap of annual CO₂ emissions for the 24 largest emitters in 2024, illustrative values, coloured by the reduction under a scenario.' },
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('Reduction under the scenario, %').length).toBeGreaterThan(0);
    // Tiles with a larger reduction are drawn in a different colour from tiles with a smaller one.
    const colours = new Set(tilesOf(canvasElement).map((t) => getComputedStyle(t).backgroundColor));
    await expect(colours.size).toBeGreaterThan(4);
    await userEvent.click(canvas.getByRole('button', { name: 'Table view' }));
    await expect(canvas.getByRole('columnheader', { name: 'Reduction under the scenario, %' })).toBeInTheDocument();
  },
};

export const DivergingColoursAreCentredOnZero: Story = {
  args: {
    items: byValue.map((i, k) => ({ ...i, colorValue: (k % 2 === 0 ? 1 : -1) * (5 + k) })),
    colorBy: 'value', diverging: true, colorLabel: '2040 against today, MtCO₂', formatColorValue: (v: number) => `${v > 0 ? '+' : v < 0 ? '\u2212' : ''}${Math.abs(v)}`,
    ariaLabel: 'Treemap of annual CO₂ emissions, each tile coloured by its change to 2040, illustrative values.',
  },
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    const canvas = within(canvasElement);
    // The ramp's ends are the same size either side of zero.
    const ends = canvasElement.querySelectorAll('[class*="__rampRow__"] > span:not([class*="__bar__"])');
    const [lo, hi] = [...ends].map((e) => (e.textContent ?? '').replace('\u2212', '-'));
    await expect(Math.abs(Number(lo))).toBe(Math.abs(Number(hi)));
    // Tiles below and above zero are different colours.
    const fills = new Set(tilesOf(canvasElement).map((t) => getComputedStyle(t).backgroundColor));
    await expect(fills.size).toBeGreaterThan(4);
    await expect(canvas.getAllByText('2040 against today, MtCO₂').length).toBeGreaterThan(0);
  },
};

export const TilesCanBeChosenWhereHoverIsNotAvailable: Story = {
  args: { onSelect: fn(), selectedId: 'CHN' },
  play: async ({ canvasElement, args }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('button[aria-pressed]').length).toBeGreaterThan(5), { timeout: 8000 });
    const canvas = within(canvasElement);
    // Each tile is a button named by what it shows (or, where it has no room for text, by its reading); the chosen one is marked.
    const china = canvas.getByRole('button', { name: /^China/ });
    await expect(china).toHaveAttribute('aria-pressed', 'true');
    const india = canvas.getByRole('button', { name: /^India/ });
    await expect(india).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(india);
    await expect(args.onSelect).toHaveBeenCalledWith('IND');
    india.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
  },
};

export const NarrowKeepsEveryTileInside: Story = {
  decorators: [frame('min(100%, 20rem)')],
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    const stage = (tilesOf(canvasElement)[0].parentElement as HTMLElement).getBoundingClientRect();
    for (const tile of tilesOf(canvasElement)) await expect(tile.getBoundingClientRect().right).toBeLessThanOrEqual(stage.right + 1);
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
export const Night: Story = { globals: { theme: 'night' } };

export const CompactKeepsEverythingButTheTilesToOneRow: Story = {
  args: { items: byValue, colorBy: 'value', colorLabel: 'Reduction by 2040, %', height: 300, compact: true },
  play: async ({ canvasElement }) => {
    await painted(canvasElement);
    // The colour key and the table switch share one row under the tiles.
    await expect(extras(canvasElement)).toBeLessThanOrEqual(48);
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Table view' });
    const key = canvasElement.querySelector('[class*="_ramp_"] > span') as HTMLElement;
    await expect(Math.abs(key.getBoundingClientRect().top + key.getBoundingClientRect().height / 2 - (button.getBoundingClientRect().top + button.getBoundingClientRect().height / 2))).toBeLessThanOrEqual(8);
    // Pointing at a tile reads it out over the tiles, without moving anything.
    const before = button.getBoundingClientRect().top;
    const tile = tilesOf(canvasElement)[0];
    tile.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    await userEvent.hover(tile);
    const readout = await waitFor(() => { const el = canvasElement.querySelector('[class*="_readoutCorner_"]') as HTMLElement; expect(el?.textContent).toMatch(/MtCO₂/); return el; });
    const stage = tile.parentElement!.getBoundingClientRect();
    await expect(readout.getBoundingClientRect().bottom).toBeLessThanOrEqual(stage.bottom + 1);
    await expect(button.getBoundingClientRect().top).toBe(before);
  },
};
