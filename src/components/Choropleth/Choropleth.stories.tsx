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

// Banded scale on the mid-tone map panel: eight fixed bands, darker = more, a step legend with counts, and a hatched no-data fill.
const bandPixels = (canvas: HTMLCanvasElement, tolerance = 6) => [1, 2, 3, 4, 5, 6, 7, 8].map((i) => pixelsNear(canvas, `var(--syn-data-band-${i})`, tolerance));
const bandedArgs = {
  scale: 'bands' as const,
  surface: 'map' as const,
  valueLabel: 'CO₂ emitted in 2024, MtCO₂ (illustrative)',
  ariaLabel: 'World map of annual CO₂ emissions by country in 2024, illustrative values coloured in 8 bands from pale yellow (lowest) to dark red (highest). A few countries are dark red and most are pale to orange; some have no data.',
};
const bandedMap = (el: HTMLElement) => within(el).getByRole('img', { name: /coloured in 8 bands/ }) as HTMLCanvasElement;

const bandedPlay: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(bandPixels(bandedMap(canvasElement)).filter((n) => n > 20).length).toBeGreaterThanOrEqual(4), { timeout: 8000 });
  // The step legend: eight swatches with a range under each and a count line, then the hatched No data swatch.
  const legend = canvas.getByRole('list', { name: /in 8 bands from lowest to highest/ });
  await expect(within(legend).getAllByRole('listitem')).toHaveLength(8);
  await expect(within(legend).getByText('<1')).toBeInTheDocument();
  await expect(within(legend).getByText('2.5k+')).toBeInTheDocument();
  await expect(within(legend).getAllByText(/countr(y|ies)$/)).toHaveLength(8);
  await expect(canvas.getByText('No data', { selector: 'span' })).toBeInTheDocument();
  // The table says which band each value is in.
  await userEvent.click(canvas.getByRole('button', { name: 'Table view' }));
  const table = canvas.getByRole('table');
  await expect(within(table).getByRole('columnheader', { name: 'Band' })).toBeInTheDocument();
  await expect(within(table).getAllByText('2.5k+').length).toBeGreaterThan(0);
};

export const BandsOnTheMapPanel: Story = { args: bandedArgs, decorators: [frame()], globals: { theme: 'tidewater' }, play: bandedPlay };
export const BandsOnTheMapPanelNight: Story = { args: bandedArgs, decorators: [frame()], globals: { theme: 'night' }, play: bandedPlay };

export const BandedNarrowShowsTwoRowsOfFour: Story = {
  args: bandedArgs,
  decorators: [frame('min(100%, 22rem)')],
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: /in 8 bands from lowest to highest/ });
    await waitFor(() => {
      const tops = [...legend.children].map((li) => Math.round(li.getBoundingClientRect().top));
      expect(new Set(tops).size).toBe(2);
      expect(tops.filter((t) => t === tops[0])).toHaveLength(4);
    });
    // the count lines are not drawn at this width (the ranges are), but they stay in the page for a screen reader
    const counts = within(legend).getAllByText(/countr(y|ies)$/);
    await expect(counts).toHaveLength(8);
    await expect(counts[0].getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};

export const BandedHoverNamesTheBand: Story = {
  args: bandedArgs,
  decorators: [frame()],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bandPixels(bandedMap(canvasElement)).filter((n) => n > 20).length).toBeGreaterThanOrEqual(4), { timeout: 8000 });
    const canvas = bandedMap(canvasElement);
    const rect = canvas.getBoundingClientRect();
    // China, by its place on the natural-earth projection of this width.
    const p = geoNaturalEarth1().fitWidth(rect.width, { type: 'FeatureCollection', features: coded.map((c) => c.shape) });
    const at = p([104, 35])!;
    fireEvent.pointerMove(canvas, { clientX: rect.left + at[0], clientY: rect.top + at[1], pointerType: 'mouse' });
    await waitFor(() => expect(within(canvasElement).getByText(/China: .* · band /)).toBeInTheDocument());
  },
};

// Every country with a value is counted in its band, drawn or not: the bands add up to the number of values (a code with no shape on the map still counts).
export const BandCountsAddUpToEveryValue: Story = {
  args: { ...bandedArgs, values: { ...illustrativeEmissions, ZZZ: 50, ZZY: 0 } },
  decorators: [frame()],
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: /in 8 bands from lowest to highest/ });
    await waitFor(() => {
      const counts = within(legend).getAllByText(/countr(y|ies)$/).map((e) => Number((e.textContent ?? '').match(/\d+/)![0]));
      expect(counts.reduce((a, b) => a + b, 0)).toBe(Object.keys({ ...illustrativeEmissions, ZZZ: 50, ZZY: 0 }).length);
    });
  },
};

// The selected countries' outline on the map panel is two strokes: a light one under the ink one, so it reads on all eight bands.
export const OutlineIsADoubleStrokeOnTheMapPanel: Story = {
  args: { ...bandedArgs, outline: ['USA', 'CHN', 'IND', 'RUS'] },
  decorators: [frame()],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bandPixels(bandedMap(canvasElement)).filter((n) => n > 20).length).toBeGreaterThanOrEqual(4), { timeout: 8000 });
    // One look once drawn: the ink stroke and the light stroke under it are both there.
    const canvas = bandedMap(canvasElement);
    const ink = pixelsNear(canvas, 'var(--syn-data-map-ink)', 8);
    const light = pixelsNear(canvas, 'var(--syn-data-map-stroke)', 8);
    await expect(ink).toBeGreaterThan(10); // a 1.25px line, anti-aliased: few pixels are exactly the ink
    await expect(light).toBeGreaterThan(15); // the rims of a 2.5px stroke under a 1.25px one, plus the borders
  },
};

