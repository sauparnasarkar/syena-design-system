import { describe, expect, it } from 'vitest';
import { pageSlots } from '../../src/components/Pagination/Pagination';

describe('the numbered pages shown', () => {
  it('lists every page when they all fit', () => {
    expect(pageSlots(3, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageSlots(1, 1, 1)).toEqual([1]);
  });

  it('keeps the same number of slots at the start, in the middle and at the end', () => {
    expect(pageSlots(1, 20, 1)).toEqual([1, 2, 3, 4, 5, 'gap-end', 20]);
    expect(pageSlots(4, 20, 1)).toEqual([1, 2, 3, 4, 5, 'gap-end', 20]);
    expect(pageSlots(10, 20, 1)).toEqual([1, 'gap-start', 9, 10, 11, 'gap-end', 20]);
    expect(pageSlots(17, 20, 1)).toEqual([1, 'gap-start', 16, 17, 18, 19, 20]);
    expect(pageSlots(20, 20, 1)).toEqual([1, 'gap-start', 16, 17, 18, 19, 20]);
  });

  it('always shows the first page, the last page and the current page', () => {
    for (let page = 1; page <= 30; page += 1) {
      const slots = pageSlots(page, 30, 1);
      expect(slots).toContain(1);
      expect(slots).toContain(30);
      expect(slots).toContain(page);
      expect(slots).toHaveLength(7);
    }
  });

  it('widens with the sibling count', () => {
    expect(pageSlots(10, 30, 2)).toEqual([1, 'gap-start', 8, 9, 10, 11, 12, 'gap-end', 30]);
  });
});
