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

describe('country series', () => {
  it('passes through the indicator table and ends its projection at the stated change', async () => {
    const { countryObserved, countryScenarios, anomaly } = await import('../../src/specimens/data');
    const at = (year: number) => countryObserved.find((p) => p.year === year)!.value;
    expect(at(1990)).toBeCloseTo(412, 0);
    expect(at(2000)).toBeCloseTo(468, 0);
    expect(at(2010)).toBeCloseTo(521, 0);
    expect(at(2024)).toBeCloseTo(449, 0);
    const end = countryScenarios[0].points[countryScenarios[0].points.length - 1];
    expect(end.year).toBe(2050);
    expect((end.value / at(2024) - 1) * 100).toBeCloseTo(-18, 0);
    // The temperature anomaly is on the 1991 to 2020 baseline: near zero early, about +0.6 now.
    expect(Math.abs(anomaly[0].value)).toBeLessThan(0.3);
    expect(anomaly[anomaly.length - 1].value).toBeGreaterThan(0.4);
    expect(anomaly[anomaly.length - 1].value).toBeLessThan(0.9);
  });
});
