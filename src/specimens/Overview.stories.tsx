import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overview } from './Screens';

const meta: Meta<typeof Overview> = {
  title: 'Specimens/Overview',
  component: Overview,
};

export default meta;
type Story = StoryObj<typeof Overview>;

export const Night: Story = { globals: { theme: 'night' } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
