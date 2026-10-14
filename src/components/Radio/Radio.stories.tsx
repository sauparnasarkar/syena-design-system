import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Radio, RadioGroup } from './Radio';

const options = [{ value: 'annual', label: 'Annual' }, { value: 'cumulative', label: 'Cumulative' }, { value: 'share', label: 'Share of world', disabled: true }];

function Group({ error }: { error?: string }) {
  const [value, setValue] = useState('annual');
  return <div style={{ padding: 'var(--syn-space-5)' }}><RadioGroup legend="Emissions measure" options={options} value={value} onChange={setValue} error={error} /></div>;
}

const meta: Meta<typeof Radio> = { title: 'Controls/Radio', component: Radio };
export default meta;
type Story = StoryObj<typeof Radio>;

export const GroupInFieldset: Story = {
  render: () => <Group />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Emissions measure' })).toBeInTheDocument();
    await expect(canvas.getByRole('radio', { name: 'Annual' })).toBeChecked();
    // The label is part of the target.
    await userEvent.click(canvas.getByText('Cumulative'));
    await expect(canvas.getByRole('radio', { name: 'Cumulative' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Share of world' })).toBeDisabled();
  },
};

export const Single: Story = {
  render: () => <div style={{ padding: 'var(--syn-space-5)' }}><Radio name="one" label="Include projections" defaultChecked /></div>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Include projections' })).toBeChecked();
  },
};

export const WithError: Story = {
  render: () => <Group error="Choose a measure to continue." />,
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Emissions measure' });
    await expect(group).toHaveAccessibleDescription('Choose a measure to continue.');
  },
};

export const Tidewater: Story = { render: () => <Group />, globals: { theme: 'tidewater' } };
