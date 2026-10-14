/** The bottom edge of the sticky bars pinned to the top of the page, so a target lands below them. */
export function stickyOffset() {
  return Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="top"]')].map((el) => el.getBoundingClientRect().bottom));
}

/**
 * Scrolls a section into view below the sticky bars and moves focus to it, so keyboard and
 * screen-reader users arrive there too. Scrolls smoothly unless motion is reduced.
 */
export function scrollToJumpTarget(id: string, { reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const target = document.getElementById(id);
  if (!target) return false;
  const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset();
  window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}
