import { readFileSync } from 'node:fs';
// @ts-expect-error culori ships no type declarations
import { converter } from 'culori';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/colour';
import { themePolarity } from '../../src/generated/tokens';

const toOklch = converter('oklch');
const read = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;
type Seeds = Record<string, Record<string, { $value: string }>>;
type Theme = { data: { cat: Record<string, { $value: string }> }; color: Record<string, unknown> };
type Pair = { theme: string; pair: string; required: boolean; pass: boolean; ratio: number; target: number };

const seeds = read<Seeds>('tokens/primitives/seeds.json');
const hue = (value: string) => toOklch(value)?.h ?? 0;
const distance = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
const matrix = () => read<Pair[]>('src/generated/reports/contrast-matrix.json');

describe('the ledger theme', () => {
  it('is a light theme, beside a dark and a light one', () => {
    expect(themePolarity).toEqual({ night: 'dark', tidewater: 'light', ledger: 'light' });
  });

  it('is built from exactly these seed roles, all roles the other themes already use', () => {
    const roles = Object.keys(seeds.ledger).sort();
    expect(roles).toEqual(['accent-fill', 'border-default', 'data-surface', 'signal-caution-fill', 'signal-negative-fill', 'signal-positive-fill', 'surface-base', 'text-muted', 'text-primary', 'text-secondary']);
    const known = new Set([...Object.keys(seeds.night), ...Object.keys(seeds.tidewater)]);
    for (const role of roles) expect(known.has(role), role).toBe(true);
  });

  it('passes every required contrast pair: the other light theme\'s families plus the accent seed pair', () => {
    const required = matrix().filter((m) => m.theme === 'ledger' && m.required);
    expect(required.length).toBe(matrix().filter((m) => m.theme === 'tidewater' && m.required).length + 1);
    expect(required.filter((m) => !m.pass)).toEqual([]);
  });

  it('reaches the text targets on the canvas with the seed text colours', () => {
    const ratio = (pair: string) => matrix().find((m) => m.theme === 'ledger' && m.pair === pair)?.ratio ?? 0;
    expect(ratio('text-primary on surface-base')).toBeGreaterThanOrEqual(7);
    expect(ratio('text-secondary on surface-base')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('text-muted on surface-base')).toBeGreaterThanOrEqual(4.5);
  });

  it('checks the accent seed against the canvas, so changing the seed cannot lower the pair unnoticed', () => {
    const pair = matrix().find((m) => m.theme === 'ledger' && m.pair === 'accent-fill on surface-base');
    expect(pair).toMatchObject({ required: true, target: 4.6, pass: true });
    expect(contrastRatio(seeds.ledger['accent-fill'].$value, seeds.ledger['surface-base'].$value)).toBeGreaterThanOrEqual(4.6);
    // Only ledger carries the rule; the other themes' accents are not held to it.
    expect(matrix().some((m) => m.theme !== 'ledger' && m.pair === 'accent-fill on surface-base')).toBe(false);
  });

  it('keeps the accent and the secondary accent at least 45 degrees from both signals', () => {
    const positive = hue(seeds.ledger['signal-positive-fill'].$value);
    const negative = hue(seeds.ledger['signal-negative-fill'].$value);
    const accent = hue(seeds.ledger['accent-fill'].$value);
    for (const candidate of [accent, (accent + 60) % 360]) {
      expect(distance(candidate, positive)).toBeGreaterThanOrEqual(45);
      expect(distance(candidate, negative)).toBeGreaterThanOrEqual(45);
    }
  });

  it('uses a different accent hue from the other light theme', () => {
    expect(distance(hue(seeds.ledger['accent-fill'].$value), hue(seeds.tidewater['accent-fill'].$value))).toBeGreaterThan(30);
  });
});

describe('the categorical palette', () => {
  // Slot hues are planned once for all themes. Adding a theme must not move them, so the colours of
  // existing themes (and every chart drawn in them) stay as they are.
  const planned = [225, 75, 324, 273, 108, 249, 297, 90];
  const slotHues = (theme: string) => {
    const cat = read<Theme>(`tokens/themes/${theme}.json`).data.cat;
    return Object.keys(cat).sort((a, b) => Number(a) - Number(b)).map((k) => hue(cat[k].$value));
  };

  it.each(['night', 'tidewater', 'ledger'])('keeps the planned slot hues in %s', (theme) => {
    const hues = slotHues(theme).slice(0, planned.length);
    hues.forEach((h, i) => expect(distance(h, planned[i]), `slot ${i + 1} is ${h.toFixed(1)}`).toBeLessThan(1.5));
  });

  it('puts slot 1 on the accent hue of the first two themes, not the mean of all three', () => {
    const first = hue(seeds.night['accent-fill'].$value);
    const second = hue(seeds.tidewater['accent-fill'].$value);
    expect(distance(slotHues('night')[0], (first + second) / 2)).toBeLessThan(3);
  });
});
