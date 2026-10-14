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

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
