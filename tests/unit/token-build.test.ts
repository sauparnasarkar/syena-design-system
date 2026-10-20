import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/colour';
// @ts-expect-error plain module without types
import { buildTokens } from '../../tokens/build.config.mjs';

const css = () => readFileSync('src/generated/tokens.css', 'utf8');
const block = (selector: string) => {
  const start = css().indexOf(`${selector} {`);
  const end = css().indexOf('\n}', start);
  return css().slice(start, end);
};
const names = (text: string) => new Set([...text.matchAll(/(--syn-[a-z0-9-]+):/g)].map((m) => m[1]));

describe('token build', () => {
  let report: { total: number; withinRange: boolean };
  beforeAll(async () => { report = await buildTokens(); });

  it('emits a token count within the target range', () => {
    expect(report.withinRange).toBe(true);
  });

  it('gives every theme the same set of colour and data variables', () => {
    const night = names(block('[data-syn-theme="night"]'));
    const tidewater = names(block('[data-syn-theme="tidewater"]'));
    expect([...night].sort()).toEqual([...tidewater].sort());
    expect(night.size).toBeGreaterThan(60);
  });

  it('keeps references as variables and leaves none unresolved', () => {
    expect(css()).toContain('var(--syn-family-ui)');
    expect(css()).not.toMatch(/\{[a-z.-]+\}/);
  });

  it('records every required contrast pair as passing', () => {
    const matrix = JSON.parse(readFileSync('src/generated/reports/contrast-matrix.json', 'utf8')) as Array<{ required: boolean; pass: boolean; theme: string }>;
    expect(matrix.filter((m) => m.required).length).toBeGreaterThan(150);
    expect(matrix.filter((m) => m.required && !m.pass)).toEqual([]);
    expect(new Set(matrix.map((m) => m.theme))).toEqual(new Set(['night', 'tidewater']));
  });

  it('writes typed constants for the chart and grid themes', () => {
    const ts = readFileSync('src/generated/tokens.ts', 'utf8');
    expect(ts).toContain('export const themes');
    expect(ts).toContain('export const breakpointPx');
  });

  it('validates the heat scale in both themes: borders visible, the deepest step apart from the ground, steps ordered', () => {
    const matrix = JSON.parse(readFileSync('src/generated/reports/contrast-matrix.json', 'utf8')) as Array<{ pair: string; pass: boolean; theme: string; ratio: number; target: number }>;
    for (const theme of ['night', 'tidewater']) {
      const heat = matrix.filter((m) => m.theme === theme && m.pair.startsWith('data-heat-'));
      expect(heat).toHaveLength(7);
      for (const m of heat) expect(m.ratio).toBeGreaterThanOrEqual(3);
      const deepest = matrix.find((m) => m.theme === theme && m.pair.startsWith('the deepest heat step'));
      expect(deepest?.pass).toBe(true);
      // Lighter first: contrast against the dark ground falls as the scale deepens.
      const ratios = heat.map((m) => m.ratio);
      expect(ratios).toEqual([...ratios].sort((a, b) => b - a));
    }
  });

  it('names the no-data colour as quieter than the 3:1 floor but never a hue', () => {
    const matrix = JSON.parse(readFileSync('src/generated/reports/contrast-matrix.json', 'utf8')) as Array<{ pair: string; pass: boolean; theme: string; ratio: number }>;
    for (const theme of ['night', 'tidewater']) {
      const noData = matrix.find((m) => m.theme === theme && m.pair === 'data-no-data on data-surface')!;
      expect(noData.ratio).toBeGreaterThan(1.8);
      expect(noData.ratio).toBeLessThan(3);
      expect(matrix.find((m) => m.theme === theme && m.pair === 'text on data-no-data (data-ink-light)')?.pass).toBe(true);
    }
  });
});

describe('the data panel scope', () => {
  const colourRoles = (text: string) => [...text.matchAll(/--syn-color-([a-z-]+):/g)].map((m) => m[1]).sort();
  beforeAll(async () => { await buildTokens(); });

  it('takes a panel value for every colour role, in either theme', () => {
    const scope = block('.syn-data-panel');
    const roles = colourRoles(block('[data-syn-theme="tidewater"]'));
    expect(colourRoles(scope)).toEqual(roles);
    for (const role of roles) expect(scope).toContain(`--syn-color-${role}: var(--syn-data-panel-${role});`);
  });

  it('leaves a dark theme as it is: each panel value is the theme\'s own role', () => {
    const night = block('[data-syn-theme="night"]');
    for (const m of night.matchAll(/--syn-data-panel-([a-z-]+): ([^;]+);/g)) expect(m[2]).toBe(`var(--syn-color-${m[1]})`);
  });

  it('gives a light theme panel values of its own, light text on the dark ground', () => {
    const tidewater = block('[data-syn-theme="tidewater"]');
    const value = (name: string) => tidewater.match(new RegExp(`--syn-${name}: (#[0-9a-f]{6});`))![1];
    expect(value('data-panel-text-primary')).not.toBe(value('color-text-primary'));
    expect(contrastRatio(value('data-panel-text-primary'), value('data-surface'))).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(value('data-panel-signal-negative-text'), value('data-surface'))).toBeGreaterThanOrEqual(4.5);
  });
});
