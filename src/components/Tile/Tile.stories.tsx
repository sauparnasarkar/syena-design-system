import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Tile } from './Tile';

const meta: Meta<typeof Tile> = { title: 'Surfaces/Tile', component: Tile, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Tile>;

export const StaticTile: Story = {
  args: { children: 'Not interactive' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
    await expect(within(canvasElement).queryByRole('link')).toBeNull();
  },
};

export const ButtonTileActivatesWithEnterAndSpace: Story = {
  args: { interactive: true, onClick: fn(), children: 'How have emissions changed since 1990?' },
  play: async ({ canvasElement, args }) => {
    const tile = within(canvasElement).getByRole('button', { name: /How have emissions changed/ });
    await userEvent.tab();
    await expect(tile).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(tile);
    await expect(args.onClick).toHaveBeenCalledTimes(3);
  },
};

export const LinkTile: Story = {
  args: { interactive: true, href: '#country', children: 'Open the country profile' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Open the country profile' })).toHaveAttribute('href', '#country');
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' }, args: { interactive: true, onClick: fn(), children: 'Suggested question' } };
