import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { hoverStyle } from '../storyHover';
import { Tabs, panelId, tabId, type TabItem, type TabsProps } from './Tabs';

const items: TabItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'detail', label: 'Detail' },
  { id: 'history', label: 'History' },
  { id: 'notes', label: 'Notes', disabled: true },
  { id: 'export', label: 'Export' },
];

function Demo(props: Partial<TabsProps>) {
  const [active, setActive] = useState('summary');
  const shown = props.items ?? items;
  const prefix = props.idPrefix ?? 'demo';
  return (
    <div style={{ padding: 'var(--syn-space-5)', display: 'grid', gap: 'var(--syn-space-3)', maxWidth: '40rem' }}>
      <Tabs label="Sections" idPrefix={prefix} items={shown} activeId={active} onChange={setActive} {...props} />
      <div role="tabpanel" id={panelId(prefix, active)} aria-labelledby={tabId(prefix, active)} tabIndex={0} style={{ color: 'var(--syn-color-text-secondary)' }}>
        Panel for {shown.find((i) => i.id === active)?.label}
      </div>
    </div>
  );
}

const meta: Meta<typeof Tabs> = { title: 'Controls/Tabs', component: Tabs };
export default meta;
type Story = StoryObj<typeof Tabs>;

export const ArrowKeysMoveFocusAndEnterSelects: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
    const summary = canvas.getByRole('tab', { name: 'Summary' });
    await expect(summary).toHaveAttribute('aria-selected', 'true');
    // One tab stop: the selected tab; the others are skipped by Tab.
    await expect(canvas.getAllByRole('tab').filter((t) => t.tabIndex === 0)).toEqual([summary]);
    await userEvent.tab();
    await expect(summary).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Detail' })).toHaveFocus();
    // Focus moves; the selection does not, until Enter.
    await expect(summary).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('tab', { name: 'Detail' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveAccessibleName('Detail');
  },
};

export const HomeEndAndWrapSkipADisabledTab: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('tab', { name: 'Export' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Summary' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('tab', { name: 'Export' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    // "Notes" is disabled and is passed over.
    await expect(canvas.getByRole('tab', { name: 'History' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('tab', { name: 'Summary' })).toHaveFocus();
  },
};

export const ClickSelects: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'History' }));
    await expect(canvas.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'false');
    await expect(canvas.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-controls', panelId('demo', 'history'));
  },
};

export const DisabledTab: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('tab', { name: 'Notes' })).toBeDisabled();
  },
};

export const HoverWashesAnUnselectedTab: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole('tab', { name: 'Detail' });
    await expect(hoverStyle(tab)?.getPropertyValue('background')).toContain('--syn-color-surface-sunken');
    // The selected tab is not washed: it already has its own fill or bar.
    await expect(hoverStyle(within(canvasElement).getByRole('tab', { name: 'Summary' }))).toBeNull();
  },
};

export const KeyboardFocusShowsTheRing: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const tab = within(canvasElement).getByRole('tab', { name: 'Summary' });
    await expect(getComputedStyle(tab).outlineStyle).toBe('solid');
    await expect(parseFloat(getComputedStyle(tab).outlineWidth)).toBeGreaterThan(0);
  },
};

export const Segmented: Story = { render: () => <Demo variant="segmented" /> };
export const Small: Story = { render: () => <Demo size="small" /> };

export const AListWiderThanItsContainerScrollsAndKeepsTheSelectionInView: Story = {
  render: () => (
    <div style={{ width: '14rem', padding: 'var(--syn-space-3)' }}>
      <Demo items={Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, label: `Section ${i + 1}` }))} idPrefix="scroll" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    // The click leaves focus on the selected tab, the list's one tab stop.
    await userEvent.click(canvas.getByRole('tab', { name: 'Section 2' }));
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{Enter}');
    const last = canvas.getByRole('tab', { name: 'Section 12' });
    await waitFor(() => {
      const box = last.getBoundingClientRect();
      const frame = list.getBoundingClientRect();
      expect(box.right).toBeLessThanOrEqual(frame.right + 1);
    });
  },
};

const Gallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-4)', padding: 'var(--syn-space-5)' }}>
    <Demo />
    <Demo variant="segmented" />
    <Demo size="small" />
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };
