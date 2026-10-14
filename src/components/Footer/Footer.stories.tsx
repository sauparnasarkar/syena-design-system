import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'Shell/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  args: { copyright: '© 2026 Example organisation', links: [{ label: 'Privacy', href: '#privacy' }, { label: 'Terms', href: '#terms' }, { label: 'Contact', href: '#contact' }] },
};
export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('contentinfo')).toBeInTheDocument();
    await expect(canvas.getAllByRole('link')).toHaveLength(3);
  },
};
export const WithoutLinks: Story = { args: { links: undefined } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
