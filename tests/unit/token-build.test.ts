import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
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
});
