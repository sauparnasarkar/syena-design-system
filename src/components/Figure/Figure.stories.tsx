import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Figure, formatFigure } from './Figure';

const meta: Meta<typeof Figure> = { title: 'Components/Figure', component: Figure };
export default meta;
type Story = StoryObj<typeof Figure>;

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-3)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      <Figure size="lg" value={37.4} decimals={1} unit="GtCO₂ a year" />
      <Figure size="md" value={1234.56} decimals={2} unit="MtCO₂" />
      <Figure size="sm" value={4.7} decimals={1} unit="tCO₂" />
    </div>
  ),
};

export const SignedWithTone: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-3)', padding: 'var(--syn-space-5)' }}>
      <Figure value={2.6} decimals={1} signed tone="negative" unit="ppm" />
      <Figure value={-0.4} decimals={1} signed tone="positive" unit="%" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+2.6')).toBeInTheDocument();
    await expect(canvas.getByText('−0.4')).toBeInTheDocument();
  },
};

export const UnitSpelledForScreenReaders: Story = {
  render: () => (
    <div style={{ padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      <Figure value={37.4} decimals={1} unit="GtCO₂" unitLabel="gigatonnes of carbon dioxide a year" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('GtCO₂')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('gigatonnes of carbon dioxide a year')).toBeInTheDocument();
  },
};

export const Formatting: Story = {
  render: () => <div style={{ padding: 'var(--syn-space-5)' }}>{formatFigure(-1234.5, { decimals: 1 })}</div>,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toBe('−1,234.5');
    await expect(formatFigure('-3')).toBe('−3');
    await expect(formatFigure(0, { signed: true, decimals: 1 })).toBe('0.0');
  },
};

export const Tidewater: Story = {
  globals: { theme: 'tidewater' },
  render: () => (
    <div style={{ padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      <Figure size="lg" value={1.28} decimals={2} unit="°C above 1850 to 1900" />
    </div>
  ),
};
