import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = { title: 'Controls/Button', component: Button, args: { children: 'Download data', onClick: fn() }, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', display: 'flex', gap: 'var(--syn-space-3)', alignItems: 'center' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: (args) => (<><Button {...args} variant="primary" /><Button {...args} variant="secondary" /><Button {...args} variant="ghost" /></>),
  play: async ({ canvasElement, args }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons).toHaveLength(3);
    await userEvent.click(buttons[0]);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Sizes: Story = {
  render: (args) => (<><Button {...args} /><Button {...args} size="small" /></>),
  play: async ({ canvasElement }) => {
    const [a, b] = within(canvasElement).getAllByRole('button');
    await expect(a.getBoundingClientRect().height).toBeGreaterThan(b.getBoundingClientRect().height);
  },
};

export const WithIcons: Story = { render: (args) => (<><Button {...args} variant="primary" icon="download" /><Button {...args} trailingIcon="chevron" /></>) };

export const IconOnlyNeedsAName: Story = {
  render: () => <Button icon="menu" aria-label="Open menu" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: (args) => (<><Button {...args} variant="primary" disabled /><Button {...args} disabled /></>),
  play: async ({ canvasElement, args }) => {
    const [first] = within(canvasElement).getAllByRole('button');
    await userEvent.click(first);
    await expect(args.onClick).not.toHaveBeenCalled();
    await expect(first).toBeDisabled();
  },
};

// The disabled rule shared by field-like controls sets a boundary colour; a ghost button has none, so on the overlay surface
// a disabled one must show no outline.
export const ADisabledGhostButtonHasNoBoundary: Story = {
  globals: { theme: 'night' },
  render: (args) => (
    <div style={{ background: 'var(--syn-color-surface-overlay)', padding: 'var(--syn-space-4)', display: 'flex', gap: 'var(--syn-space-3)' }}>
      <Button {...args} variant="ghost" disabled>Reset</Button>
      <Button {...args} variant="ghost" aria-disabled="true">Reset all</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      const style = getComputedStyle(button);
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
        await expect(style.getPropertyValue(`border-${side.toLowerCase()}-color`)).toMatch(/(?:,\s*0|\/\s*0)\)$/);
      }
    }
  },
};

// The disabled label is tuned on every surface a control can sit on, not only the canvas: on the overlay surface in night it stays as
// legible as it is on the canvas.
export const ADisabledSecondaryButtonKeepsItsLabelOnTheOverlaySurfaceInNight: Story = {
  globals: { theme: 'night' },
  render: (args) => (
    <div style={{ background: 'var(--syn-color-surface-overlay)', padding: 'var(--syn-space-4)' }}>
      <Button {...args} disabled>Reset to featured</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    const luminance = (value: string) => { const [r, g, b] = channels(value); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const surface = getComputedStyle(button.parentElement as HTMLElement).backgroundColor;
    await expect(ratio(getComputedStyle(button).color, surface)).toBeGreaterThanOrEqual(Math.sqrt(4.5) - 0.005);
  },
};

export const Loading: Story = {
  render: (args) => (<><Button {...args} variant="primary" isLoading icon="download" /><Button {...args} isLoading /></>),
  play: async ({ canvasElement, args }) => {
    const [first] = within(canvasElement).getAllByRole('button');
    await expect(first).toHaveAttribute('aria-busy', 'true');
    await expect(first).toHaveTextContent('Download data');
    await userEvent.click(first);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const LoadingKeepsItsWidth: Story = {
  render: (args) => <Button {...args} icon="download" />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    const before = button.getBoundingClientRect().width;
    button.setAttribute('aria-busy', 'true');
    await expect(Math.abs(button.getBoundingClientRect().width - before)).toBeLessThanOrEqual(1);
  },
};

export const ToggleShowsPressed: Story = {
  render: (args) => <Button {...args} aria-pressed>Show projection</Button>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Show projection' })).toHaveAttribute('aria-pressed', 'true');
  },
};

export const KeyboardActivates: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' }, render: (args) => (<><Button {...args} variant="primary" /><Button {...args} /><Button {...args} variant="ghost" /></>) };
