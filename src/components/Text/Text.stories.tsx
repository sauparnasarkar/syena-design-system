import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Text, type Tone, type TypeRole } from './Text';

const roles: TypeRole[] = ['display', 'title-lg', 'title-md', 'title-sm', 'text-lg', 'text-md', 'text-sm', 'caption', 'overline'];
const tones: Tone[] = ['primary', 'secondary', 'muted', 'link', 'positive', 'negative', 'caution'];

const meta: Meta<typeof Text> = { title: 'Components/Text', component: Text };
export default meta;
type Story = StoryObj<typeof Text>;

export const Roles: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-2)', padding: 'var(--syn-space-5)' }}>
      {roles.map((role) => (
        <Text key={role} as="p" type={role} tone="primary">{role === 'overline' ? 'Overline' : `The ${role} role`}</Text>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-2)', padding: 'var(--syn-space-5)' }}>
      {tones.map((tone) => (
        <Text key={tone} as="p" tone={tone}>{tone}</Text>
      ))}
    </div>
  ),
};

export const HeadingLevelIsExplicit: Story = {
  render: () => (
    <div style={{ padding: 'var(--syn-space-5)' }}>
      <Text as="h2" type="title-md" tone="primary">A section heading</Text>
      <Text as="p">A paragraph of interface text under it.</Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2, name: 'A section heading' })).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('h1, h3').length).toBe(0);
  },
};

export const NightTidewater: Story = {
  globals: { theme: 'tidewater' },
  render: () => <Text as="p" type="text-lg" tone="primary" style={{ padding: 'var(--syn-space-5)' }}>Tidewater text</Text>,
};
