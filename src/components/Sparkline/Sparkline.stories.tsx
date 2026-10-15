import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { observed } from '../../specimens/data';
import { Sparkline } from './Sparkline';

const series = observed.map((p) => p.value);
const meta: Meta<typeof Sparkline> = {
  title: 'Data/Sparkline',
  component: Sparkline,
  args: { values: series, ariaLabel: 'Annual emissions from 1990 to 2024, rising from about 22 to about 37 gigatonnes. Illustrative values.' },
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 20rem)', color: 'var(--syn-color-text-primary)' }}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Sparkline>;

const pathOf = (el: HTMLElement, cls: string) => el.querySelector(`path[class*="__${cls}__"]`) as SVGPathElement;
const points = (d: string) => [...d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

export const DrawsEveryValueFromEdgeToEdge: Story = {
  play: async ({ canvasElement }) => {
    const pts = points(pathOf(canvasElement, 'line').getAttribute('d')!);
    await expect(pts).toHaveLength(series.length);
    await expect(pts[0][0]).toBe(0);
    await expect(pts[pts.length - 1][0]).toBe(100);
    // Higher values are higher up the line (smaller y), and the highest and lowest values reach near the top and bottom.
    const ys = pts.map((p) => p[1]);
    await expect(ys.indexOf(Math.min(...ys))).toBe(series.indexOf(Math.max(...series)));
    await expect(ys.indexOf(Math.max(...ys))).toBe(series.indexOf(Math.min(...series)));
    // It has a name and fills the container's width.
    const svg = within(canvasElement).getByRole('img', { name: /Annual emissions from 1990/ });
    await expect(svg.getBoundingClientRect().width).toBeGreaterThan(200);
  },
};

export const AGapBreaksTheLine: Story = {
  args: { values: [1, 2, 3, null, null, 6, 7, 8], ariaLabel: 'Values with a gap in the middle.' },
  play: async ({ canvasElement }) => {
    const d = pathOf(canvasElement, 'line').getAttribute('d')!;
    // Two runs, never joined across the gap.
    await expect(d.match(/M/g)).toHaveLength(2);
    await expect(points(d)).toHaveLength(6);
  },
};

export const AFlatSeriesSitsInTheMiddle: Story = {
  args: { values: [5, 5, 5, 5], ariaLabel: 'Four equal values.' },
  play: async ({ canvasElement }) => {
    await expect(new Set(points(pathOf(canvasElement, 'line').getAttribute('d')!).map((p) => p[1]))).toEqual(new Set([50]));
  },
};

export const OnePointStillShows: Story = {
  args: { values: [4], ariaLabel: 'One value.' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('path[class*="__end__"]')).not.toBeNull();
  },
};

export const EndDotAndFill: Story = {
  args: { filled: true, size: 'md' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('path[class*="__fill__"]')).not.toBeNull();
    const dot = pathOf(canvasElement, 'end');
    const last = points(pathOf(canvasElement, 'line').getAttribute('d')!).pop()!;
    await expect(points(dot.getAttribute('d')!)[0]).toEqual(last);
  },
};

export const TheEndDotStaysInsideTheBoxAtAnySize: Story = {
  args: { filled: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-4)' }}>
      {(['sm', 'md'] as const).flatMap((size) => ['4rem', '12rem', '100%'].map((w) => (
        <div key={`${size}-${w}`} style={{ width: w }}><Sparkline {...args} size={size} ariaLabel={`Sparkline ${size} ${w}`} /></div>
      )))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const svg of canvasElement.querySelectorAll('svg')) {
      const box = svg.getBoundingClientRect();
      const dot = svg.querySelector('path[class*="__end__"]') as SVGPathElement;
      const dotBox = dot.getBoundingClientRect(); // the dot's centre: a zero-length path
      const radius = parseFloat(getComputedStyle(dot).strokeWidth) / 2;
      await expect(dotBox.right + radius).toBeLessThanOrEqual(box.right + 0.01);
      await expect(dotBox.left - radius).toBeGreaterThanOrEqual(box.left - 0.01);
      await expect(dotBox.top - radius).toBeGreaterThanOrEqual(box.top - 0.01);
      await expect(dotBox.bottom + radius).toBeLessThanOrEqual(box.bottom + 0.01);
      // The line, too, is inside the box (the dot is the widest thing drawn).
      const line = svg.querySelector('path[class*="__line__"]') as SVGPathElement;
      const lineBox = line.getBoundingClientRect(); const half = parseFloat(getComputedStyle(line).strokeWidth) / 2;
      await expect(lineBox.top - half).toBeGreaterThanOrEqual(box.top - 0.01);
      await expect(lineBox.bottom + half).toBeLessThanOrEqual(box.bottom + 0.01);
    }
  },
};

export const NoEndDot: Story = { args: { showEnd: false }, play: async ({ canvasElement }) => { await expect(canvasElement.querySelector('path[class*="__end__"]')).toBeNull(); } };

export const OnTheDataPanel: Story = {
  args: { surface: 'panel' },
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', background: 'var(--syn-data-surface)', width: 'min(100%, 20rem)' }}><Story /></div>],
  play: async ({ canvasElement }) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--syn-data-cat-1)';
    canvasElement.appendChild(probe);
    await expect(getComputedStyle(pathOf(canvasElement, 'line')).stroke).toBe(getComputedStyle(probe).color);
    probe.remove();
  },
};

export const Tidewater: Story = { globals: { theme: 'tidewater' } };
export const TidewaterOnThePanel: Story = {
  args: { surface: 'panel', filled: true },
  globals: { theme: 'tidewater' },
  decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', background: 'var(--syn-data-surface)', width: 'min(100%, 20rem)' }}><Story /></div>],
};
