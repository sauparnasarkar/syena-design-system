import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { KpiStat } from './KpiStat';

const meta: Meta<typeof KpiStat> = { title: 'Data/KpiStat', component: KpiStat, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, var(--syn-layout-stat-min))' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof KpiStat>;

export const FallingEmissionsAreGood: Story = {
  args: { label: 'Emissions per person', value: 4.7, decimals: 1, unit: 'tCO₂', delta: -0.4, deltaDecimals: 1, deltaUnit: '%', deltaDirection: 'down', tone: 'positive', deltaNote: 'on 2023' },
  play: async ({ canvasElement }) => {
    const stat = within(canvasElement).getByRole('region', { name: 'Emissions per person' });
    await expect(stat).toHaveTextContent('down 0.4 percent on 2023');
    await expect(canvasElement.textContent).toContain('−0.4%');
  },
};

export const RisingEmissionsAreBad: Story = {
  args: { label: 'Annual CO₂ emissions', value: 37.4, decimals: 1, unit: 'GtCO₂ a year', delta: 0.8, deltaDecimals: 1, deltaUnit: '%', deltaDirection: 'up', tone: 'negative', deltaNote: 'on 2023' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region')).toHaveTextContent('up 0.8 percent on 2023');
    await expect(canvasElement.textContent).toContain('+0.8%');
  },
};

export const RisingCanBeGood: Story = {
  args: { label: 'Renewable share of electricity', value: 43.7, decimals: 1, unit: '%', delta: 2.3, deltaDecimals: 1, deltaUnit: ' points', deltaDirection: 'up', tone: 'positive', deltaNote: 'on 2023' },
  play: async ({ canvasElement }) => {
    // The same direction as the emissions story, a different tone: direction is not a verdict.
    const delta = canvasElement.querySelector('svg')!.parentElement as HTMLElement;
    await expect(getComputedStyle(delta).color).not.toBe('');
  },
};

export const ZeroChangeIsFlatAndNeutral: Story = {
  // The direction passed in is ignored when the change shows as zero.
  args: { label: 'Share of world emissions', value: 1.2, decimals: 1, unit: '%', delta: 0, deltaDecimals: 1, deltaUnit: ' points', deltaDirection: 'up', tone: 'negative', deltaNote: 'on 2023' },
  play: async ({ canvasElement }) => {
    const stat = within(canvasElement).getByRole('region', { name: 'Share of world emissions' });
    // No arrow and no sign: a flat glyph and the plain figure, in the neutral colour, spoken as no change.
    await expect(stat).toHaveTextContent('no change on 2023');
    await expect(stat.textContent).not.toMatch(/[+−]0/);
    await expect(stat.textContent).toContain('0.0');
    await expect(stat.querySelectorAll('svg')).toHaveLength(1);
    const delta = stat.querySelector('svg')!.parentElement as HTMLElement;
    const probe = document.createElement('span');
    probe.style.color = 'var(--syn-color-text-secondary)';
    canvasElement.appendChild(probe);
    await expect(getComputedStyle(delta).color).toBe(getComputedStyle(probe).color);
    probe.remove();
  },
};
export const SmallRoundedChangeIsFlatToo: Story = {
  args: { label: 'Share of world emissions', value: 1.2, decimals: 1, unit: '%', delta: 0.04, deltaDecimals: 1, deltaUnit: ' points', deltaDirection: 'up', tone: 'positive', deltaNote: 'on 2023' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('region')).toHaveTextContent('no change on 2023'); },
};
export const WithoutChange: Story = { args: { label: 'Atmospheric CO₂', value: 422.8, decimals: 1, unit: 'ppm', unitLabel: 'parts per million' } };

export const Loading: Story = {
  args: { label: 'Annual CO₂ emissions', value: 0, loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region')).toHaveAttribute('aria-busy', 'true');
  },
};

export const InACard: Story = { args: { card: true, label: 'Emissions per person', value: 4.7, decimals: 1, unit: 'tCO₂', delta: -0.4, deltaDecimals: 1, deltaUnit: '%', deltaDirection: 'down', tone: 'positive', deltaNote: 'on 2023' } };
export const Tidewater: Story = { ...InACard, globals: { theme: 'tidewater' } };
