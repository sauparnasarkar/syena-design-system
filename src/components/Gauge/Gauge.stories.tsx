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
    // The bar is held to the scale; the written and spoken value is the real one, so they agree.
    await expect(meter).toHaveAttribute('aria-valuenow', '100');
    await expect((meter.firstElementChild as HTMLElement).style.width).toBe('100%');
    await expect(meter).toHaveAttribute('aria-valuetext', '140 percent');
    await expect(within(canvasElement).getByText('140')).toBeInTheDocument();
  },
};

export const AFractionalValueIsWrittenWithItsDecimals: Story = {
  args: { label: 'Rate', value: 0.0004, min: 0, max: 0.001, unit: 'units' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meter = canvas.getByRole('meter', { name: 'Rate' });
    await expect(canvas.getByText('0.0004')).toBeInTheDocument();
    await expect(meter).toHaveAttribute('aria-valuetext', '0.0004 units');
    await expect(Math.round(parseFloat((meter.firstElementChild as HTMLElement).style.width))).toBe(40);
  },
};

export const VerySmallAndVeryPreciseValuesAreWrittenAsTheyAre: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}>
      <Gauge label="Tiny" value={0.0000004} min={0} max={0.000001} unit="units" />
      <Gauge label="Precise" value={0.1234567} min={0} max={1} unit="units" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('0.0000004')).toBeInTheDocument();
    await expect(canvas.getByRole('meter', { name: 'Tiny' })).toHaveAttribute('aria-valuetext', '0.0000004 units');
    await expect(canvas.getByText('0.1234567')).toBeInTheDocument();
    await expect(canvas.getByRole('meter', { name: 'Precise' })).toHaveAttribute('aria-valuetext', '0.1234567 units');
  },
};

export const TheFillEndsInALineSoItsExtentShowsInAnyTone: Story = {
  args: { label: 'Caution', value: 40, unit: '%', tone: 'caution' },
  play: async ({ canvasElement }) => {
    const fill = within(canvasElement).getByRole('meter').firstElementChild as HTMLElement;
    await expect(parseFloat(getComputedStyle(fill).borderRightWidth)).toBeGreaterThan(0);
  },
};

export const AnEmptyGaugeHasNoFillAndNoEdgeLine: Story = {
  args: { label: 'Empty', value: 0, unit: '%' },
  play: async ({ canvasElement }) => {
    const empty = within(canvasElement).getByRole('meter').firstElementChild as HTMLElement;
    await expect(parseFloat(getComputedStyle(empty).borderRightWidth)).toBe(0);
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
