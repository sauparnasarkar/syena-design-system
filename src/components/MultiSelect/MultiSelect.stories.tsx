import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MultiSelect, type MultiSelectProps } from './MultiSelect';

const options = [{ value: 'current', label: 'Current policies' }, { value: 'pledges', label: 'Announced pledges' }, { value: 'netzero', label: 'Net zero pathway' }, { value: 'delayed', label: 'Delayed action' }];

function Controlled(props: Partial<MultiSelectProps>) {
  const [value, setValue] = useState<string[]>(props.value ?? ['current']);
  return <div style={{ padding: 'var(--syn-space-5)', minHeight: '24rem', width: 'min(100%, var(--syn-layout-module-min))' }}><MultiSelect label="Scenarios" options={options} {...props} value={value} onChange={setValue} /></div>;
}

const meta: Meta<typeof MultiSelect> = { title: 'Controls/MultiSelect', component: MultiSelect };
export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const TogglesWithoutClosing: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Scenarios/ });
    await expect(trigger).toHaveAccessibleName(/Current policies/);
    await userEvent.click(trigger);
    const list = canvas.getByRole('listbox', { name: 'Scenarios' });
    await expect(list).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(canvas.getByRole('option', { name: 'Announced pledges' }));
    await expect(canvas.getByRole('option', { name: 'Announced pledges' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(trigger).toHaveAccessibleName(/Current policies, Announced pledges/);
  },
};

export const KeyboardSelectsWithSpaceAndEnter: Story = {
  render: () => <Controlled value={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    const list = canvas.getByRole('listbox');
    await waitFor(() => expect(list).toHaveFocus());
    await userEvent.keyboard(' ');
    await expect(canvas.getByRole('option', { name: 'Current policies' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByRole('option', { name: 'Announced pledges' })).toHaveAttribute('aria-selected', 'true');
  },
};

export const LimitDisablesTheRestAndSaysWhy: Story = {
  render: () => <Controlled maxSelected={2} value={['current', 'pledges']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox'));
    await expect(canvas.getByRole('option', { name: 'Net zero pathway' })).toHaveAttribute('aria-disabled', 'true');
    // The footer and the live region say the same thing.
    await expect(canvas.getAllByText('2 selected, limit reached')).toHaveLength(2);
    await expect(canvas.getByRole('status')).toHaveTextContent('2 selected, limit reached');
    // A chosen option can still be removed.
    await userEvent.click(canvas.getByRole('option', { name: 'Announced pledges' }));
    await expect(canvas.getByRole('option', { name: 'Net zero pathway' })).not.toHaveAttribute('aria-disabled');
    await expect(canvas.getAllByText('1 selected, up to 2')).toHaveLength(2);
  },
};

export const ClearEmptiesTheChoice: Story = {
  render: () => <Controlled value={['current', 'pledges', 'netzero']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox')).toHaveAccessibleName(/Current policies and 2 more/);
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(canvas.getByRole('combobox')).toHaveAccessibleName(/Select/);
    await expect(canvas.getByRole('button', { name: 'Clear' })).toBeDisabled();
  },
};

export const AnnouncesTheCount: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('1 selected');
    await userEvent.click(canvas.getByRole('combobox'));
    await userEvent.click(canvas.getByRole('option', { name: 'Delayed action' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('2 selected');
  },
};

export const OpenInTidewater: Story = {
  render: () => <Controlled maxSelected={3} />,
  globals: { theme: 'tidewater' },
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('combobox')); },
};

export const OpenInNight: Story = {
  render: () => <Controlled maxSelected={3} />,
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole('combobox')); },
};
