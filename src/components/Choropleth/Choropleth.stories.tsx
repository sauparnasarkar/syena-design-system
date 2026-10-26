import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { geoNaturalEarth1 } from 'd3-geo';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { coded } from '../../charts/map/countries';
import { expectHintBalanced, expectLegendFits } from '../../charts/map/legendChecks';
import { illustrativeEmissions } from '../../specimens/countryValues';
import { Choropleth } from './Choropleth';

const frame = (width = 'min(100%, 56rem)') => (Story: () => ReactElement) => <div style={{ padding: 'var(--syn-space-4)', width, background: 'var(--syn-data-surface)' }}><Story /></div>;

const meta: Meta<typeof Choropleth> = {
  title: 'Data/Choropleth',
  component: Choropleth,
  args: {
    values: illustrativeEmissions,
    valueLabel: 'CO₂ emissions in 2024, MtCO₂ (illustrative)',
    unit: 'MtCO₂',
    ariaLabel: 'World map of annual CO₂ emissions by country in 2024, illustrative values on a log scale from 0.01 to 10,000 MtCO₂. A few countries are deep red and most are pale yellow to orange; some have no data.',
  },
  decorators: [frame()],
};
export default meta;
type Story = StoryObj<typeof Choropleth>;

const channels = (css: string) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.body.appendChild(probe);
  const [r, g, b] = getComputedStyle(probe).color.match(/\d+/g)!.map(Number);
  probe.remove();
  return [r, g, b];
};
const pixelsNear = (canvas: HTMLCanvasElement, css: string, tolerance = 4) => {
  const [r, g, b] = channels(css);
  const d = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && Math.abs(d[i] - r) <= tolerance && Math.abs(d[i + 1] - g) <= tolerance && Math.abs(d[i + 2] - b) <= tolerance) n += 1;
  return n;
};
const map = (el: HTMLElement) => within(el).getByRole('img', { name: /World map of annual CO₂ emissions/ }) as HTMLCanvasElement;
// The map has been painted when it holds heat colours; counting the whole scale works at any width, where a few small no-data countries may not.
const heatPixels = (canvas: HTMLCanvasElement) => [1, 2, 3, 4, 5, 6, 7].reduce((n, i) => n + pixelsNear(canvas, `var(--syn-data-heat-${i})`, 6), 0);
const drawn = (el: HTMLElement) => waitFor(() => expect(heatPixels(map(el))).toBeGreaterThan(50), { timeout: 8000 });

export const Drawn: Story = {
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const canvas = map(canvasElement);
    // The no-data grey, the panel and several heat steps all appear.
    await expect(pixelsNear(canvas, 'var(--syn-data-no-data)')).toBeGreaterThan(20);
    const heat = [1, 2, 3, 4, 5, 6, 7].map((i) => pixelsNear(canvas, `var(--syn-data-heat-${i})`, 40));
    await expect(heat.filter((n) => n > 0).length).toBeGreaterThanOrEqual(3);
    await expect(canvas.width / canvas.height).toBeGreaterThan(1.7);
  },
};

export const LegendHasATickAtEveryPowerOfTen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expectLegendFits(canvasElement, { all: true }));
    for (const tick of ['0.01', '0.1', '1', '10', '100', '1,000', '10,000']) await expect(canvas.getByText(tick, { selector: 'li' })).toBeInTheDocument();
    await expect(canvas.getByText('No data', { selector: ':not(td)' })).toBeInTheDocument(); // the legend's; the table repeats it per country
  },
};

export const TextAlternativeListsEveryValue: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: /World map of annual CO₂ emissions/ });
    const rows = within(table).getAllByRole('row').slice(1).map((r) => [...r.children].map((c) => c.textContent));
    // Every value is listed; every other country follows, as having no data.
    await expect(rows.filter(([, text]) => text !== 'No data')).toHaveLength(Object.keys(illustrativeEmissions).length);
    await expect(rows.length).toBeGreaterThan(Object.keys(illustrativeEmissions).length);
    await expect(map(canvasElement)).toHaveAccessibleDescription(/World map of annual CO₂ emissions/);
  },
};

export const ControlsZoomResetAndTable: Story = {
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const canvas = within(canvasElement);
    const image = () => map(canvasElement).toDataURL();
    const start = image();
    const zoomOut = canvas.getByRole('button', { name: 'Zoom out map' });
    await expect(zoomOut).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in map' }));
    await waitFor(() => expect(image()).not.toBe(start));
    await expect(zoomOut).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(image()).toBe(start));
    const toggle = canvas.getByRole('button', { name: 'Table view' });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('table')).toBeVisible();
    await userEvent.click(toggle);
    await expect(canvasElement.querySelector('canvas')).toBeVisible();
  },
};

export const KeyboardMovesAndZoomsWithAVisibleHint: Story = {
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    await expect(within(canvasElement).getByText(/Arrow keys move the map/)).toBeVisible();
    const element = map(canvasElement);
    const image = () => element.toDataURL();
    const start = image();
    element.focus();
    // At full view nothing can be moved; after zooming in the arrow keys move the map, and 0 returns.
    await userEvent.keyboard('+');
    await waitFor(() => expect(image()).not.toBe(start));
    const zoomed = image();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(image()).not.toBe(zoomed));
    await userEvent.keyboard('0');
    await waitFor(() => expect(image()).toBe(start));
  },
};

