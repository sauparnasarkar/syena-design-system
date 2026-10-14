import { describe, expect, it } from 'vitest';
import {
  checkClasses, checkColourLiterals, checkCustomProperties, checkDataAttributes, checkInlineCustomProperties, checkVocabulary,
// @ts-expect-error plain module without types
} from '../../scripts/check-allowlist.mjs';

const file = (path: string, text: string) => ({ path, text });
const defined = new Set(['--syn-color-text-primary', '--syn-data-cat-1']);

describe('colour literals', () => {
  it('flags hex and colour functions', () => {
    expect(checkColourLiterals([file('a.css', 'a { color: #fff; }'), file('b.css', 'a { color: rgb(0 0 0); }')])).toHaveLength(2);
  });
  it('allows keywords, tokens and anchors', () => {
    expect(checkColourLiterals([file('a.css', 'a { color: var(--syn-color-text-primary); fill: currentColor; background: transparent; }'), file('b.tsx', '<a href="#content" />')])).toEqual([]);
  });
});

describe('custom properties', () => {
  it('flags declarations, wrong prefixes and undefined tokens', () => {
    const problems = checkCustomProperties([file('a.css', 'a { --local: 1; color: var(--other); background: var(--syn-missing); }')], defined);
    expect(problems).toHaveLength(3);
  });
  it('accepts defined tokens and template prefixes', () => {
    expect(checkCustomProperties([file('a.css', 'a { color: var(--syn-color-text-primary); }')], defined)).toEqual([]);
    expect(checkInlineCustomProperties([file('a.tsx', 'x = `var(--syn-data-cat-${n})`')], defined)).toEqual([]);
  });
});

describe('classes', () => {
  it('ignores module sources and flags plain classes', () => {
    expect(checkClasses([file('a.module.css', '.card { }')], [], { built: false })).toEqual([]);
    expect(checkClasses([file('a.css', '.card { }')], [], { built: false })).toHaveLength(1);
  });
  it('accepts declared utilities, and in built output only hashed or declared classes', () => {
    expect(checkClasses([file('a.css', '.syn-text-sm { }')], ['syn-text-sm'], { built: false })).toEqual([]);
    expect(checkClasses([file('a.css', '.aB3_x-9Z { } .card { }')], [], { built: true })).toHaveLength(1);
  });
});

describe('data attributes', () => {
  it('allows data-syn-* and not other data-*', () => {
    expect(checkDataAttributes([file('a.tsx', '<div data-syn-theme="x" data-other="y" className="--syn-data-cat-1" />')])).toEqual(['a.tsx: attribute data-other is not data-syn-*']);
  });
});

describe('data attributes in other positions', () => {
  it('flags selectors, setAttribute and dataset, and ignores token names', () => {
    const text = `a[data-other] { } el.setAttribute('data-more', 'x'); el.dataset.foo; const names = ['data-surface', 'data-cat-1'];`;
    expect(checkDataAttributes([file('a.ts', text)]).length).toBe(3);
  });
});

describe('vocabulary', () => {
  const vocabulary = { categories: { color: { elements: ['text', 'primary'] }, space: { numbers: true, elements: [] } } };
  it('flags undeclared words and accepts numbers where allowed', () => {
    const tree = { color: { text: { primary: { $value: 'x' }, extra: { $value: 'x' } } }, space: { 3: { $value: 'x' } } };
    expect(checkVocabulary(vocabulary, [{ path: 't.json', json: tree }])).toEqual(['t.json: color.text.extra uses undeclared word "extra"']);
  });
});
