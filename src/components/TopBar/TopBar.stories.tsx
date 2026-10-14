import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { placeholderMark } from '../storyFixtures';
import { TopBar } from './TopBar';

const meta: Meta<typeof TopBar> = {
  title: 'Shell/TopBar',
  component: TopBar,
  args: { logo: placeholderMark, title: 'Country profile', summary: 'Example country · 1990 to 2024 · CO₂', onOpenNavigation: fn(), onOpenControls: fn() },
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Country profile' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Open analysis controls' }));
    await expect(args.onOpenNavigation).toHaveBeenCalledOnce();
    await expect(args.onOpenControls).toHaveBeenCalledOnce();
  },
};

export const ButtonsAreTouchSized: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Open navigation' });
    await expect(Math.round(button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
