import { describe, expect, it } from 'vitest';
import { squarify } from '../../src/charts/treemap/squarify';

const items = [{ id: 'a', v: 6 }, { id: 'b', v: 6 }, { id: 'c', v: 4 }, { id: 'd', v: 3 }, { id: 'e', v: 2 }, { id: 'f', v: 2 }, { id: 'g', v: 1 }, { id: 'zero', v: 0 }];
const box = { x: 10, y: 20, w: 600, h: 400 };

describe('squarified treemap', () => {
  const tiles = squarify(items, (i) => i.v, box);

  it('leaves out items with no value and places the rest', () => {
    expect(tiles.map((t) => t.item.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('gives every tile an area proportional to its value and fills the box', () => {
    const total = items.reduce((s, i) => s + i.v, 0);
    for (const t of tiles) expect((t.w * t.h) / (box.w * box.h)).toBeCloseTo(t.item.v / total, 6);
    expect(tiles.reduce((s, t) => s + t.w * t.h, 0)).toBeCloseTo(box.w * box.h, 4);
  });

  it('keeps every tile inside the box and none overlapping another', () => {
    const e = 1e-6;
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(box.x - e); expect(t.y).toBeGreaterThanOrEqual(box.y - e);
      expect(t.x + t.w).toBeLessThanOrEqual(box.x + box.w + e); expect(t.y + t.h).toBeLessThanOrEqual(box.y + box.h + e);
    }
    for (let i = 0; i < tiles.length; i += 1) for (let j = i + 1; j < tiles.length; j += 1) {
      const a = tiles[i]; const b = tiles[j];
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(overlapX > e && overlapY > e).toBe(false);
    }
  });

  it('keeps tiles close to square and is deterministic', () => {
    const worst = Math.max(...tiles.map((t) => Math.max(t.w / t.h, t.h / t.w)));
    expect(worst).toBeLessThan(3);
    expect(squarify(items, (i) => i.v, box)).toEqual(tiles);
  });

  it('returns nothing for an empty or collapsed box', () => {
    expect(squarify([], (i: { v: number }) => i.v, box)).toEqual([]);
    expect(squarify(items, (i) => i.v, { ...box, w: 0 })).toEqual([]);
  });
});
