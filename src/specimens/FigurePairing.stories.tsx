import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { FigurePairing } from './FigurePairing';

const meta: Meta<typeof FigurePairing> = {
  title: 'Specimens/Figure pairing',
  component: FigurePairing,
};

export default meta;
type Story = StoryObj<typeof FigurePairing>;

export const Night: Story = {
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The axis is real: ordered, evenly spaced ticks, with the separator the tables use.
    const axis = canvas.getByRole('img', { name: /horizontal axis/ });
    const ticks = [...axis.querySelectorAll('text')].filter((t) => /^\d/.test(t.textContent ?? ''));
    const values = ticks.map((t) => Number((t.textContent ?? '').replace(/,/g, '')));
    await expect(values).toEqual([...values].sort((a, b) => a - b));
    await expect(ticks.some((t) => t.textContent === '2,000' || t.textContent === '4,000')).toBe(true);
    const xs = ticks.map((t) => Number(t.getAttribute('x')));
    const gaps = xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 100) / 100);
    await expect(new Set(gaps).size).toBe(1);
    // Country totals in the tables and on the axis are in MtCO₂.
    await expect(canvas.queryAllByRole('columnheader', { name: 'GtCO₂' })).toHaveLength(0);
    await expect(canvas.getAllByRole('columnheader', { name: 'MtCO₂' })).toHaveLength(2);
  },
};
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
