import { describe, expect, it } from 'vitest';
import { placePopover } from './position';

const viewport = { width: 1000, height: 700 };
const size = { width: 360, height: 400 };
const box = (left: number, top: number, w = 40, h = 40) => ({ left, top, right: left + w, bottom: top + h });

describe('placePopover', () => {
  it('goes below the trigger, its far edge on the trigger\'s, where there is room', () => {
    const p = placePopover(box(900, 20), size, viewport, 'bottom', 'end', 8, 8);
    expect(p).toMatchObject({ side: 'bottom', top: 68, left: 580 });
  });

  it('flips above when it does not fit below and there is more room above', () => {
    const p = placePopover(box(900, 600), size, viewport, 'bottom', 'end', 8, 8);
    expect(p.side).toBe('top');
    expect(p.top).toBe(600 - 8 - 400);
  });

  it('stays on the preferred side when neither side fits and it has at least as much room, holding to the room with a max height', () => {
    const p = placePopover(box(900, 120), { width: 360, height: 900 }, viewport, 'bottom', 'end', 8, 8);
    expect(p.side).toBe('bottom');
    expect(p.maxHeight).toBe(700 - 160 - 8 - 8);
  });

  it('sits beside a rail\'s trigger, bottom edges lined up, and never leaves the viewport', () => {
    const p = placePopover(box(12, 640), size, viewport, 'right', 'end', 8, 8);
    expect(p.side).toBe('right');
    expect(p.left).toBe(60);
    expect(p.top).toBe(640 + 40 - 400);
    expect(p.top + 400).toBeLessThanOrEqual(692);
  });

  it('slides along the side to stay in view, and shrinks to a narrow screen', () => {
    const phone = { width: 360, height: 700 };
    const p = placePopover(box(8, 20), { width: 360, height: 300 }, phone, 'bottom', 'end', 8, 8);
    expect(p.left).toBe(8);
  });
});
