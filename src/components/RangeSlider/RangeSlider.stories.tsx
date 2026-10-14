import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, within } from 'storybook/test';
import { RangeSlider } from './RangeSlider';

function Controlled({ initial = [2000, 2030] as [number, number] }) {
  const [value, setValue] = useState<[number, number]>(initial);
  return <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><RangeSlider label="Period" min={1990} max={2050} value={value} onChange={setValue} thumbLabels={['From year', 'To year']} /></div>;
}

const meta: Meta<typeof RangeSlider> = { title: 'Controls/RangeSlider', component: RangeSlider };
export default meta;
type Story = StoryObj<typeof RangeSlider>;

export const TwoNamedThumbsInOneGroup: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Period' })).toBeInTheDocument();
    await expect(canvas.getByRole('slider', { name: 'From year' })).toHaveValue('2000');
    await expect(canvas.getByRole('slider', { name: 'To year' })).toHaveValue('2030');
  },
};

export const ThumbsCannotCross: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const from = canvas.getByRole('slider', { name: 'From year' });
    const to = canvas.getByRole('slider', { name: 'To year' });
    fireEvent.change(from, { target: { value: '2045' } });
    await expect(from).toHaveValue('2030');
    await expect(to).toHaveValue('2030');
    fireEvent.change(to, { target: { value: '1995' } });
    await expect(to).toHaveValue('2030');
    fireEvent.change(to, { target: { value: '2040' } });
    await expect(to).toHaveValue('2040');
  },
};

export const TheLowerThumbStaysReachableAtTheTop: Story = {
  render: () => <Controlled initial={[2050, 2050]} />,
  play: async ({ canvasElement }) => {
    const from = within(canvasElement).getByRole('slider', { name: 'From year' });
    const to = within(canvasElement).getByRole('slider', { name: 'To year' });
    // With both thumbs at the top the lower one is stacked above, so it can be moved.
    await expect(getComputedStyle(from).zIndex).not.toBe('auto');
    await expect(Number(getComputedStyle(from).zIndex)).toBeGreaterThanOrEqual(Number(getComputedStyle(to).zIndex) || 0);
    fireEvent.change(from, { target: { value: '2049' } });
    await expect(from).toHaveValue('2049');
  },
};

export const Tidewater: Story = { render: () => <Controlled />, globals: { theme: 'tidewater' } };
