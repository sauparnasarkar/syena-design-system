import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Rail } from '../Rail/Rail';
import { navFooter, navGroups, placeholderMark } from '../storyFixtures';
import { ProductSwitcher, type ProductSwitcherProduct } from './ProductSwitcher';

const mark = (name: string, tone: 'accent' | 'positive' | 'caution') => ({
  name,
  node: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" style={{ fill: `var(--syn-color-${tone === 'accent' ? 'accent-fill' : `signal-${tone}-fill`})` }} />
    </svg>
  ),
});

const products: ProductSwitcherProduct[] = [
  { id: 'overview', name: 'Overview', href: '#overview', mark: mark('Overview', 'accent') },
  { id: 'reports', name: 'Reports', href: '#reports', mark: mark('Reports', 'positive') },
  { id: 'archive', name: 'Archive', href: '#archive', mark: mark('Archive', 'caution') },
];

const meta: Meta<typeof ProductSwitcher> = {
  title: 'Shell/ProductSwitcher',
  component: ProductSwitcher,
  args: { products, currentId: 'overview', message: 'Products you can open.' },
  decorators: [(Story) => <div style={{ width: '14rem', padding: 'var(--syn-space-5)', minHeight: '24rem' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ProductSwitcher>;

const trigger = (canvasElement: HTMLElement) => within(canvasElement).getByRole('button', { name: 'Overview, switch product' });

export const IsADisclosureNotAMenu: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toHaveAttribute('aria-haspopup');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const region = within(canvasElement).getByRole('region', { name: 'Products' });
    await expect(button.getAttribute('aria-controls')).toBe(region.id);
    // Ordinary links, no menu roles.
    await expect(within(region).getAllByRole('link')).toHaveLength(3);
    await expect(canvasElement.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
    await userEvent.click(button);
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
  },
};

export const TheCurrentProductIsMarkedByMoreThanColour: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    const region = within(canvasElement).getByRole('region', { name: 'Products' });
    const current = within(region).getByRole('link', { name: 'Overview' });
    await expect(current).toHaveAttribute('aria-current', 'true');
    // The mark and the check: the check is what says "current" without colour.
    await expect(current.querySelectorAll('svg')).toHaveLength(2);
    await expect(within(canvasElement).getByRole('region', { name: 'Products' }).querySelectorAll('a svg')).toHaveLength(4);
    await expect(parseInt(getComputedStyle(current).fontWeight, 10)).toBeGreaterThanOrEqual(600);
    await expect(within(region).getByRole('link', { name: 'Reports' })).not.toHaveAttribute('aria-current');
    await expect(within(region).getByText('Products you can open.')).toBeInTheDocument();
  },
};

export const LinksAreReachedInTheNormalTabOrder: Story = {
  play: async ({ canvasElement }) => {
    const region = () => within(canvasElement).getByRole('region', { name: 'Products' });
    await userEvent.tab();
    await expect(trigger(canvasElement)).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    await expect(within(region()).getByRole('link', { name: 'Overview' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(region()).getByRole('link', { name: 'Reports' })).toHaveFocus();
  },
};

export const EscapeClosesAndReturnsFocusToTheButton: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
    await expect(trigger(canvasElement)).toHaveFocus();
  },
};

export const AClickOrFocusOutsideCloses: Story = {
  render: (args) => (
    <div>
      <ProductSwitcher {...args} />
      <button type="button" style={{ marginTop: 'var(--syn-space-9)' }}>Elsewhere</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await expect(within(canvasElement).getByRole('region')).toBeInTheDocument();
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(within(canvasElement).queryByRole('region')).toBeNull());
    // Focus stays where the reader put it.
    await expect(within(canvasElement).getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  },
};

export const CollapsedShowsTheMarkOnlyWithTheFullName: Story = {
  args: { collapsed: true },
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button.textContent).toBe('');
    await expect(within(button).getByRole('img', { name: 'Overview' })).toBeInTheDocument();
    await userEvent.click(button);
    await expect(within(canvasElement).getByRole('region', { name: 'Products' })).toBeInTheDocument();
  },
};

export const ThePanelWearsThePopoversSurface: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    const panel = within(canvasElement).getByRole('region', { name: 'Products' });
    await expect(getComputedStyle(panel).boxShadow).not.toBe('none');
    await expect(parseFloat(getComputedStyle(panel).borderTopWidth)).toBeGreaterThan(0);
    await expect(getComputedStyle(panel).position).toBe('fixed');
  },
};

function InARail({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(collapsed);
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Rail
        logo={placeholderMark}
        productName="Example"
        groups={navGroups}
        footerItems={navFooter}
        current="forecasts"
        collapsed={open}
        onCollapsedChange={setOpen}
        productSwitcher={(isCollapsed) => <ProductSwitcher products={products} currentId="overview" collapsed={isCollapsed} message="Products you can open." />}
      />
    </div>
  );
}

