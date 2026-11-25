import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { hoverStyle } from '../storyHover';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = { title: 'Controls/Chip', component: Chip };
export default meta;
type Story = StoryObj<typeof Chip>;

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--syn-space-3)', padding: 'var(--syn-space-5)' } as const;

function Toggling() {
  const [on, setOn] = useState(false);
  return <div style={row}><Chip selected={on} onClick={() => setOn(!on)}>Open</Chip></div>;
}

export const ATogglingChipIsAButtonWithAriaPressed: Story = {
  render: () => <Toggling />,
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByRole('button', { name: 'Open' });
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    // The check mark is drawn when selected, so selection is not colour alone.
    await expect(chip.querySelector('svg')).not.toBeNull();
    await userEvent.keyboard(' ');
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
  },
};

export const RemoveIsItsOwnButtonNamedAfterTheChip: Story = {
  args: { onRemove: fn(), children: 'Region: North' },
  render: (args) => <div style={row}><Chip {...args} /></div>,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // A chip with only a remove control is a static token: one button, the remove button.
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Region: North' }));
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

export const ToggleAndRemoveAreSeparateFocusStops: Story = {
  render: () => <div style={row}><Chip onClick={() => undefined} onRemove={() => undefined} selected>Closed</Chip></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Closed' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Remove Closed' })).toHaveFocus();
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Remove Closed' })).outlineStyle).toBe('solid');
  },
};

export const DisabledIgnoresActivation: Story = {
  args: { onClick: fn(), onRemove: fn(), disabled: true, children: 'Archived' },
  render: (args) => <div style={row}><Chip {...args} /></div>,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Archived' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Remove Archived' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Archived' }));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const HoverWashesThePressableAndRemoveParts: Story = {
  render: () => <div style={row}><Chip onClick={() => undefined} onRemove={() => undefined}>Pending</Chip></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(hoverStyle(canvas.getByRole('button', { name: 'Pending' }))?.getPropertyValue('background')).toContain('--syn-color-surface-sunken');
    await expect(hoverStyle(canvas.getByRole('button', { name: 'Remove Pending' }))?.getPropertyValue('background')).toContain('--syn-color-surface-sunken');
  },
};

const Gallery = () => (
  <div style={row}>
    <Chip onClick={() => undefined}>Default</Chip>
    <Chip onClick={() => undefined} selected>Selected</Chip>
    <Chip onClick={() => undefined} onRemove={() => undefined}>Removable</Chip>
    <Chip onRemove={() => undefined}>Applied filter</Chip>
    <Chip onClick={() => undefined} disabled>Disabled</Chip>
    <Chip onClick={() => undefined} onRemove={() => undefined} selected disabled>Selected disabled</Chip>
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };
