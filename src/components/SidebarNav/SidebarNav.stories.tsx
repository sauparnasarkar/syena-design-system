import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { navFooter, navGroups } from '../storyFixtures';
import { SidebarNav } from './SidebarNav';

const meta: Meta<typeof SidebarNav> = {
  title: 'Shell/SidebarNav',
  component: SidebarNav,
  args: { groups: navGroups, footerItems: navFooter, current: 'country', onItemClick: fn((_item, event) => event.preventDefault()) },
  decorators: [(Story) => <div style={{ width: 'var(--syn-layout-rail-width-expanded)', padding: 'var(--syn-space-3)', background: 'var(--syn-color-surface-sunken)' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof SidebarNav>;

export const Expanded: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Country profile' })).toHaveAttribute('aria-current', 'page');
    await expect(canvas.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    await expect(canvas.getAllByRole('list')).toHaveLength(3);
    await userEvent.click(canvas.getByRole('link', { name: /Ask/ }));
    await expect(args.onItemClick).toHaveBeenCalledOnce();
  },
};

export const Collapsed: Story = {
  args: { collapsed: true },
  decorators: [(Story) => <div style={{ width: 'var(--syn-layout-rail-width-collapsed)', padding: 'var(--syn-space-2)', background: 'var(--syn-color-surface-sunken)' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Icon-only items keep their names for assistive technology and show them as a tooltip on focus.
    const link = canvas.getByRole('link', { name: 'Forecasts' });
    await userEvent.tab();
    link.focus();
    await expect(link).toHaveFocus();
    await expect(canvasElement.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  },
};

export const WithButtons: Story = {
  args: { groups: [{ id: 'views', label: 'Views', items: [{ id: 'a', label: 'First view', icon: 'overview' }, { id: 'b', label: 'Second view', icon: 'table' }] }], footerItems: undefined, current: 'a' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Second view' }));
    await expect(args.onItemClick).toHaveBeenCalled();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
