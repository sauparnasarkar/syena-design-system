import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { CountryProfile } from './Screens';

const meta: Meta<typeof CountryProfile> = {
  title: 'Specimens/Country profile',
  component: CountryProfile,
};

export default meta;
type Story = StoryObj<typeof CountryProfile>;

export const Night: Story = {
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => {
    // Cards in a row keep their own height: the row aligns its items to the start.
    const heading = within(canvasElement).getByRole('heading', { name: 'Selected indicators' });
    const row = heading.closest('div[class]')!.parentElement as HTMLElement;
    await expect(['flex-start', 'start']).toContain(getComputedStyle(row).alignItems);
  },
};
export const UnitsAgree: Story = {
  play: async ({ canvasElement }) => {
    // The chart, its subtitle and the card all speak MtCO₂, and no world-total unit appears.
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/MtCO₂ a year; observed to 2024/)).toBeInTheDocument();
    await expect(canvasElement.textContent).not.toContain('GtCO₂');
  },
};
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
