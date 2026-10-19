import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { breakpointPx } from '../../src/generated/tokens';

const css = readFileSync('src/generated/tokens.css', 'utf8');
const root = (name: string) => css.match(new RegExp(`${name}: ([\\d.]+)rem`))?.[1];

describe('shell breakpoints and gutter', () => {
  it('lays a 768 px wide window out compact: the navigation is a drawer, not a rail', () => {
    expect(breakpointPx.compact).toBeGreaterThanOrEqual(768);
    // And not so wide that a small laptop window is.
    expect(breakpointPx.compact).toBeLessThan(breakpointPx.regular);
  });

  it('has a page gutter of one twentieth of the reflow floor, 16 px, for a phone', () => {
    expect(Number(root('--syn-layout-page-gutter')) * 16).toBe(16);
  });
});
