import { describe, expect, it } from 'vitest';
import { degreesPerMillisecond, defaultTurnPeriod } from '../../src/components/Globe/turn';

describe('globe turn rate', () => {
  it('turns once in the period it is given', () => {
    expect(degreesPerMillisecond(30) * 30_000).toBeCloseTo(360, 9);
    expect(degreesPerMillisecond(60) * 60_000).toBeCloseTo(360, 9);
  });
  it('turns slowly by default: a minute a turn', () => {
    expect(defaultTurnPeriod).toBe(60);
    expect(degreesPerMillisecond(defaultTurnPeriod)).toBeCloseTo(0.006, 9);
  });
  it('falls back to the default for a period that is not a positive number', () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) expect(degreesPerMillisecond(bad)).toBeCloseTo(0.006, 9);
  });
});
