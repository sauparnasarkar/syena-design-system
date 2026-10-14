import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Slider, type SliderProps } from './Slider';

function Controlled(props: Partial<SliderProps>) {
  const [value, setValue] = useState(props.value ?? 2000);
  return <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Slider label="Year" min={1990} max={2050} step={1} {...props} value={value} onChange={setValue} /></div>;
}

const meta: Meta<typeof Slider> = { title: 'Controls/Slider', component: Slider };
export default meta;
type Story = StoryObj<typeof Slider>;

export const PageKeysJumpTenSteps: Story = {
  render: () => <Controlled unit="" showValue showRangeLabels showThumbValue />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Year' });
    await userEvent.tab();
    await expect(slider).toHaveFocus();
    // Arrow, Home and End keys are the browser's own for a range input. Page keys are ours: ten steps, clamped.
    await userEvent.keyboard('{PageUp}');
    await expect(slider).toHaveValue('2010');
    await userEvent.keyboard('{PageDown}{PageDown}');
    await expect(slider).toHaveValue('1990');
    await userEvent.keyboard('{PageDown}');
    await expect(slider).toHaveValue('1990');
    await userEvent.keyboard('{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}{PageUp}');
    await expect(slider).toHaveValue('2050');
  },
};

export const ValueTextIncludesTheUnit: Story = {
  render: () => <Controlled min={0} max={100} value={40} label="Share" unit="percent" showValue />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider', { name: 'Share' })).toHaveAttribute('aria-valuetext', '40 percent');
  },
};

export const ShowsRangeLabelsAndThumbValue: Story = {
  render: () => <Controlled showRangeLabels showThumbValue />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('1990')).toBeInTheDocument();
    await expect(within(canvasElement).getByText('2050')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: () => <Controlled disabled showValue />,
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('slider')).toBeDisabled(); },
};

export const Tidewater: Story = { render: () => <Controlled showValue showRangeLabels showThumbValue />, globals: { theme: 'tidewater' } };
