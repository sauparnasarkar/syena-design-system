import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Slider, type SliderProps } from './Slider';

function Controlled(props: Partial<SliderProps>) {
  const [value, setValue] = useState(props.value ?? 2000);
  return <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Slider label="Year" min={1990} max={2050} step={1} {...props} value={value} onChange={setValue} /></div>;
}

const gap = (canvasElement: HTMLElement) => {
  const slider = within(canvasElement).getByRole('slider', { name: 'Year' });
  return slider.getBoundingClientRect().top - within(canvasElement).getByText('Year').getBoundingClientRect().bottom;
};

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

export const KeepsNoRoomForABubbleThatIsNotShown: Story = {
  render: () => <Controlled showRangeLabels />,
  play: async ({ canvasElement }) => {
    // Label, then the track a small step below it; the bubble's room is only held when there is a bubble.
    await expect(gap(canvasElement)).toBeLessThanOrEqual(24);
  },
};

export const KeepsRoomForTheBubbleWhenShown: Story = {
  render: () => <Controlled showThumbValue />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bubble = canvasElement.querySelector('[class*="_bubble_"]') as HTMLElement;
    await expect(bubble.getBoundingClientRect().top).toBeGreaterThanOrEqual(canvas.getByText('Year').getBoundingClientRect().bottom - 1);
    await expect(bubble.getBoundingClientRect().bottom).toBeLessThanOrEqual(canvas.getByRole('slider', { name: 'Year' }).getBoundingClientRect().top + 1);
  },
};

export const LabelCanBeHiddenAndStaysTheName: Story = {
  render: () => <Controlled labelHidden showRangeLabels />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Year' });
    const label = canvas.getByText('Year').getBoundingClientRect();
    // Not drawn, still its accessible name, and no row held for it.
    await expect(label.width).toBeLessThanOrEqual(1);
    await expect(slider.getBoundingClientRect().top - canvasElement.firstElementChild!.getBoundingClientRect().top).toBeLessThanOrEqual(32);
  },
};
