import { describe, expect, it } from 'vitest';
import { bandCounts, bandIndex, defaultBandLabels, defaultBreaks, validBreaks } from '../../src/charts/map/bands';
import { tableRows } from '../../src/charts/map/tableRows';

describe('bandIndex', () => {
  it('puts a value equal to a break in the upper band, at every edge', () => {
    defaultBreaks.forEach((b, i) => {
      expect(bandIndex(b, defaultBreaks)).toBe(i + 1);
      expect(bandIndex(b - 1e-9, defaultBreaks)).toBe(i);
    });
  });

  it('puts values below the first break in the first band and above the last in the eighth', () => {
    expect(bandIndex(0.0001, defaultBreaks)).toBe(0);
    expect(bandIndex(1e9, defaultBreaks)).toBe(7);
  });
});

describe('bandCounts', () => {
  it('counts the values in each of the eight bands', () => {
    expect(bandCounts([0.5, 1, 9.9, 10, 10, 2500, 90000], defaultBreaks)).toEqual([1, 2, 2, 0, 0, 0, 0, 2]);
  });
});

describe('defaultBandLabels', () => {
  it('writes each band\'s range from the breaks', () => {
    expect(defaultBandLabels(defaultBreaks)).toEqual(['<1', '1–10', '10–100', '100–250', '250–500', '500–1k', '1k–2.5k', '2.5k+']);
    expect(defaultBandLabels([100, 1000, 5000, 20000, 50000, 100000, 250000])).toEqual(['<100', '100–1k', '1k–5k', '5k–20k', '20k–50k', '50k–100k', '100k–250k', '250k+']);
  });
});

describe('validBreaks', () => {
  it('needs seven strictly ascending finite values', () => {
    expect(validBreaks(defaultBreaks)).toBe(true);
    expect(validBreaks([1, 2, 3])).toBe(false);
    expect(validBreaks([1, 10, 10, 250, 500, 1000, 2500])).toBe(false);
    expect(validBreaks([1, 10, 100, 250, 500, 1000, Number.NaN])).toBe(false);
  });
});

describe('tableRows on a banded map', () => {
  it('adds each country\'s band range beside its value, and none for a country without data', () => {
    const rows = tableRows({ USA: 5000, CHN: 12 }, undefined, 'No data', (v) => defaultBandLabels(defaultBreaks)[bandIndex(v, defaultBreaks)]);
    expect(rows.find((r) => r.code === 'USA')?.band).toBe('2.5k+');
    expect(rows.find((r) => r.code === 'CHN')?.band).toBe('10–100');
    expect(rows.find((r) => r.text === 'No data')?.band).toBe('');
  });
});
