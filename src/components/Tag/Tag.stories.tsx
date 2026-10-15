import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = { title: 'Surfaces/Tag', component: Tag, decorators: [(Story) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syn-space-2)', padding: 'var(--syn-space-5)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Tag>;

const all = () => (<><Tag>Neutral</Tag><Tag color="accent">Accent</Tag><Tag color="positive">Falling</Tag><Tag color="negative">Rising</Tag><Tag color="caution">Provisional</Tag></>);

export const Colours: Story = {
  render: all,
  play: async ({ canvasElement }) => {
    // Signal tags carry an icon as well as text; neutral and accent tags do not need one.
    const tags = [...canvasElement.querySelectorAll('span')].filter((s) => s.querySelector('svg') !== null || s.textContent);
    await expect(canvasElement.querySelectorAll('svg')).toHaveLength(3);
    await expect(within(canvasElement).getByText('Rising')).toBeInTheDocument();
    await expect(tags.length).toBeGreaterThan(4);
  },
};

export const Small: Story = { render: () => (<><Tag size="small">Small</Tag><Tag size="small" color="accent">Small accent</Tag></>) };
export const Tidewater: Story = { render: all, globals: { theme: 'tidewater' } };
