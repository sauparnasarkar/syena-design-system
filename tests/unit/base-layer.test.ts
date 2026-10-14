import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/base/utilities.css', 'utf8');
const listed: string[] = JSON.parse(readFileSync('src/base/utilities.json', 'utf8')).classes;
const defined = [...css.matchAll(/^\.([a-z0-9-]+)\s*{/gm)].map((m) => m[1]);
const roles = ['display', 'title-lg', 'title-md', 'title-sm', 'text-lg', 'text-md', 'text-sm', 'caption', 'overline', 'figure-lg', 'figure-md', 'figure-sm'];

describe('utility classes', () => {
  it('lists exactly the classes the stylesheet defines', () => {
    expect([...listed].sort()).toEqual([...defined].sort());
  });
  it('covers every type role', () => {
    for (const role of roles) expect(listed).toContain(`syn-${role}`);
  });
  it('prefixes every class', () => {
    expect(listed.every((c) => c.startsWith('syn-'))).toBe(true);
  });
});

describe('base layer', () => {
  it('has one focus ring built from tokens and no colour literals', () => {
    const focus = readFileSync('src/base/focus.css', 'utf8');
    expect(focus).toContain('--syn-color-focus-ring');
    for (const f of ['reset', 'typography', 'focus', 'utilities']) {
      expect(readFileSync(`src/base/${f}.css`, 'utf8')).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    }
  });
  it('respects reduced motion', () => {
    expect(readFileSync('src/base/reset.css', 'utf8')).toContain('prefers-reduced-motion: reduce');
  });
});