const reachable = async (canvasElement: HTMLElement) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Overview, switch product' }));
  const panel = within(canvasElement).getByRole('region', { name: 'Products' });
  await waitFor(() => expect(getComputedStyle(panel).visibility).toBe('visible'));
  const box = panel.getBoundingClientRect();
  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  // Not clipped or covered by the rail: the point at its centre belongs to the panel.
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + 8);
  await expect(panel.contains(hit)).toBe(true);
};

export const InAnExpandedRailThePanelIsNotClipped: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [],
  render: () => <InARail collapsed={false} />,
  play: async ({ canvasElement }) => { await reachable(canvasElement); },
};

export const InACollapsedRailThePanelIsNotClipped: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [],
  render: () => <InARail collapsed />,
  play: async ({ canvasElement }) => { await reachable(canvasElement); },
};

const Open = (args: React.ComponentProps<typeof ProductSwitcher>) => <ProductSwitcher {...args} />;
const openIt: Story['play'] = async ({ canvasElement }) => { await userEvent.click(trigger(canvasElement)); };
export const AllStates: Story = { render: (args) => <Open {...args} />, play: openIt };
export const AllStatesTidewater: Story = { render: (args) => <Open {...args} />, play: openIt, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: (args) => <Open {...args} />, play: openIt, globals: { theme: 'ledger' } };

function InATrap({ onEscape }: { onEscape: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, true, onEscape);
  return <div ref={panel} role="dialog" aria-label="Drawer" tabIndex={-1}><ProductSwitcher products={products} currentId="overview" /></div>;
}

export const EscapeClosesTheSwitcherAloneNotTheDrawerAroundIt: Story = {
  render: () => {
    const calls: string[] = [];
    (globalThis as { __escapes?: string[] }).__escapes = calls;
    return <InATrap onEscape={() => calls.push('drawer')} />;
  },
  play: async ({ canvasElement }) => {
    const calls = (globalThis as { __escapes?: string[] }).__escapes!;
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Overview, switch product' }));
    await expect(within(canvasElement).getByRole('region', { name: 'Products' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
    // The drawer's own Escape did not run: one press, one overlay.
    await expect(calls).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await expect(calls).toEqual(['drawer']);
  },
};

export const EscapeClosesItWhateverHasFocusAsInABrowserThatDoesNotFocusAClickedButton: Story = {
  render: () => {
    const calls: string[] = [];
    (globalThis as { __escapes?: string[] }).__escapes = calls;
    return <InATrap onEscape={() => calls.push('drawer')} />;
  },
  play: async ({ canvasElement }) => {
    const calls = (globalThis as { __escapes?: string[] }).__escapes!;
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Overview, switch product' }));
    // Focus is not on the button, as after a click in Safari.
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard('{Escape}');
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
    await expect(calls).toEqual([]);
  },
};

const many: ProductSwitcherProduct[] = Array.from({ length: 40 }, (_, n) => ({ id: `p${n}`, name: `Product ${n + 1}`, href: `#p${n}`, mark: mark(`Product ${n + 1}`, 'accent') }));

// A list longer than the room it was placed in scrolls inside; scrolling it keeps its place instead of going back to the top.
export const AHeldShortListKeepsItsScrollPosition: Story = {
  args: { products: many, currentId: 'p0' },
  decorators: [(Story) => <div style={{ position: 'fixed', left: 0, bottom: 0, width: '14rem', padding: 'var(--syn-space-5)' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Product 1, switch product' }));
    const panel = await within(canvasElement).findByRole('region', { name: 'Products' });
    await new Promise((resolve) => setTimeout(resolve, 300));
    await waitFor(() => expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight + 200));
    panel.scrollTop = 150;
    // The scroll event arrives on the next frame; give it, and anything it sets off, time to run.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(panel.scrollTop).toBe(150);
  },
};

export const ShortNamesStillFormARowOfTiles: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    const region = within(canvasElement).getByRole('region', { name: 'Products' });
    const [first, second, third] = within(region).getAllByRole('link').map((link) => link.getBoundingClientRect());
    // Three products sit side by side: the same top edge, each to the right of the one before.
    await expect(second.top).toBeCloseTo(first.top, 0);
    await expect(third.top).toBeCloseTo(first.top, 0);
    await expect(second.left).toBeGreaterThan(first.left);
    await expect(third.left).toBeGreaterThan(second.left);
    // And the tiles are inside the panel, which is wider than one tile.
    const panel = region.getBoundingClientRect();
    await expect(panel.width).toBeGreaterThan(first.width * 2);
    await expect(third.right).toBeLessThanOrEqual(panel.right);
  },
};

export const TilesKeepTheirColumnsAtASmallerRootSize: Story = {
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const held = root.style.fontSize;
    root.style.fontSize = '14px';
    try {
      await userEvent.click(trigger(canvasElement));
      const region = within(canvasElement).getByRole('region', { name: 'Products' });
      const tops = within(region).getAllByRole('link').map((link) => Math.round(link.getBoundingClientRect().top));
      await expect(new Set(tops).size).toBe(1);
    } finally {
      root.style.fontSize = held;
    }
  },
};