// The No data swatch can carry its own count, so the legend adds up to all the countries: band counts + no-data count. Nothing is written when it is 0.
export const NoDataCountCompletesTheLegend: Story = {
  args: { ...bandedArgs, noDataCount: 3 },
  decorators: [frame()],
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: /in 8 bands from lowest to highest/ });
    const bands = within(legend).getAllByText(/countr(y|ies)$/).map((e) => Number((e.textContent ?? '').match(/\d+/)![0]));
    const noData = within(canvasElement).getByText('3 countries', { selector: 'span:not(li span)' });
    await expect(noData).toBeInTheDocument();
    await expect(bands.reduce((a, b) => a + b, 0) + 3).toBe(Object.keys(illustrativeEmissions).length + 3);
  },
};

export const NoDataCountOfOneIsSingular: Story = {
  args: { ...bandedArgs, noDataCount: 1 },
  decorators: [frame()],
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByText('1 country', { selector: 'span:not(li span)' })).toBeInTheDocument(); },
};

export const NoDataCountOfZeroIsHidden: Story = {
  args: { ...bandedArgs, noDataCount: 0 },
  decorators: [frame()],
  play: async ({ canvasElement }) => {
    const legend = within(canvasElement).getByRole('list', { name: /in 8 bands from lowest to highest/ });
    await expect(within(legend).getAllByText(/countr(y|ies)$/)).toHaveLength(8); // the eight bands' counts only
    await expect(within(canvasElement).queryByText('0 countries')).not.toBeInTheDocument();
  },
};

// Compact: the controls are one touch-sized group over the picture's top-right corner, and the keyboard hint is drawn only while the map has focus.
export const OverlayControlsAndFocusOnlyHint: Story = {
  args: { ...bandedArgs, controls: 'overlay', flush: false },
  decorators: [frame()],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bandPixels(bandedMap(canvasElement)).filter((n) => n > 20).length).toBeGreaterThanOrEqual(4), { timeout: 8000 });
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'map view' });
    const buttons = within(group).getAllByRole('button');
    await expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Zoom in map', 'Zoom out map', 'Reset view', 'Table view']);
    // touch-sized, and in the picture's top-right corner
    for (const b of buttons) { const r = b.getBoundingClientRect(); await expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44); }
    const map = bandedMap(canvasElement).getBoundingClientRect();
    const g = group.getBoundingClientRect();
    await expect(g.right).toBeLessThanOrEqual(map.right);
    await expect(g.top).toBeGreaterThanOrEqual(map.top);
    await expect(g.top - map.top).toBeLessThan(40);
    // the hint is in the page (aria-describedby) but not drawn until the map has focus
    const hint = canvasElement.querySelector('[id]:not(canvas):not(table)') && canvas.getByText(/Arrow keys move the map/);
    await expect(bandedMap(canvasElement).getAttribute('aria-describedby')).toContain(hint!.id);
    await expect(hint!.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    bandedMap(canvasElement).focus();
    await waitFor(() => expect(hint!.getBoundingClientRect().width).toBeGreaterThan(100));
    bandedMap(canvasElement).blur();
    await waitFor(() => expect(hint!.getBoundingClientRect().width).toBeLessThanOrEqual(1));
    // the group still works: zoom, then the table, and back
    const image = () => bandedMap(canvasElement).toDataURL();
    const start = image();
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in map' }));
    await waitFor(() => expect(image()).not.toBe(start));
    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    const toggle = canvas.getByRole('button', { name: 'Table view' });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('table')).toBeVisible();
    await userEvent.click(toggle);
    await expect(canvasElement.querySelector('canvas')).toBeVisible();
  },
};

export const OverlayControlsOnTheMapPanelNight: Story = {
  args: { ...bandedArgs, controls: 'overlay' },
  decorators: [frame()],
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('group', { name: 'map view' })).toBeInTheDocument(); },
};

// On a narrow map the tapped country's read-out and the controls over the corner share the top edge: the read-out stays clear of the group and wraps.
export const OverlayControlsLeaveTheTapReadoutItsRoom: Story = {
  args: { ...bandedArgs, controls: 'overlay' },
  decorators: [frame('min(100%, 20rem)')],
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(bandPixels(bandedMap(canvasElement)).filter((n) => n > 20).length).toBeGreaterThanOrEqual(4), { timeout: 8000 });
    const picture = bandedMap(canvasElement);
    const china = place(picture, [104, 35]);
    press(picture, china.x, china.y);
    await waitFor(() => expect(tapReadout(canvasElement)).toMatch(/^China: /));
    const chip = canvasElement.querySelector('[class*="_readoutTap"]') as HTMLElement;
    const group = within(canvasElement).getByRole('group', { name: 'map view' });
    await expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(group.getBoundingClientRect().left);
    // and no word runs past the chip's edge: a long name (Turkmenistan) breaks instead
    await expect(chip.scrollWidth).toBeLessThanOrEqual(chip.clientWidth + 1);
    press(picture, picture.getBoundingClientRect().left + 2, picture.getBoundingClientRect().top + 2);
    const turkmenistan = place(picture, [59, 39]);
    press(picture, turkmenistan.x, turkmenistan.y);
    await waitFor(() => expect(tapReadout(canvasElement)).toMatch(/^Turkmenistan: /));
    const long = canvasElement.querySelector('[class*="_readoutTap"]') as HTMLElement;
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(group.getBoundingClientRect().left);
    await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth + 1);
  },
};
