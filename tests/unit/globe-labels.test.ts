import { describe, expect, it } from 'vitest';
import { collidingLabels } from '../../src/components/Globe/labels';

const box = (left: number, top: number, width = 60, height = 16) => ({ left, top, right: left + width, bottom: top + height, width });

describe('collidingLabels', () => {
  it('keeps every label when none touch', () => {
    expect([...collidingLabels([{ id: 'A', box: box(0, 0) }, { id: 'B', box: box(100, 0) }, { id: 'C', box: box(0, 40) }])]).toEqual([]);
  });

  it('hides the later of two overlapping labels and keeps the earlier one', () => {
    expect([...collidingLabels([{ id: 'CHN', box: box(0, 0) }, { id: 'KOR', box: box(30, 6) }])]).toEqual(['KOR']);
    expect([...collidingLabels([{ id: 'KOR', box: box(30, 6) }, { id: 'CHN', box: box(0, 0) }])]).toEqual(['CHN']);
  });

  it('counts labels that sit closer than the gap as touching, and ones just clear of it as apart', () => {
    expect([...collidingLabels([{ id: 'A', box: box(0, 0) }, { id: 'B', box: box(61, 0) }])]).toEqual(['B']); // 1 px apart
    expect([...collidingLabels([{ id: 'A', box: box(0, 0) }, { id: 'B', box: box(63, 0) }])]).toEqual([]); // 3 px apart
  });

  it('judges a label against the labels kept, not against ones already hidden', () => {
    // B overlaps A (hidden), C overlaps only B: C is kept because B is not on the picture
    const hidden = collidingLabels([{ id: 'A', box: box(0, 0) }, { id: 'B', box: box(40, 0) }, { id: 'C', box: box(90, 0) }]);
    expect([...hidden]).toEqual(['B']);
  });

  it('ignores a label with no size yet (before layout)', () => {
    expect([...collidingLabels([{ id: 'A', box: box(0, 0, 0, 0) }, { id: 'B', box: box(0, 0, 0, 0) }])]).toEqual([]);
  });
});
