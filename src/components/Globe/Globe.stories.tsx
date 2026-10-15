import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
