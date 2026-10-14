import { describe, expect, it } from 'vitest';
import { tokenVariable } from '../../src/theme/resolveToken';

describe('tokenVariable', () => {
  it('accepts a bare name, a custom property and a var() reference', () => {
    expect(tokenVariable('color-surface-base')).toBe('--syn-color-surface-base');
    expect(tokenVariable('--syn-color-surface-base')).toBe('--syn-color-surface-base');
    expect(tokenVariable('var(--syn-data-cat-1)')).toBe('--syn-data-cat-1');
  });
});
