import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchInput, type SearchInputProps } from './SearchInput';

const meta: Meta<typeof SearchInput> = { title: 'Controls/SearchInput', component: SearchInput };
export default meta;
type Story = StoryObj<typeof SearchInput>;

function Demo(props: Partial<SearchInputProps>) {
  const [value, setValue] = useState(props.value ?? '');
  return <div style={{ padding: 'var(--syn-space-5)' }}><SearchInput label="Search items" placeholder="Search" {...props} value={value} onChange={setValue} /></div>;
}

export const TypingFillsTheFieldAndShowsClear: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('searchbox', { name: 'Search items' });
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.type(field, 'alpha');
    await expect(field).toHaveValue('alpha');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(field).toHaveValue('');
    // Focus returns to the field after clearing.
    await expect(field).toHaveFocus();
  },
};

export const EscapeClears: Story = {
  render: () => <Demo value="beta" />,
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('searchbox');
    await userEvent.click(field);
    await userEvent.keyboard('{Escape}');
    await expect(field).toHaveValue('');
  },
};

export const OnClearReplacesTheDefaultClear: Story = {
  args: { value: 'gamma', onChange: fn(), onClear: fn(), label: 'Search items' },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Clear search' }));
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const TheNameIsTheLabelNotThePlaceholder: Story = {
  render: () => <Demo label="Filter the table" placeholder="Type to filter" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('searchbox', { name: 'Filter the table' })).toBeInTheDocument();
  },
};

export const KeyboardFocusShowsTheRingOnTheField: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const box = within(canvasElement).getByRole('searchbox').parentElement as HTMLElement;
    await expect(getComputedStyle(box).outlineStyle).toBe('solid');
  },
};

export const Small: Story = { render: () => <Demo size="small" /> };
export const Disabled: Story = {
  render: () => <Demo value="locked" disabled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('searchbox')).toBeDisabled();
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull();
  },
};

const Gallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-4)' }}>
    <Demo />
    <Demo value="filled" />
    <Demo size="small" />
    <Demo value="locked" disabled />
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };
