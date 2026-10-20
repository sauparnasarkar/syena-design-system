import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { expectHintBalanced, expectLegendFits } from '../../charts/map/legendChecks';
import { illustrativeEmissions } from '../../specimens/countryValues';
import { Globe } from './Globe';

const meta: Meta<typeof Globe> = {
  title: 'Data/Globe',
  component: Globe,
  args: {
    values: illustrativeEmissions,
    valueLabel: 'CO₂ emissions in 2024, MtCO₂ (illustrative)',
    unit: 'MtCO₂',
    ariaLabel: 'Annual CO₂ emissions by country in 2024, illustrative values on a log scale from 0.01 to 10,000 MtCO₂. A few countries are deep red and most are pale yellow to orange; some have no data.',
    center: [100, 20],
  },
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-4)', background: 'var(--syn-data-surface)' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Globe>;

const channels = (css: string) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.body.appendChild(probe);
  const [r, g, b] = getComputedStyle(probe).color.match(/\d+/g)!.map(Number);
  probe.remove();
  return [r, g, b];
};
/** How many pixels of the canvas are within a few levels of a token's colour. */
const pixelsNear = (canvas: HTMLCanvasElement, css: string, tolerance = 4) => {
  const [r, g, b] = channels(css);
  const d = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && Math.abs(d[i] - r) <= tolerance && Math.abs(d[i + 1] - g) <= tolerance && Math.abs(d[i + 2] - b) <= tolerance) n += 1;
  return n;
};
const globe = (el: HTMLElement) => within(el).getByRole('img', { name: /Annual CO₂ emissions by country/ }) as HTMLCanvasElement;

export const Drawn: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = globe(canvasElement);
    // Countries with a value are heat colours, countries without are the quiet no-data grey, and the sphere is the panel.
    await waitFor(() => expect(pixelsNear(canvas, 'var(--syn-data-no-data)')).toBeGreaterThan(50));
    await expect(pixelsNear(canvas, 'var(--syn-data-surface)')).toBeGreaterThan(50);
    const heat = [1, 2, 3, 4, 5, 6, 7].map((i) => pixelsNear(canvas, `var(--syn-data-heat-${i})`, 40));
    await expect(heat.filter((n) => n > 0).length).toBeGreaterThanOrEqual(3);
  },
};

export const LegendHasATickAtEveryPowerOfTen: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expectLegendFits(canvasElement, { all: true }));
    for (const tick of ['0.01', '0.1', '1', '10', '100', '1,000', '10,000']) await expect(canvas.getByText(tick, { selector: 'li' })).toBeInTheDocument();
    await expect(canvas.getByText('No data')).toBeInTheDocument();
    await expect(canvas.getByText('CO₂ emissions in 2024, MtCO₂ (illustrative), log scale')).toBeInTheDocument();
  },
};

export const TextAlternativeListsEveryValue: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: /Annual CO₂ emissions by country/ });
    await expect(within(table).getAllByRole('row')).toHaveLength(Object.keys(illustrativeEmissions).length + 1);
    // Largest first.
    const values = within(table).getAllByRole('cell').map((c) => Number((c.textContent ?? '').replace(/,/g, '')));
    await expect(values).toEqual([...values].sort((a, b) => b - a));
    await expect(globe(canvasElement)).toHaveAccessibleDescription(/Annual CO₂ emissions by country/);
  },
};

export const ControlsZoomResetAndTable: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = () => globe(canvasElement).toDataURL();
    const start = image();
    const zoomIn = canvas.getByRole('button', { name: 'Zoom in globe' });
    const zoomOut = canvas.getByRole('button', { name: 'Zoom out globe' });
    await expect(zoomOut).toBeDisabled();
    await userEvent.click(zoomIn);
    await waitFor(() => expect(image()).not.toBe(start));
    await expect(zoomOut).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(image()).toBe(start));
    await expect(zoomOut).toBeDisabled();
    // Table view swaps the globe for its values, and back.
    const toggle = canvas.getByRole('button', { name: 'Table view' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('table')).toBeVisible();
    await expect(canvasElement.querySelector('canvas')).not.toBeVisible();
    await userEvent.click(toggle);
    await expect(canvasElement.querySelector('canvas')).toBeVisible();
  },
};

