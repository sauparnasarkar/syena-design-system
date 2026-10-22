/**
 * The bottom edge of the bars pinned to the top of the page, so a target lands below them: where a pinned bar sits once the page has
 * scrolled, not where it is now. A bar that is not pinned (it scrolls away with the page, as on a short screen) is not counted.
 */
export function stickyOffset() {
  return Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="top"]')].map((el) => {
    const { position, top } = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (position === 'fixed') return box.bottom;
    return position === 'sticky' ? (Number.parseFloat(top) || 0) + box.height : 0;
  }));
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
