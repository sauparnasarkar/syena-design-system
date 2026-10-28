import { stickyOffset } from './scrollToJumpTarget';

/** How much of the view the shell's pinned bars take at each edge: the bars pinned to the top (where they sit once the page has scrolled) and the height of what is pinned to the bottom edge. */
export function pinnedClearance(): { top: number; bottom: number } {
  const bottom = Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="bottom"]')].map((el) => {
    const box = el.getBoundingClientRect();
    // The bar's own height while it is on the view; when it rests above the footer at the end of the page it is not over the edge, and the content it sits beside is not hidden by it.
    return box.height > 0 && box.top < window.innerHeight && box.bottom > 0 ? box.height : 0;
  }));
  return { top: stickyOffset(), bottom };
}
