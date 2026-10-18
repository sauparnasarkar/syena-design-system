import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { navFooter, navGroups, placeholderMark } from '../storyFixtures';
import { Rail } from './Rail';

const meta: Meta<typeof Rail> = {
  title: 'Shell/Rail',
  component: Rail,
  parameters: { layout: 'fullscreen' },
  args: { logo: placeholderMark, productName: 'Climate analysis', groups: navGroups, footerItems: navFooter, current: 'forecasts' },
  decorators: [(Story) => <div style={{ display: 'flex', minHeight: '100vh' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Rail>;

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    await expect(canvas.getByRole('img', { name: 'Example product' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Forecasts' })).toHaveAttribute('aria-current', 'page');
  },
};

export const CollapseAndExpand: Story = {
  render: (args) => {
    const [collapsed, setCollapsed] = useState(false);
    return <Rail {...args} collapsed={collapsed} onCollapsedChange={setCollapsed} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Collapse navigation' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    const expand = canvas.getByRole('button', { name: 'Expand navigation' });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    // The control that was activated keeps focus, and items keep their names.
    await expect(expand).toHaveFocus();
    await expect(canvas.getByRole('link', { name: 'Forecasts' })).toBeInTheDocument();
    await expect(canvas.queryByText('Climate analysis')).toBeNull();
  },
};

export const WithProductSwitcherSlot: Story = {
  args: { productSwitcher: <span style={{ display: 'block', padding: 'var(--syn-space-2)', border: 'var(--syn-layout-border-hairline) dashed var(--syn-color-border-emphasis)', color: 'var(--syn-color-text-secondary)' }}>Product switcher</span> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Product switcher')).toBeInTheDocument();
  },
};

const slotGroups = [
  { id: 'home', label: '', items: [{ id: 'home', label: 'Home', href: '#home', icon: 'overview' as const }] },
  { id: 'analyse', label: 'Analyse', items: [{ id: 'overview', label: 'Overview', href: '#overview', icon: 'overview' as const }, { id: 'correlation', label: 'Correlation', href: '#correlation', icon: 'forecasts' as const, badge: 'NEW' }] },
];

export const ActionsUtilitiesAndBadge: Story = {
  args: {
    groups: slotGroups,
    footerItems: undefined,
    current: 'overview',
    actions: (collapsed: boolean) => <button type="button" aria-label="Ask the agent">{collapsed ? '?' : 'Ask the agent'}</button>,
    utilities: <button type="button">Theme</button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Ask the agent' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Theme' })).toBeInTheDocument();
    // The badge is read with the label.
    await expect(canvas.getByRole('link', { name: /Correlation\s*NEW/ })).toBeInTheDocument();
    // A group with no label has no heading and is not named by an empty element.
    const home = canvas.getByRole('link', { name: 'Home' }).closest('ul')!;
    await expect(home).not.toHaveAttribute('aria-labelledby');
    // Collapsed: the action is told, and the badge moves into the item's name.
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse navigation' }));
    await expect(canvas.getByRole('button', { name: 'Ask the agent' })).toHaveTextContent('?');
    await expect(canvas.getByRole('link', { name: 'Correlation (NEW)' })).toBeInTheDocument();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
