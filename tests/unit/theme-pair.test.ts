import { describe, expect, it } from 'vitest';
import { checkThemePair, defaultThemePair, isOffered, systemThemeFor } from '../../src/theme/themePair';

describe('a pair of themes', () => {
  it('defaults to night and tidewater', () => {
    expect(defaultThemePair).toEqual(['night', 'tidewater']);
  });

  it.each([
    [['night', 'tidewater']],
    [['night', 'ledger']],
    [['ledger', 'night']],
  ] as const)('accepts %j, one dark and one light', (pair) => {
    expect(checkThemePair(pair)).toEqual(pair);
  });

  it.each([
    [['tidewater', 'ledger']],
    [['night', 'night']],
  ] as const)('refuses %j: it does not hold one dark and one light theme', (pair) => {
    expect(() => checkThemePair(pair)).toThrow(/one dark and one light/);
  });

  it('refuses a theme that does not exist', () => {
    expect(() => checkThemePair(['night', 'dusk'] as never)).toThrow(/unknown theme/);
  });
});

describe('the theme `system` gives', () => {
  it.each([
    [['night', 'tidewater'], true, 'night'],
    [['night', 'tidewater'], false, 'tidewater'],
    [['night', 'ledger'], true, 'night'],
    [['night', 'ledger'], false, 'ledger'],
    [['ledger', 'night'], true, 'night'],
    [['ledger', 'night'], false, 'ledger'],
  ] as const)('in %j with a dark preference of %s is %s', (pair, dark, expected) => {
    expect(systemThemeFor(pair, dark)).toBe(expected);
  });
});

describe('which themes are on offer', () => {
  it('counts only the two in the pair', () => {
    expect(isOffered(['night', 'ledger'], 'ledger')).toBe(true);
    expect(isOffered(['night', 'ledger'], 'tidewater')).toBe(false);
    expect(isOffered(['night', 'ledger'], 'system')).toBe(false);
    expect(isOffered(['night', 'ledger'], null)).toBe(false);
  });
});
