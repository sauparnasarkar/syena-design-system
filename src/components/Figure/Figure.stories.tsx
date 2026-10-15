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

export const UnitSitsOnTheNumbersBaselineAtEverySize: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-4)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      <Figure size="sm" value={40} unit="%" />
      <Figure size="md" value={40} unit="%" />
      <Figure size="lg" value={37.4} decimals={1} unit="GtCO₂ a year" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Put a zero-size inline-block in each part: its bottom edge sits on the baseline of the text beside it.
    const baseline = (el: Element) => {
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:0;height:0';
      el.appendChild(marker);
      const bottom = marker.getBoundingClientRect().bottom;
      marker.remove();
      return bottom;
    };
    for (const figure of canvasElement.querySelectorAll<HTMLElement>('div > span')) {
      const [number, unit] = figure.children;
      await expect(Math.abs(baseline(number) - baseline(unit))).toBeLessThanOrEqual(0.5);
      // At most a thin gap: half a spacing step.
      const gap = unit.getBoundingClientRect().left - number.getBoundingClientRect().right;
      await expect(gap).toBeLessThanOrEqual(parseFloat(getComputedStyle(unit).marginInlineStart) + 1);
      // The unit is smaller than the number.
      await expect(parseFloat(getComputedStyle(unit).fontSize)).toBeLessThan(parseFloat(getComputedStyle(number).fontSize) + 1);
    }
  },
};

export const UnitsInBothThemes: Story = {
  globals: { theme: 'tidewater' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-3)', padding: 'var(--syn-space-5)', color: 'var(--syn-color-text-primary)' }}>
      <Figure size="sm" value={40} unit="%" /><Figure size="md" value={4.7} decimals={1} unit="tCO₂" /><Figure size="lg" value={422.8} decimals={1} unit="ppm" />
    </div>
  ),
};
