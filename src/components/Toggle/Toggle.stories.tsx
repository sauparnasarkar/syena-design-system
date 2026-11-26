import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { hoverStyle } from '../storyHover';
import { Toggle, type ToggleProps } from './Toggle';

const meta: Meta<typeof Toggle> = { title: 'Controls/Toggle', component: Toggle };
export default meta;
type Story = StoryObj<typeof Toggle>;

function Demo(props: Partial<ToggleProps>) {
  const [on, setOn] = useState(props.checked ?? false);
  return <div style={{ padding: 'var(--syn-space-5)' }}><Toggle label="Include archived items" {...props} checked={on} onChange={setOn} /></div>;
}

export const SpaceAndClickToggle: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch', { name: 'Include archived items' });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    // A check mark is drawn in the thumb when on: state is not colour alone.
    await expect(toggle.parentElement?.querySelector('svg')).not.toBeNull();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(toggle).not.toBeChecked();
    await expect(toggle.parentElement?.querySelector('svg')).toBeNull();
  },
};

export const TheLabelIsPartOfTheTarget: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Include archived items'));
    await expect(canvas.getByRole('switch')).toBeChecked();
  },
};

export const TheDescriptionIsReadWithTheSwitch: Story = {
  render: () => <Demo description="Shows items that were closed more than a year ago" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('switch')).toHaveAccessibleDescription('Shows items that were closed more than a year ago');
  },
};

export const DisabledCannotBeToggled: Story = {
  render: () => <Demo disabled />,
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('switch');
    await expect(toggle).toBeDisabled();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
  },
};

export const KeyboardFocusShowsTheRingOnTheTrack: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const track = within(canvasElement).getByRole('switch').nextElementSibling as HTMLElement;
    await expect(getComputedStyle(track).outlineStyle).toBe('solid');
  },
};

export const HoverShadesTheTrack: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const track = within(canvasElement).getByRole('switch').nextElementSibling as HTMLElement;
    await expect(hoverStyle(track)?.getPropertyValue('background')).toContain('--syn-color-surface-sunken');
  },
};

export const Small: Story = { render: () => <Demo size="small" /> };

const Gallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-3)', padding: 'var(--syn-space-5)' }}>
    <Demo />
    <Demo checked label="On" />
    <Demo size="small" label="Small off" />
    <Demo size="small" checked label="Small on" />
    <Demo disabled label="Disabled off" />
    <Demo disabled checked label="Disabled on" />
    <Demo label="With a description" description="Says what the setting does" />
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };
