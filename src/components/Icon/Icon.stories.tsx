import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Icon } from './Icon';
import { icons, type IconName } from './icons';

const meta: Meta<typeof Icon> = { title: 'Components/Icon', component: Icon };
export default meta;
type Story = StoryObj<typeof Icon>;

export const All: Story = {
  render: () => (
    <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syn-space-5)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      {(Object.keys(icons) as IconName[]).map((name) => (
        <li key={name} style={{ display: 'grid', justifyItems: 'center', gap: 'var(--syn-space-2)', minWidth: 'var(--syn-space-10)' }}>
          <Icon name={name} />
          <span style={{ font: 'var(--syn-type-caption-weight) var(--syn-type-caption-size) / var(--syn-type-caption-line) var(--syn-type-caption-family)', color: 'var(--syn-color-text-muted)' }}>{name}</span>
        </li>
      ))}
    </ul>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--syn-space-5)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-accent-text)' }}>
      <Icon name="forecasts" size="small" />
      <Icon name="forecasts" size="medium" />
      <Icon name="forecasts" size="large" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const sizes = [...canvasElement.querySelectorAll('svg')].map((s) => Math.round(s.getBoundingClientRect().width));
    await expect(sizes).toEqual([16, 20, 32]);
  },
};

export const DecorativeAndLabelled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--syn-space-5)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      <Icon name="info" />
      <Icon name="warning" title="Warning" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    await expect(canvas.getByRole('img', { name: 'Warning' })).toBeInTheDocument();
  },
};

export const FollowsTextColour: Story = {
  globals: { theme: 'tidewater' },
  render: () => (
    <span style={{ display: 'inline-flex', gap: 'var(--syn-space-2)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-signal-negative-text)' }}>
      <Icon name="up" />
      Rising
    </span>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg')!;
    await expect(getComputedStyle(svg).color).toBe(getComputedStyle(svg.parentElement!).color);
  },
};
