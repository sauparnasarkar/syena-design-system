import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Wireframe } from './Wireframe';

const meta: Meta<typeof Wireframe> = {
  title: 'Shell/Wireframes',
  component: Wireframe,
  parameters: {
    docs: {
      description: {
        component:
          'Low-fidelity layouts for the application shell: a navigation rail, a contextual analysis bar, a canvas of modules and a sticky source and methodology strip.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wireframe>;

export const Desktop: Story = {
  args: { variant: 'desktop' },
  play: async ({ canvasElement }) => {
    // The last row of modules fills the canvas: Composition and Comparison meet its right edge together.
    const canvas = within(canvasElement);
    const main = canvas.getByRole('main');
    const inner = main.querySelectorAll('section[aria-label]');
    const modules = [...inner].filter((s) => ['Composition', 'Comparison'].includes(s.getAttribute('aria-label') ?? ''));
    await expect(modules).toHaveLength(2);
    const row = modules[0].parentElement!.getBoundingClientRect();
    await expect(Math.abs(modules[1].getBoundingClientRect().right - row.right)).toBeLessThanOrEqual(1);
    await expect(Math.abs(modules[0].getBoundingClientRect().left - row.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(modules[0].getBoundingClientRect().width - modules[1].getBoundingClientRect().width)).toBeLessThanOrEqual(1);
  },
};
export const DesktopProductSwitcher: Story = { args: { variant: 'desktop-product-switcher' } };
export const DesktopSourcesOpen: Story = { args: { variant: 'desktop-sources-open' } };
export const Tablet: Story = { args: { variant: 'tablet' } };
export const Phone: Story = { args: { variant: 'phone' } };
export const PhoneNavigationOpen: Story = {
  args: { variant: 'phone-menu' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Close navigation' })).toBeInTheDocument();
  },
};
export const PhoneAnalysisControlsOpen: Story = {
  args: { variant: 'phone-filters' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The page title appears once (the top bar); the sheet has its own heading.
    await expect(canvas.getAllByRole('heading', { name: 'Country profile' })).toHaveLength(1);
    await expect(canvas.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    // Each filter fills the sheet's width.
    const sheet = canvas.getByRole('region', { name: 'Analysis controls' });
    const inner = parseFloat(getComputedStyle(sheet).paddingLeft);
    for (const label of canvas.getAllByText(/^(Geography|Period|Metric|Scenario)$/)) {
      const control = label.closest('label') as HTMLElement;
      await expect(Math.abs(control.getBoundingClientRect().width - (sheet.getBoundingClientRect().width - 2 * inner))).toBeLessThanOrEqual(2);
    }
  },
};
export const DesktopTidewater: Story = { args: { variant: 'desktop' }, globals: { theme: 'tidewater' } };
