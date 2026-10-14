import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SegmentedControl, type SegmentedControlProps } from './SegmentedControl';

const items = [{ value: 'total', label: 'Total' }, { value: 'person', label: 'Per person' }, { value: 'intensity', label: 'Intensity' }];

function Controlled(props: Partial<SegmentedControlProps>) {
  const [value, setValue] = useState('total');
  return <div style={{ padding: 'var(--syn-space-5)' }}><SegmentedControl label="Metric" items={items} value={value} onChange={setValue} {...props} /></div>;
}

const meta: Meta<typeof SegmentedControl> = { title: 'Controls/SegmentedControl', component: SegmentedControl };
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const ArrowKeysMoveAndSelect: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup', { name: 'Metric' })).toBeInTheDocument();
    const first = canvas.getByRole('radio', { name: 'Total' });
    await expect(first).toBeChecked();
    // One tab stop; arrow keys move and select.
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'Per person' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Per person' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Per person' })).not.toHaveFocus();
  },
};

export const Click: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Intensity'));
    await expect(canvas.getByRole('radio', { name: 'Intensity' })).toBeChecked();
  },
};

export const Small: Story = { render: () => <Controlled size="small" /> };

export const DisabledOption: Story = {
  render: () => <Controlled items={[...items.slice(0, 2), { value: 'intensity', label: 'Intensity', disabled: true }]} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Intensity' })).toBeDisabled();
  },
};

export const WithAriaLabelOnly: Story = {
  render: () => <Controlled label={undefined} ariaLabel="Metric" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radiogroup', { name: 'Metric' })).toBeInTheDocument();
  },
};

export const Tidewater: Story = { render: () => <Controlled />, globals: { theme: 'tidewater' } };
