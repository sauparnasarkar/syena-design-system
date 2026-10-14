import type { Meta, StoryObj } from '@storybook/react-vite';
import { Forecasts } from './Screens';

const meta: Meta<typeof Forecasts> = {
  title: 'Specimens/Forecasts',
  component: Forecasts,
};

export default meta;
type Story = StoryObj<typeof Forecasts>;

export const Night: Story = { globals: { theme: 'night' } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
