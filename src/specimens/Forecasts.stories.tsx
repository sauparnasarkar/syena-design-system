import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Forecasts } from './Screens';

const meta: Meta<typeof Forecasts> = {
  title: 'Specimens/Forecasts',
  component: Forecasts,
};

export default meta;
type Story = StoryObj<typeof Forecasts>;

export const Night: Story = {
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => {
    // Cards in a row keep their own height: the row aligns its items to the start.
    const heading = within(canvasElement).getByRole('heading', { name: 'Scenario summary' });
    const row = heading.closest('div[class]')!.parentElement as HTMLElement;
    await expect(['flex-start', 'start']).toContain(getComputedStyle(row).alignItems);
  },
};
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
