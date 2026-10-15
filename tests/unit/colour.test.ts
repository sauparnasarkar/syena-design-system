import { describe, expect, it } from 'vitest';
import { bestInk, contrastRatio } from '../../src/lib/colour';

describe('colour helpers', () => {
  it('measures contrast the way WCAG does', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 6);
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 4);
  });
  it('picks the ink that reads better', () => {
    expect(bestInk('#101820', '#f5f5f5', '#101010')).toBe('#f5f5f5');
    expect(bestInk('#f0e68c', '#f5f5f5', '#101010')).toBe('#101010');
  });
});
