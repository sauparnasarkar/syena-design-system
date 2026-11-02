import { prefersReducedMotion } from './motion';

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

const SETTLE_QUIET_MS = 150;
const SETTLE_MAX_MS = 1800;
const MAX_CORRECTIONS = 2;
let latestJump = 0;

/**
 * A smooth scroll takes a moment, and a page can change shape while it runs (a header that condenses once the page has moved, an image that loads above the
 * target), so the place measured at the start is not always where the section ends up: the jump used to stop short, and only a second click landed it.
 * Once the page has stopped moving, look again and move the rest of the way (at most twice, instantly). Not done if the reader takes over the scrolling
 * meanwhile (wheel, touch, keys), or if another jump has started.
 */
function correctWhenSettled(target: HTMLElement, token: number) {
  const interrupted = { value: false };
  const stop = () => { interrupted.value = true; };
  const events = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
  events.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
  const finish = () => events.forEach((e) => window.removeEventListener(e, stop));
  let corrections = 0;
  let lastY = window.scrollY;
  let begun = performance.now();
  let quietSince = begun;
  const tick = () => {
    if (interrupted.value || token !== latestJump || !target.isConnected) { finish(); return; }
    const now = performance.now();
    if (window.scrollY !== lastY) { lastY = window.scrollY; quietSince = now; }
    if (now - quietSince < SETTLE_QUIET_MS && now - begun < SETTLE_MAX_MS) { requestAnimationFrame(tick); return; }
    const off = target.getBoundingClientRect().top - stickyOffset();
    if (Math.abs(off) <= 2 || corrections >= MAX_CORRECTIONS) { finish(); return; }
    corrections += 1;
    window.scrollTo({ top: window.scrollY + off, behavior: 'auto' });
    lastY = window.scrollY;
    begun = quietSince = performance.now();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Scrolls a section into view below the sticky bars and moves focus to it, so keyboard and
 * screen-reader users arrive there too. Scrolls smoothly unless motion is reduced. With `skipIfVisible`, a target
 * that is already fully in view is not scrolled to (focus still moves). When the scroll has finished the position is checked again and corrected if the page moved meanwhile.
 */
export function scrollToJumpTarget(id: string, { reducedMotion = prefersReducedMotion(), skipIfVisible = false } = {}) {
  const target = document.getElementById(id);
  if (!target) return false;
  const box = target.getBoundingClientRect();
  // A section that is already fully in view, next to the top of the page, stays where it is: scrolling it to the top would only hide what is above it.
  const visible = box.top >= stickyOffset() && box.bottom <= window.innerHeight;
  latestJump += 1;
  if (!(skipIfVisible && visible)) {
    window.scrollTo({ top: box.top + window.scrollY - stickyOffset(), behavior: reducedMotion ? 'auto' : 'smooth' });
    correctWhenSettled(target, latestJump);
  }
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}
