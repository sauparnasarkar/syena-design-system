/** The bottom edge of the sticky bars pinned to the top of the page, so a target lands below them. */
export function stickyOffset() {
  return Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="top"]')].map((el) => el.getBoundingClientRect().bottom));
}

/**
 * Scrolls a section into view below the sticky bars and moves focus to it, so keyboard and
 * screen-reader users arrive there too. Scrolls smoothly unless motion is reduced. With `skipIfVisible`, a target
 * that is already fully in view is not scrolled to (focus still moves).
 */
export function scrollToJumpTarget(id: string, { reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches, skipIfVisible = false } = {}) {
  const target = document.getElementById(id);
  if (!target) return false;
  const box = target.getBoundingClientRect();
  // A section that is already fully in view, next to the top of the page, stays where it is: scrolling it to the top would only hide what is above it.
  const visible = box.top >= stickyOffset() && box.bottom <= window.innerHeight;
  if (!(skipIfVisible && visible)) window.scrollTo({ top: box.top + window.scrollY - stickyOffset(), behavior: reducedMotion ? 'auto' : 'smooth' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}
