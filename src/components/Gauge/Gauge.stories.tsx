import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Gauge, type GaugeProps } from './Gauge';

const meta: Meta<typeof Gauge> = { title: 'Feedback/Gauge', component: Gauge, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 24rem)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof Gauge>;

export const IsAMeterWithItsValueSpelledOut: Story = {
  args: { label: 'Coverage', value: 72, unit: '%' },
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole('meter', { name: 'Coverage' });
    await expect(meter).toHaveAttribute('aria-valuenow', '72');
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
    await expect(meter).toHaveAttribute('aria-valuetext', '72 percent');
    await expect(Math.round(parseFloat((meter.firstElementChild as HTMLElement).style.width))).toBe(72);
  },
};

export const AUnitLabelIsReadInsteadOfTheSymbol: Story = {
  args: { label: 'Temperature', value: 21, min: 0, max: 40, unit: '°C', unitLabel: 'degrees Celsius' },
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole('meter', { name: 'Temperature' });
    await expect(meter).toHaveAttribute('aria-valuetext', '21 degrees Celsius');
    await expect(Math.round(parseFloat((meter.firstElementChild as HTMLElement).style.width))).toBe(53);
  },
};

export const AValueOutsideTheScaleIsClamped: Story = {
  args: { label: 'Over', value: 140, unit: '%' },
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByRole('meter');
    await expect(meter).toHaveAttribute('aria-valuenow', '100');
    await expect((meter.firstElementChild as HTMLElement).style.width).toBe('100%');
  },
};

export const EachToneIsADifferentFill: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}>
      {(['accent', 'positive', 'caution', 'negative'] as GaugeProps['tone'][]).map((tone) => <Gauge key={tone} label={`Tone ${tone}`} value={60} unit="%" tone={tone} />)}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fills = within(canvasElement).getAllByRole('meter').map((m) => getComputedStyle(m.firstElementChild as HTMLElement).backgroundColor);
    await expect(new Set(fills).size).toBe(4);
  },
};

export const TheTrackHasItsOwnBoundary: Story = {
  args: { label: 'Coverage', value: 10, unit: '%' },
  play: async ({ canvasElement }) => {
    const track = within(canvasElement).getByRole('meter');
    await expect(parseFloat(getComputedStyle(track).borderTopWidth)).toBeGreaterThan(0);
  },
};

const Gallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-4)' }}>
    <Gauge label="Empty" value={0} unit="%" />
    <Gauge label="Partial" value={45} unit="%" />
    <Gauge label="Full" value={100} unit="%" />
    <Gauge label="Positive" value={82} unit="%" tone="positive" />
    <Gauge label="Caution" value={38} unit="%" tone="caution" />
    <Gauge label="Negative" value={12} unit="%" tone="negative" />
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };
