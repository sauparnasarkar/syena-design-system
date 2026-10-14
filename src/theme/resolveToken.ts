const PREFIX = '--syn-';

/** Normalises `color-surface-base`, `--syn-color-surface-base` or `var(--syn-color-surface-base)` to the custom property name. */
export function tokenVariable(name: string) {
  const bare = name.trim().replace(/^var\(\s*/, '').replace(/\s*\)$/, '');
  return bare.startsWith(PREFIX) ? bare : `${PREFIX}${bare.replace(/^--/, '')}`;
}

/**
 * The resolved value of a token, for code that cannot use CSS variables (chart and grid
 * libraries). Reads from `element` so that it sees the theme in force there.
 */
export function resolveToken(name: string, element: Element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(tokenVariable(name)).trim();
}

/** Resolves several tokens at once. */
export function resolveTokens<const Names extends readonly string[]>(names: Names, element?: Element) {
  return Object.fromEntries(names.map((n) => [n, resolveToken(n, element)])) as { [K in Names[number]]: string };
}