export const OutlineMarksSelectedCountriesWithoutResettingTheView: Story = {
  args: { outline: ['BRA', 'IND'] },
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    // The outline is drawn in the panel's text colour.
    await waitFor(() => expect(pixelsNear(map(canvasElement), 'var(--syn-data-text)', 6)).toBeGreaterThan(30));
  },
};

export const NarrowKeepsTheMapAndLegend: Story = {
  decorators: [frame('min(100%, 20rem)')],
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    // At phone width the labels are thinned (both ends kept), stay inside the bar and never touch; the hint is two even lines.
    await waitFor(() => expectLegendFits(canvasElement, { all: false }));
    await waitFor(() => expectHintBalanced(canvasElement));
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
export const Night: Story = { globals: { theme: 'night' } };

export const TableRoundsValuesAndListsCountriesWithoutData: Story = {
  args: { values: { CHN: 12288.6666, USA: 4904.123, VNM: 370.456, FJI: 0.45678 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Table view' }));
    const rows = within(canvas.getByRole('table')).getAllByRole('row').slice(1).map((r) => [...r.children].map((c) => c.textContent));
    // Values first, largest first, rounded to three significant figures (whole numbers from a thousand): not 12,288.667 or 0.45678.
    await expect(rows.slice(0, 4)).toEqual([['China', '12,289'], ['United States of America', '4,904'], ['Vietnam', '370'], ['Fiji', '0.457']]);
    // Every other country is listed too, after them, as having no data: the table is the map's text alternative, and no data is part of what the map says.
    const rest = rows.slice(4);
    await expect(rest.length).toBeGreaterThan(150);
    await expect(rest.every(([, text]) => text === 'No data')).toBe(true);
    await expect(rest.map(([name]) => name)).toEqual([...rest.map(([name]) => name)].sort((a, b) => String(a).localeCompare(String(b))));
  },
};

// Where a country sits on the home view of the picture, found the way the map itself fits its shapes to the width.
const place = (picture: HTMLCanvasElement, lonLat: [number, number]) => {
  const box = picture.getBoundingClientRect();
  const at = geoNaturalEarth1().fitWidth(box.width, { type: 'FeatureCollection', features: coded.map((c) => c.shape) })(lonLat)!;
  return { box, x: box.left + at[0], y: box.top + at[1] };
};
const press = (picture: HTMLElement, x: number, y: number, pointerType = 'touch') => {
  const at = { clientX: x, clientY: y, pointerType, pointerId: 7, isPrimary: true };
  fireEvent.pointerDown(picture, at);
  fireEvent.pointerUp(picture, at);
};
const tapReadout = (root: HTMLElement) => (root.querySelector('[class*="_readoutTap"]') as HTMLElement | null)?.textContent?.trim() ?? '';

export const TapNamesACountryAndItsValueAndAnotherTapOrEscapeClearsIt: Story = {
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const picture = map(canvasElement);
    const india = place(picture, [78, 22]);
    await expect(tapReadout(canvasElement)).toBe('');
    // A tap, with no pointer ever hovering: the country and the same figure the table gives.
    press(picture, india.x, india.y);
    await waitFor(() => expect(tapReadout(canvasElement)).toMatch(/^India: /));
    await expect(tapReadout(canvasElement)).toContain(String(illustrativeEmissions.IND).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    // It sits over the picture, not below it where a tall map would put it out of sight.
    const chip = canvasElement.querySelector('[class*="_readoutTap"]') as HTMLElement;
    await expect(chip.getBoundingClientRect().top).toBeLessThan(india.box.top + 40);
    // A tap on the sea clears it.
    press(picture, india.box.left + 2, india.box.top + 2);
    await waitFor(() => expect(tapReadout(canvasElement)).toBe(''));
    press(picture, india.x, india.y);
    await waitFor(() => expect(tapReadout(canvasElement)).toMatch(/^India: /));
    picture.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tapReadout(canvasElement)).toBe(''));
  },
};

export const ADragMovesTheMapAndNamesNothing: Story = {
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const picture = map(canvasElement);
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Zoom in map' }));
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Zoom in map' }));
    const { x, y } = place(picture, [78, 22]);
    const at = (dx: number) => ({ clientX: x + dx, clientY: y, pointerType: 'touch', pointerId: 7, isPrimary: true });
    const start = picture.toDataURL();
    fireEvent.pointerDown(picture, at(0));
    fireEvent.pointerMove(picture, at(40));
    fireEvent.pointerUp(picture, at(40));
    await waitFor(() => expect(picture.toDataURL()).not.toBe(start));
    await expect(tapReadout(canvasElement)).toBe('');
  },
};

export const AMouseClickLeavesTheNamingToHover: Story = {
  play: async ({ canvasElement }) => {
    await drawn(canvasElement);
    const picture = map(canvasElement);
    const { x, y } = place(picture, [78, 22]);
    press(picture, x, y, 'mouse');
    await expect(tapReadout(canvasElement)).toBe('');
  },
};