export const KeyboardTurnsAndZoomsWithAVisibleHint: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Arrow keys turn the globe/)).toBeVisible();
    const element = globe(canvasElement);
    const image = () => element.toDataURL();
    const start = image();
    element.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(image()).not.toBe(start));
    const turned = image();
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(image()).not.toBe(turned));
    const tilted = image();
    await userEvent.keyboard('+');
    await waitFor(() => expect(image()).not.toBe(tilted));
    await userEvent.keyboard('0');
    await waitFor(() => expect(image()).toBe(start));
  },
};

export const TurnsUntilFocused: Story = {
  args: { autoRotate: true },
  play: async ({ canvasElement }) => {
    const canvas = globe(canvasElement);
    const snap = () => canvas.toDataURL();
    const before = snap();
    await waitFor(() => expect(snap()).not.toBe(before), { timeout: 4000 });
    // Focus pauses the turn.
    canvas.focus();
    await new Promise((r) => setTimeout(r, 100));
    const still = snap();
    await new Promise((r) => setTimeout(r, 400));
    await expect(snap()).toBe(still);
  },
};

export const NarrowThinsTheLegendAndBalancesTheHint: Story = {
  args: { autoRotate: false, size: 260 },
  decorators: [(Story) => <div style={{ width: 'min(100%, 20rem)' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    await waitFor(() => expectLegendFits(canvasElement, { all: false }));
    await waitFor(() => expectHintBalanced(canvasElement));
  },
};

export const Tidewater: Story = { args: { autoRotate: false }, globals: { theme: 'tidewater' } };
export const Night: Story = { args: { autoRotate: false }, globals: { theme: 'night' } };

const luminance = (css: string) => {
  const [r, g, b] = channels(css).map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
/** The colour behind an element: its own background, or the nearest ancestor's that is not transparent. */
const backdrop = (el: HTMLElement) => {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (!/rgba?\(0, 0, 0, 0\)|transparent/.test(c)) return c; }
  return 'var(--syn-color-surface-base)';
};

const page = (Story: () => ReactElement) => <div style={{ padding: 'var(--syn-space-4)', background: 'var(--syn-color-surface-base)', color: 'var(--syn-color-text-primary)' }}><Story /></div>;

export const CaptionThenLegendThenControls: Story = {
  args: { autoRotate: false, size: 260, caption: <span>1990 · 22,899 MtCO₂</span> },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const top = (el: Element) => el.getBoundingClientRect().top;
    const caption = canvas.getByText(/22,899 MtCO₂/);
    const legend = canvas.getByText('No data');
    const reset = canvas.getByRole('button', { name: 'Reset view' });
    await expect(globe(canvasElement).getBoundingClientRect().bottom).toBeLessThanOrEqual(top(caption) + 1);
    await expect(top(caption)).toBeLessThan(top(legend));
    await expect(top(legend)).toBeLessThan(top(reset));
  },
};

export const ControlsAreCompactAndReadableOnThePage: Story = {
  args: { autoRotate: false, size: 260 },
  decorators: [page],
  globals: { theme: 'tidewater' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Reset view', 'Table view']) {
      const button = canvas.getByRole('button', { name });
      await expect(button).toBeEnabled();
      await expect(button.getBoundingClientRect().height).toBeLessThanOrEqual(36);
      await expect(contrast(getComputedStyle(button).color, backdrop(button))).toBeGreaterThanOrEqual(4.5);
      // Drawn as a button on the page: a fill or an outline that is itself visible against what is behind it.
      const fill = getComputedStyle(button).backgroundColor;
      await expect(/rgba?\(0, 0, 0, 0\)/.test(fill)).toBe(false);
    }
  },
};

export const CompactOverlaysTheCaptionAndReadoutAndSharesTheLegendRow: Story = {
  args: { autoRotate: false, size: 300, compact: true, valueLabel: 'CO₂ (MtCO₂)', caption: <span>2024 · 37,398 MtCO₂</span> },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const picture = globe(canvasElement);
    const box = picture.getBoundingClientRect();
    // The caption sits on the picture's top-left corner, not above it.
    const caption = canvas.getByText(/37,398 MtCO₂/).getBoundingClientRect();
    await expect(Math.abs(caption.left - box.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(caption.top - box.top)).toBeLessThanOrEqual(1);
    // The legend follows the picture closely: no row is held back for the read-out.
    const legendLabel = canvas.getByText('CO₂ (MtCO₂), log scale');
    await expect(legendLabel.getBoundingClientRect().top - box.bottom).toBeLessThanOrEqual(12);
    // The legend's name shares a row with its scale.
    const bar = canvasElement.querySelector('[class*="_bar_"]') as HTMLElement;
    await expect(legendLabel.getBoundingClientRect().bottom).toBeGreaterThan(bar.getBoundingClientRect().top);
    await expect(legendLabel.getBoundingClientRect().right).toBeLessThanOrEqual(bar.getBoundingClientRect().left + 1);
    // Pointing at a country names it on the picture without moving anything.
    const before = canvas.getByRole('button', { name: 'Reset view' }).getBoundingClientRect().top;
    fireEvent.pointerMove(picture, { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 });
    const readout = await waitFor(() => { const el = canvasElement.querySelector('[class*="_readoutCorner_"]') as HTMLElement; expect(el?.textContent).toMatch(/:/); return el; });
    const r = readout.getBoundingClientRect();
    await expect(r.bottom).toBeLessThanOrEqual(box.bottom + 1);
    await expect(r.top).toBeGreaterThanOrEqual(box.top);
    await expect(canvas.getByRole('button', { name: 'Reset view' }).getBoundingClientRect().top).toBe(before);
  },
};

export const NotCompactKeepsTheCaptionBelowAndAReadoutRow: Story = {
  args: { autoRotate: false, size: 300, caption: <span>2024 · 37,398 MtCO₂</span> },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const box = globe(canvasElement).getBoundingClientRect();
    await expect(within(canvasElement).getByText(/37,398 MtCO₂/).getBoundingClientRect().top).toBeGreaterThanOrEqual(box.bottom);
  },
};

export const CompactLegendStaysOnOneRowWhereTheScaleIsNarrow: Story = {
  args: { autoRotate: false, size: 340, compact: true, valueLabel: 'CO₂ (MtCO₂)' },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const legend = canvasElement.querySelector('[class*="_legend_"]') as HTMLElement;
    // The name, the scale and the no-data key share one row, so the legend is about one tick-row tall.
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(legend.getBoundingClientRect().height).toBeLessThanOrEqual(36);
  },
};

/** A real tap: a press and release in one place, as a finger does, with no pointer moving over the globe first. */
const tap = (picture: HTMLElement, x: number, y: number, pointerType = 'touch') => {
  const at = { clientX: x, clientY: y, pointerType, pointerId: 7, isPrimary: true };
  fireEvent.pointerDown(picture, at);
  fireEvent.pointerUp(picture, at);
};
const readoutText = (root: HTMLElement) => (root.querySelector('[class*="_readout"]') as HTMLElement | null)?.textContent?.trim() ?? '';

export const TapSelectsACountryAndShowsItsReadout: Story = {
  args: { autoRotate: false, size: 300, center: [78, 22] },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const picture = globe(canvasElement);
    const box = picture.getBoundingClientRect();
    const middle = [box.left + box.width / 2, box.top + box.height / 2] as const;
    await expect(readoutText(canvasElement)).toBe('');
    // A tap names the country under it and its value, though no pointer ever hovered.
    tap(picture, ...middle);
    await waitFor(() => expect(readoutText(canvasElement)).toMatch(/^India: /));
    // The same figure the table gives.
    await expect(readoutText(canvasElement)).toContain(String(illustrativeEmissions.IND).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    // A tap on the sea, beside the sphere, clears it.
    tap(picture, box.left + 2, box.top + 2);
    await waitFor(() => expect(readoutText(canvasElement)).toBe(''));
  },
};

export const ADragTurnsTheGlobeAndSelectsNothing: Story = {
  args: { autoRotate: false, size: 300, center: [78, 22] },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const picture = globe(canvasElement);
    const box = picture.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const at = (dx: number) => ({ clientX: x + dx, clientY: y, pointerType: 'touch', pointerId: 7, isPrimary: true });
    const start = picture.toDataURL();
    fireEvent.pointerDown(picture, at(0));
    fireEvent.pointerMove(picture, at(30));
    fireEvent.pointerUp(picture, at(30));
    await waitFor(() => expect(picture.toDataURL()).not.toBe(start));
    await expect(readoutText(canvasElement)).toBe('');
  },
};

export const TapReadoutStaysUntilAnotherTapAndEscapeClears: Story = {
  args: { autoRotate: false, size: 300, center: [78, 22] },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const picture = globe(canvasElement);
    const box = picture.getBoundingClientRect();
    tap(picture, box.left + box.width / 2, box.top + box.height / 2);
    await waitFor(() => expect(readoutText(canvasElement)).toMatch(/^India: /));
    picture.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(readoutText(canvasElement)).toBe(''));
  },
};

export const LabelsNameTheCountriesTheyAreGiven: Story = {
  args: { autoRotate: false, size: 300, center: [78, 22], labels: [{ id: 'IND', text: 'India 3,200' }, { id: 'USA', text: 'United States 4,900' }, { id: 'ZZZ', text: 'Nowhere' }] },
  decorators: [page],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = globe(canvasElement).getBoundingClientRect();
    // India faces the viewer, so its label is on the picture near the middle, readable on the panel.
    const label = await canvas.findByText('India 3,200');
    const r = label.getBoundingClientRect();
    await expect(Math.abs(r.left + r.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(box.width * 0.15);
    await expect(Math.abs(r.top + r.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(box.height * 0.15);
    await expect(contrast(getComputedStyle(label).color, backdrop(label))).toBeGreaterThanOrEqual(4.5);
    // The far side of the globe and a code with no shape are not drawn.
    await expect(canvas.queryByText('United States 4,900')).toBeNull();
    await expect(canvas.queryByText('Nowhere')).toBeNull();
    // Turning the globe brings the far side round.
    const element = globe(canvasElement);
    element.focus();
    for (let i = 0; i < 18; i += 1) await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.queryByText('United States 4,900')).not.toBeNull());
    await waitFor(() => expect(canvas.queryByText('India 3,200')).toBeNull());
    // The table lists the values already, so the labels are not repeated there.
    await userEvent.click(canvas.getByRole('button', { name: 'Table view' }));
    await expect(canvas.queryByText('United States 4,900')).toBeNull();
  },
};

export const LabelsAreNotReadTwice: Story = {
  args: { autoRotate: false, size: 300, center: [78, 22], labels: [{ id: 'IND', text: 'India 3,200' }] },
  play: async ({ canvasElement }) => {
    const label = await within(canvasElement).findByText('India 3,200');
    await expect(label.closest('[aria-hidden="true"]')).not.toBeNull();
  },
};

/** The rules, in any sheet, that apply only to a coarse primary pointer. */
const coarseRules = () => [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && /pointer:\s*coarse/.test(rule.conditionText)).flatMap((rule) => [...rule.cssRules] as CSSStyleRule[]);

export const TheKeyboardHintIsHiddenOnATouchScreen: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    // Shown where there is a keyboard-capable pointer...
    await expect(within(canvasElement).getByText(/Arrow keys turn the globe/)).toBeVisible();
    // ...and dropped where the primary pointer is a finger, which has no use for it.
    const hidden = coarseRules().filter((rule) => /_hint_/.test(rule.selectorText) && rule.style.display === 'none');
    await expect(hidden).toHaveLength(1);
  },
};

