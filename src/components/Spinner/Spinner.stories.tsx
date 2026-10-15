import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = { title: 'Feedback/Spinner', component: Spinner, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Spinner>;

export const SpokenLabel: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Loading');
  },
};

export const CustomLabelShown: Story = {
  args: { label: 'Loading the forecast', showLabel: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Loading the forecast')).toBeVisible();
  },
};

export const RingTurns: Story = {
  play: async ({ canvasElement }) => {
    const ring = canvasElement.querySelector('[aria-hidden="true"]') as HTMLElement;
    await expect(getComputedStyle(ring).animationName).not.toBe('none');
    await expect(Math.round(ring.getBoundingClientRect().width)).toBe(20);
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' }, args: { showLabel: true } };
