/** A resolved length token (`0.75rem`, `12px`) in whole pixels, for libraries that take numbers. */
export function toPx(value: string, root: Element = document.documentElement) {
  const n = parseFloat(value);
  if (value.trim().endsWith('rem')) return Math.round(n * parseFloat(getComputedStyle(root).fontSize));
  return Math.round(n);
}