export const EveryControlIsThereWhateverThePointer: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['Zoom in globe', 'Zoom out globe', 'Reset view', 'Table view']) await expect(canvas.getByRole('button', { name })).toBeVisible();
    // Nothing that applies to a coarse pointer takes a control away.
    await expect(coarseRules().filter((rule) => /_(buttons|button|controls)_/.test(rule.selectorText) && /^(none|hidden)$/.test(rule.style.display || rule.style.visibility))).toHaveLength(0);
  },
};

// A label rides the surface, so how far it drifts across the middle of the picture in a measured time is the turn rate. The frame clock is
// driven by hand (sixty frames of a sixtieth of a second, one second in all) and no pointer can reach the globe, so neither a slow machine nor a
// mouse left over from another story (a hover pauses the turn) can change the answer.
let frames: { step: (ms: number) => void } | null = null;
const handClock = () => {
  const real = { raf: window.requestAnimationFrame, cancel: window.cancelAnimationFrame, now: performance.now };
  let time = 0;
  let next = 0;
  const queue = new Map<number, FrameRequestCallback>();
  window.requestAnimationFrame = (cb) => { next += 1; queue.set(next, cb); return next; };
  window.cancelAnimationFrame = (id) => { queue.delete(id); };
  performance.now = () => time;
  frames = { step: (ms) => { time += ms; const due = [...queue.values()]; queue.clear(); due.forEach((cb) => cb(time)); } };
  return () => { window.requestAnimationFrame = real.raf; window.cancelAnimationFrame = real.cancel; performance.now = real.now; frames = null; };
};
const untouchable = (Story: () => ReactElement) => <div style={{ pointerEvents: 'none' }}>{page(Story)}</div>;

const turnRate = async (canvasElement: HTMLElement, text: string, size: number, latitude: number) => {
  const label = await within(canvasElement).findByText(text);
  const x = () => label.getBoundingClientRect().left + label.getBoundingClientRect().width / 2;
  const startX = x();
  for (let i = 0; i < 60; i += 1) { frames!.step(1000 / 60); await new Promise((resolve) => { setTimeout(resolve, 0); }); }
  const radians = (x() - startX) / ((size / 2 - 2) * Math.cos((latitude * Math.PI) / 180));
  return Math.abs((radians * 180) / Math.PI);
};

export const ATurnPeriodOfThirtySecondsTurnsTwelveDegreesASecond: Story = {
  args: { autoRotate: true, turnPeriod: 30, size: 300, center: [78, 22], labels: [{ id: 'IND', text: 'India 3,200' }] },
  decorators: [untouchable],
  beforeEach: handClock,
  play: async ({ canvasElement }) => {
    const rate = await turnRate(canvasElement, 'India 3,200', 300, 22);
    await expect(rate).toBeGreaterThan(11);
    await expect(rate).toBeLessThan(13);
  },
};

export const WithoutATurnPeriodTheGlobeTurnsSixDegreesASecond: Story = {
  args: { autoRotate: true, size: 300, center: [78, 22], labels: [{ id: 'IND', text: 'India 3,200' }] },
  decorators: [untouchable],
  beforeEach: handClock,
  play: async ({ canvasElement }) => {
    const rate = await turnRate(canvasElement, 'India 3,200', 300, 22);
    await expect(rate).toBeGreaterThan(5.5);
    await expect(rate).toBeLessThan(6.5);
  },
};
