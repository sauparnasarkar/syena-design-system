const query = '(prefers-reduced-motion: reduce)';

/** What the app has forced with a SynMotionProvider, read from the document; null when nothing is forced. */
export function forcedMotion(): 'reduce' | 'full' | null {
  if (typeof document === 'undefined') return null;
  const value = document.documentElement.getAttribute('data-syn-motion');
  return value === 'reduce' || value === 'full' ? value : null;
}

/** True when motion is reduced right now: the app's own choice if it made one, else the device's. For code that runs outside React. */
export function prefersReducedMotion(): boolean {
  const forced = forcedMotion();
  if (forced) return forced === 'reduce';
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}
