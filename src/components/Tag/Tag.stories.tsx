import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = { title: 'Surfaces/Tag', component: Tag, decorators: [(Story) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syn-space-2)', padding: 'var(--syn-space-5)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Tag>;

// Labels name the tone, never a direction: the tone says good or bad, the words say what happened.
const all = () => (<><Tag>Neutral</Tag><Tag color="accent">Accent</Tag><Tag color="positive">Positive</Tag><Tag color="negative">Negative</Tag><Tag color="caution">Caution</Tag></>);

export const Colours: Story = {
  render: all,
  play: async ({ canvasElement }) => {
    // Signal tags carry an icon as well as text; neutral and accent tags do not need one.
    const tags = [...canvasElement.querySelectorAll('span')].filter((s) => s.querySelector('svg') !== null || s.textContent);
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(3);
    await expect(within(canvasElement).getByText('Negative')).toBeInTheDocument();
    await expect(tags.length).toBeGreaterThan(4);
  },
};

export const RisingCanBePositive: Story = {
  render: () => <Tag color="positive">Renewable share rising</Tag>,
  play: async ({ canvasElement }) => {
    // Direction is in the words; the tone alone sets the icon and the colours.
    await expect(within(canvasElement).getByText('Renewable share rising')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(1);
  },
};

export const RisingCanBeNegative: Story = {
  render: () => <Tag color="negative">Emissions rising</Tag>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Emissions rising')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(1);
  },
};

export const SameWordBothTones: Story = {
  render: () => (<><Tag color="positive">Rising</Tag><Tag color="negative">Rising</Tag></>),
  play: async ({ canvasElement }) => {
    const tags = within(canvasElement).getAllByText('Rising');
    await expect(tags).toHaveLength(2);
    // The two tags differ by tone, not by wording.
    await expect(getComputedStyle(tags[0]).color).not.toBe(getComputedStyle(tags[1]).color);
  },
};

export const Small: Story = { render: () => (<><Tag size="small">Small</Tag><Tag size="small" color="accent">Small accent</Tag></>) };
export const Tidewater: Story = { render: all, globals: { theme: 'tidewater' } };
