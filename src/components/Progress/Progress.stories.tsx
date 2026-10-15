import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = { title: 'Feedback/Progress', component: Progress, args: { label: 'Loading scenarios', value: 40 }, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Progress>;

export const Exposes: Story = {
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Loading scenarios' });
    await expect(bar).toHaveAttribute('aria-valuenow', '40');
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
    await expect(bar).toHaveAttribute('aria-valuetext', '40 percent');
    await expect(within(canvasElement).getByText('40')).toBeInTheDocument();
  },
};

export const CustomMaximum: Story = {
  args: { value: 3, max: 12, label: 'Months loaded' },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuemax', '12');
    await expect(bar).toHaveAttribute('aria-valuetext', '25 percent');
  },
};

export const ClampsOutOfRangeValues: Story = {
  args: { value: 140 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  },
};

export const WithoutValueText: Story = { args: { showValue: false } };
export const Tidewater: Story = { globals: { theme: 'tidewater' } };
