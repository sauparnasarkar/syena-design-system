import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { CardHeader } from '../CardHeader/CardHeader';
import { Card } from './Card';

const meta: Meta<typeof Card> = { title: 'Surfaces/Card', component: Card, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-module-min))' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Card>;

export const WithHeader: Story = {
  render: () => (
    <Card as="section" aria-labelledby="card-title" header={<CardHeader title="Annual emissions" supportText="GtCO₂ a year, 1990 to 2024" headingLevel={2} actions={<Button size="small" variant="ghost" icon="download" aria-label="Download data" />} />}>
      <p>Body text of the module.</p>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2, name: 'Annual emissions' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Download data' })).toBeInTheDocument();
  },
};

export const SectionNamedByItsLabel: Story = {
  render: () => <Card as="section" aria-label="Key figures"><p>Content</p></Card>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region', { name: 'Key figures' })).toBeInTheDocument();
  },
};

export const PlainDivHasNoRole: Story = {
  render: () => <Card><p>Content</p></Card>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
  },
};

export const WithoutBorder: Story = { args: { withBorder: false, children: <p>No border</p> } };

export const Paddings: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}>
      {(['none', 'compact', 'default', 'roomy'] as const).map((p) => <Card key={p} padding={p}><p style={{ background: 'var(--syn-color-accent-tint)' }}>{p}</p></Card>)}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const paragraphs = [...canvasElement.querySelectorAll('p')];
    const offsets = paragraphs.map((p) => p.getBoundingClientRect().left - (p.parentElement as HTMLElement).getBoundingClientRect().left);
    await expect(offsets[0]).toBeLessThan(offsets[1]);
    await expect(offsets[1]).toBeLessThan(offsets[2]);
    await expect(offsets[2]).toBeLessThan(offsets[3]);
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' }, render: () => <Card header={<CardHeader title="Tidewater card" supportText="Support text" />}><p>Body</p></Card> };
