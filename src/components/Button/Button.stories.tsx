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
