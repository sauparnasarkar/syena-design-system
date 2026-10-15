import { expect } from 'storybook/test';

/** The tick labels a reader can see: laid out and not hidden. */
const visibleTicks = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('li')].filter((li) => getComputedStyle(li).visibility !== 'hidden' && li.closest('ul') && /^[\d.,]+$/.test(li.textContent ?? ''));

/** The legend's labels stay inside the bar, never touch, and keep both ends; `all` says whether every power of ten must show. */
export async function expectLegendFits(root: HTMLElement, { all }: { all: boolean }) {
  const bar = root.querySelector('[class*="bar"]') as HTMLElement;
  const box = bar.getBoundingClientRect();
  const ticks = visibleTicks(root);
  const texts = ticks.map((t) => t.textContent);
  await expect(texts[0]).toBe('0.01');
  await expect(texts[texts.length - 1]).toBe('10,000');
  if (all) await expect(ticks).toHaveLength(7); else await expect(ticks.length).toBeLessThan(7);
  let previousRight = -Infinity;
  for (const tick of ticks) {
    const r = tick.getBoundingClientRect();
    await expect(r.left).toBeGreaterThanOrEqual(box.left - 0.5);
    await expect(r.right).toBeLessThanOrEqual(box.right + 0.5);
    await expect(r.left).toBeGreaterThan(previousRight);
    previousRight = r.right;
  }
}

/** The hint takes at most two lines and the last is not a lone word. */
export async function expectHintBalanced(root: HTMLElement) {
  const hint = [...root.querySelectorAll('p')].find((p) => /Arrow keys/.test(p.textContent ?? ''))!;
  const range = document.createRange();
  range.selectNodeContents(hint);
  const lines = new Map<number, { left: number; right: number }>();
  for (const r of range.getClientRects()) {
    const top = Math.round(r.top);
    const l = lines.get(top);
    lines.set(top, { left: Math.min(l?.left ?? Infinity, r.left), right: Math.max(l?.right ?? -Infinity, r.right) });
  }
  const widths = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v.right - v.left);
  await expect(widths.length).toBeLessThanOrEqual(2);
  if (widths.length === 2) await expect(widths[1]).toBeGreaterThanOrEqual(widths[0] * 0.4);
}
