import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Globe } from './Globe';

// Illustrative values keyed by country code, not measurements.
const values: Record<string, number> = { USA: 14.9, CHN: 31.2, IND: 7.9, RUS: 5.1, JPN: 3.1, DEU: 1.7, BRA: 1.4, CAN: 1.4, AUS: 1.2, FRA: 0.9, GBR: 0.8, ZAF: 1.2, MEX: 1.2, IDN: 2.5, NGA: 0.3 };

const meta: Meta<typeof Globe> = {
  title: 'Data/Globe',
  component: Globe,
  args: { values, valueLabel: 'GtCO₂ in 2024 (illustrative)', ariaLabel: 'Emissions in 2024 by country, illustrative values. China highest, Nigeria lowest of those shown.', center: [100, 20] },
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-4)', background: 'var(--syn-data-surface)' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Globe>;

const painted = (c: HTMLCanvasElement) => {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  const seen = new Set<number>();
  for (let i = 0; i < d.length; i += 4 * 97) if (d[i + 3] > 0) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
  return seen.size;
};

export const Drawn: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement).getByRole('img', { name: /Emissions in 2024/ }) as HTMLCanvasElement;
    // The sphere, the countries with values (several steps) and countries without data are different colours.
    await waitFor(() => expect(painted(canvas)).toBeGreaterThanOrEqual(4));
  },
};

export const TextAlternativeListsEveryValue: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole('table', { name: /Emissions in 2024/ });
    await expect(within(table).getAllByRole('row')).toHaveLength(Object.keys(values).length + 1);
    // Largest first.
    await expect(within(table).getAllByRole('rowheader')[0]).toHaveTextContent('China');
    await expect(within(canvasElement).getByRole('img')).toHaveAccessibleDescription(/Emissions in 2024/);
  },
};

export const LegendNamesTheRampAndNoData: Story = {
  args: { autoRotate: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('GtCO₂ in 2024 (illustrative)').length).toBeGreaterThan(0);
    await expect(canvas.getByText('No data')).toBeInTheDocument();
  },
};

export const TurnsUntilFocused: Story = {
  args: { autoRotate: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement).getByRole('img') as HTMLCanvasElement;
    const snap = () => canvas.toDataURL();
    const before = snap();
    await waitFor(() => expect(snap()).not.toBe(before), { timeout: 4000 });
    // Focus pauses the turn.
    canvas.focus();
    await new Promise((r) => setTimeout(r, 100));
    const still = snap();
    await new Promise((r) => setTimeout(r, 400));
    await expect(snap()).toBe(still);
    await userEvent.tab();
  },
};

export const Tidewater: Story = { args: { autoRotate: false }, globals: { theme: 'tidewater' } };
export const Night: Story = { args: { autoRotate: false }, globals: { theme: 'night' } };
