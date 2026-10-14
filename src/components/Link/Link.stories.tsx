import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Link } from './Link';

const meta: Meta<typeof Link> = { title: 'Controls/Link', component: Link, args: { href: '#methodology', children: 'Read the methodology' }, decorators: [(Story) => <p style={{ padding: 'var(--syn-space-5)' }}>See <Story /> for details.</p>] };
export default meta;
type Story = StoryObj<typeof Link>;

export const Internal: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Read the methodology' });
    await expect(link).toHaveAttribute('href', '#methodology');
    await expect(link.getAttribute('rel')).toBeNull();
    await expect(getComputedStyle(link).textDecorationLine).toBe('underline');
  },
};

export const External: Story = {
  args: { href: 'https://example.org/data', target: '_blank', children: 'Open the dataset' },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', { name: 'Open the dataset (opens in a new tab)' });
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const KeepsCallerRel: Story = {
  args: { href: 'https://example.org', target: '_blank', rel: 'author', children: 'Author page' },
  play: async ({ canvasElement }) => {
    const rel = within(canvasElement).getByRole('link').getAttribute('rel')!.split(' ');
    await expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer', 'author']));
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
