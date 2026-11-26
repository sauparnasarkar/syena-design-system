import { describe, expect, it } from 'vitest';
import { checkThemePair, defaultThemePair, isOffered, resolveChoice, resolveTheme, systemThemeFor } from '../../src/theme/themePair';

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

  it('refuses a pair that is not exactly two names', () => {
    expect(() => checkThemePair(['night', 'ledger', 'dusk'] as never)).toThrow(/exactly two/);
    expect(() => checkThemePair(['night'] as never)).toThrow(/exactly two/);
    expect(() => checkThemePair('night,ledger' as never)).toThrow(/exactly two/);
  });

  it('refuses a name the system only inherits', () => {
    expect(() => checkThemePair(['night', 'toString'] as never)).toThrow(/unknown theme/);
    expect(() => checkThemePair(['constructor', 'ledger'] as never)).toThrow(/unknown theme/);
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

describe('the choice in force', () => {
  const pair = ['night', 'ledger'] as const;

  it('keeps a choice that is on offer, and `system`', () => {
    expect(resolveChoice(pair, 'ledger', 'night')).toBe('ledger');
    expect(resolveChoice(pair, 'system', 'night')).toBe('system');
  });

  it('gives way to a valid default when the choice is not on offer', () => {
    // The stored choice was tidewater; the pair is now night and ledger.
    expect(resolveChoice(pair, 'tidewater', 'night')).toBe('night');
    expect(resolveChoice(pair, null, 'ledger')).toBe('ledger');
  });

  it('falls back to system when neither the choice nor the default is on offer', () => {
    expect(resolveChoice(pair, 'tidewater', 'tidewater')).toBe('system');
    expect(resolveChoice(pair, 'dusk', undefined)).toBe('system');
  });
});

describe('the theme in force', () => {
  const pair = ['night', 'ledger'] as const;

  it('is the forced theme when it is one of the pair', () => {
    expect(resolveTheme(pair, 'ledger', 'night', true)).toBe('ledger');
  });

  it('refuses a forced theme outside the pair', () => {
    expect(() => resolveTheme(pair, 'tidewater', 'system', false)).toThrow(/not one of themes/);
  });

  it('follows the choice, or the colour preference for system', () => {
    expect(resolveTheme(pair, undefined, 'ledger', true)).toBe('ledger');
    expect(resolveTheme(pair, undefined, 'system', true)).toBe('night');
    expect(resolveTheme(pair, undefined, 'system', false)).toBe('ledger');
  });
});

describe('a pair that changes shape', () => {
  it('is checked whatever its text form: two names that join the same are still two names', () => {
    expect(() => checkThemePair(['night,ledger'] as never)).toThrow(/exactly two/);
    expect(JSON.stringify(['night', 'ledger'])).not.toBe(JSON.stringify(['night,ledger']));
  });
});
