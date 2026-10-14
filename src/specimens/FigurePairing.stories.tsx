import type { Meta, StoryObj } from '@storybook/react-vite';
import { FigurePairing } from './FigurePairing';

const meta: Meta<typeof FigurePairing> = {
  title: 'Specimens/Figure pairing',
  component: FigurePairing,
};

export default meta;
type Story = StoryObj<typeof FigurePairing>;

export const Night: Story = { globals: { theme: 'night' } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
