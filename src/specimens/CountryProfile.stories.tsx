import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountryProfile } from './Screens';

const meta: Meta<typeof CountryProfile> = {
  title: 'Specimens/Country profile',
  component: CountryProfile,
};

export default meta;
type Story = StoryObj<typeof CountryProfile>;

export const Night: Story = { globals: { theme: 'night' } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
