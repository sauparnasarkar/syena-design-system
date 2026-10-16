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
    // Edge to edge, inset by the end dot's radius so the dot is inside the box.
    const svg0 = canvasElement.querySelector('svg') as SVGSVGElement;
    const inset = parseFloat(getComputedStyle(svg0.querySelector('path[class*="__end__"]')!).strokeWidth) / 2;
    await expect(pts[0][0]).toBeCloseTo(inset, 1);
    await expect(pts[pts.length - 1][0]).toBeCloseTo(svg0.clientWidth - inset, 1);
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
    const svg = canvasElement.querySelector('svg') as SVGSVGElement;
    await expect(new Set(points(pathOf(canvasElement, 'line').getAttribute('d')!).map((p) => p[1]))).toEqual(new Set([Number((svg.clientHeight / 2).toFixed(2))]));
  },
};

export const OnePointStillShows: Story = {
  args: { values: [4], ariaLabel: 'One value.' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('path[class*="__end__"]')).not.toBeNull();
  },
};

export const EndDotAndFill: Story = {
  // Also run in the browser with floating scrollbars, since the layout there differs.
  tags: ['both-scrollbar-modes'],
  args: { filled: true, size: 'md' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('path[class*="__fill__"]')).not.toBeNull();
    const dot = pathOf(canvasElement, 'end');
    const last = points(pathOf(canvasElement, 'line').getAttribute('d')!).pop()!;
    await expect(points(dot.getAttribute('d')!)[0]).toEqual(last);
    await expectWholeRoundDot(canvasElement.querySelector('svg') as SVGSVGElement);
  },
};

/**
 * What a part of the sparkline actually paints, in pixels of the component's drawing area: the SVG's content box, which is
 * its viewport and what clips it. The part is drawn alone, on its own canvas of that size, so a stroke cut off by the
 * viewport shows as a smaller painted area.
 */
async function painted(svg: SVGSVGElement, part: string) {
  const style = getComputedStyle(svg);
  const w = Math.round(svg.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
  const h = Math.round(svg.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute('class');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w)); clone.setAttribute('height', String(h));
  clone.setAttribute('style', 'overflow:hidden');
  const live = [...svg.querySelectorAll('path')];
  [...clone.querySelectorAll('path')].forEach((path, i) => {
    const cs = getComputedStyle(live[i]);
    if (!live[i].getAttribute('class')?.includes(part)) { path.remove(); return; }
    path.removeAttribute('class');
    path.setAttribute('style', `fill:${cs.fill};stroke:${cs.stroke};stroke-width:${cs.strokeWidth};stroke-linecap:${cs.strokeLinecap};opacity:${cs.opacity}`);
  });
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('could not rasterise')); image.src = url; });
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let left = w; let right = -1; let top = h; let bottom = -1;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (data[(y * w + x) * 4 + 3] > 40) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  return { w, h, left, top, width: right - left + 1, height: bottom - top + 1, right: right + 1, bottom: bottom + 1, stroke: parseFloat(getComputedStyle(live.find((l) => l.getAttribute('class')?.includes(part))!).strokeWidth), data };
}

const expectWholeRoundDot = async (svg: SVGSVGElement) => {
  const dot = await painted(svg, '__end__');
  // Painted whole: as wide and as tall as its stroke, so nothing was cut off, and round: no wider than tall.
  await expect(Math.abs(dot.width - dot.stroke)).toBeLessThanOrEqual(1.5);
  await expect(Math.abs(dot.height - dot.stroke)).toBeLessThanOrEqual(1.5);
  await expect(Math.abs(dot.width - dot.height)).toBeLessThanOrEqual(1);
  // Inside the drawing area on every side.
  await expect(dot.left).toBeGreaterThanOrEqual(0); await expect(dot.top).toBeGreaterThanOrEqual(0);
  await expect(dot.right).toBeLessThanOrEqual(dot.w); await expect(dot.bottom).toBeLessThanOrEqual(dot.h);
  // Round: the painted pixels fill a disc, not a square. A square would fill its box; a disc fills about 78% of it.
  let filled = 0;
  for (let i = 3; i < dot.data.length; i += 4) if (dot.data[i] > 127) filled += 1;
  await expect(filled / (dot.width * dot.height)).toBeGreaterThan(0.6);
  await expect(filled / (dot.width * dot.height)).toBeLessThan(0.9);
};

export const TheEndDotStaysInsideTheBoxAtAnySize: Story = {
  // Also run in the browser with floating scrollbars, since the layout there differs.
  tags: ['both-scrollbar-modes'],
  args: { filled: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--syn-space-4)' }}>
      {(['sm', 'md'] as const).flatMap((size) => ['4rem', '12rem', '100%'].map((w) => (
        <div key={`${size}-${w}`} style={{ width: w }}><Sparkline {...args} size={size} ariaLabel={`Sparkline ${size} ${w}`} /></div>
      )))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const svg of canvasElement.querySelectorAll('svg')) await expectWholeRoundDot(svg);
    // Every part is inside the border box, too: nothing paints outside the component.
    for (const svg of canvasElement.querySelectorAll('svg')) {
      const box = svg.getBoundingClientRect();
      await expect(svg.style.overflow).toBe('');
      for (const part of svg.querySelectorAll('path')) {
        const r = part.getBoundingClientRect(); const half = getComputedStyle(part).stroke === 'none' ? 0 : parseFloat(getComputedStyle(part).strokeWidth) / 2;
        await expect(r.left - half).toBeGreaterThanOrEqual(box.left - 0.01); await expect(r.right + half).toBeLessThanOrEqual(box.right + 0.01);
        await expect(r.top - half).toBeGreaterThanOrEqual(box.top - 0.01); await expect(r.bottom + half).toBeLessThanOrEqual(box.bottom + 0.01);
      }
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
