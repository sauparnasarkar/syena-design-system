import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
    utilities: (collapsed: boolean) => <button type="button" aria-label="Theme" style={{ whiteSpace: 'nowrap' }}>{collapsed ? 'T' : 'Theme: light or dark'}</button>,
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
    // Nothing of the utilities paints outside the rail.
    const rail = canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect();
    const theme = canvas.getByRole('button', { name: 'Theme' });
    const box = theme.parentElement!.getBoundingClientRect();
    await expect(box.right).toBeLessThanOrEqual(rail.right + 0.5);
    await expect(theme.scrollWidth).toBeLessThanOrEqual(theme.clientWidth + 1);
    // The badge leaves a visible mark, not only a name.
    const mark = canvas.getByRole('link', { name: 'Correlation (NEW)' }).querySelector('[class*="badgeMark"]') as HTMLElement;
    await expect(mark).not.toBeNull();
    await expect(mark.getBoundingClientRect().width).toBeGreaterThanOrEqual(4);
    // The logo and the icons share one vertical axis, once the rail has finished changing width.
    await waitFor(async () => { const w = canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect().width; await new Promise((r) => setTimeout(r, 400)); await expect(canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect().width).toBe(w); }, { timeout: 5000 });
    const centre = (el: Element) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
    const logo = canvas.getByRole('img', { name: placeholderMark.name });
    const icon = canvas.getByRole('link', { name: 'Overview' }).querySelector('svg')!;
    await expect(Math.abs(centre(logo) - centre(icon))).toBeLessThanOrEqual(1);
  },
};

export const BrandLinksToTheStartPage: Story = {
  args: { brandHref: '#home' },
  render: (args) => {
    const [collapsed, setCollapsed] = useState(false);
    return <Rail {...args} collapsed={collapsed} onCollapsedChange={setCollapsed} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Expanded: the link is named by the mark and the product name it contains.
    await expect(canvas.getByRole('link', { name: /Climate analysis/ })).toHaveAttribute('href', '#home');
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse navigation' }));
    // Collapsed: the name is not written anywhere, so the link carries the mark's name, in full, as its accessible name and as a tooltip. The written name may be shorter than it.
    const home = await canvas.findByRole('link', { name: placeholderMark.name });
    await expect(home).toHaveAttribute('href', '#home');
    const tip = home.querySelector('[class*="tip"]') as HTMLElement;
    await expect(tip).not.toBeNull();
    await expect(tip).toHaveTextContent(placeholderMark.name);
    await expect(getComputedStyle(tip).opacity).toBe('0');
    // Keyboard focus shows the tooltip.
    await userEvent.tab();
    home.focus();
    await expect(home).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(tip).opacity).toBe('1'));
    // Once the rail has finished narrowing, the tooltip sits beside the mark and reaches out past the rail's edge.
    await waitFor(async () => { const w = canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect().width; await new Promise((r) => setTimeout(r, 400)); await expect(canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect().width).toBe(w); }, { timeout: 5000 });
    const rail = canvas.getByRole('navigation', { name: 'Primary' }).getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(canvas.getByRole('img', { name: placeholderMark.name }).getBoundingClientRect().right);
    await expect(box.right).toBeGreaterThan(rail.right);
  },
};

export const ALongerProductNameStaysOnOneLine: Story = {
  args: { productName: 'Degrees of Carbon' },
  play: async ({ canvasElement }) => {
    const name = within(canvasElement).getByText('Degrees of Carbon');
    const lineHeight = parseFloat(getComputedStyle(name).lineHeight);
    await expect(name.getBoundingClientRect().height).toBeLessThan(lineHeight * 1.5); // not wrapped
    const rail = canvasElement.querySelector('nav') as HTMLElement;
    await expect(name.getBoundingClientRect().right).toBeLessThanOrEqual(rail.getBoundingClientRect().right); // not pushed past the rail's edge
  },
};

export const BrandIsPlainWithoutALink: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('link', { name: /Climate analysis|Example product/ })).toBeNull();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
