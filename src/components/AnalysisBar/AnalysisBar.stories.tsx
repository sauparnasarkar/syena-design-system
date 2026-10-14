import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { AnalysisBar } from './AnalysisBar';

const field = (label: string, value: string) => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-1)' }}>
    <span style={{ color: 'var(--syn-color-text-muted)', font: 'var(--syn-type-caption-weight) var(--syn-type-caption-size) / var(--syn-type-caption-line) var(--syn-type-caption-family)' }}>{label}</span>
    <input aria-label={label} defaultValue={value} />
  </div>
);

const meta: Meta<typeof AnalysisBar> = {
  title: 'Shell/AnalysisBar',
  component: AnalysisBar,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Country profile',
    purpose: "How one country's emissions have changed and where current policy leads.",
    children: <>{field('Geography', 'Example country')}{field('Period', '1990 to 2024')}{field('Metric', 'Annual CO₂')}</>,
  },
};
export default meta;
type Story = StoryObj<typeof AnalysisBar>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Analysis controls' })).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Country profile' })).toBeInTheDocument();
    await expect(canvas.getByLabelText('Period')).toBeInTheDocument();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
