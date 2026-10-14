import { describe, expect, it } from 'vitest';
import { composition } from '../../src/specimens/data';

describe('composition data', () => {
  it('keeps every share at or above zero and the parts at 100', () => {
    for (const row of composition) {
      expect(Math.min(...row.parts)).toBeGreaterThanOrEqual(0);
      expect(row.parts.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
    }
  });
});
