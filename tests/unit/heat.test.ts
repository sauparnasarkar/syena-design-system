import { describe, expect, it } from 'vitest';
import { blendStops, formatTick, heatColour, logPosition, logTicks } from '../../src/charts/map/heat';

describe('heat scale', () => {
  it('ticks at the powers of ten', () => {
    expect(logTicks([0.01, 10000])).toEqual([0.01, 0.1, 1, 10, 100, 1000, 10000]);
    expect(logTicks([0.5, 5000])).toEqual([1, 10, 100, 1000]);
  });

  it('places values on a log axis and clamps outside the domain', () => {
    expect(logPosition(1, [0.01, 10000])).toBeCloseTo(1 / 3, 6);
    expect(logPosition(0.001, [0.01, 10000])).toBe(0);
    expect(logPosition(1e9, [0.01, 10000])).toBe(1);
    expect(logPosition(0.1, [0.01, 10000])).toBeCloseTo(1 / 6, 6);
  });

  it('returns the stops themselves at the ticks and blends between them', () => {
    const stops = ['#ffff00', '#ff8000', '#c00000'];
    expect(heatColour(0.01, [0.01, 100], stops)).toBe('#ffff00');
    expect(heatColour(100, [0.01, 100], stops)).toBe('#c00000');
    expect(heatColour(1, [0.01, 100], stops)).toBe('#ff8000');
    const mid = blendStops(stops, 0.25);
    expect(mid).not.toBe('#ffff00');
    expect(mid).not.toBe('#ff8000');
  });

  it('writes large ticks with a separator', () => {
    expect(formatTick(10000)).toBe('10,000');
    expect(formatTick(0.01)).toBe('0.01');
  });
});
