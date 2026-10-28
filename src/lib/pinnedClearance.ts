type Span = { left: number; right: number };

const overlapsAcross = (a: Span, b: Span) => a.left < b.right && b.left < a.right;

/**
 * How much of the view the shell's pinned bars take at each edge, for a control occupying `across` (its left and right edges): a bar only hides what is beneath it, so a bar that
 * does not reach across the control (the strip spans the canvas, not the rail beside it) takes nothing from it. Without `across`, every pinned bar counts. At the top, the bars pinned
 * there are measured where they sit once the page has scrolled; at the bottom, a bar's own height while it is over the view (at the end of the page it rests above the footer, not over
 * the edge).
 */
export function pinnedClearance(across?: Span): { top: number; bottom: number } {
  const reaches = (el: Element) => {
    const box = el.getBoundingClientRect();
    return !across || overlapsAcross(box, across);
  };
  const top = Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="top"]')].filter(reaches).map((el) => {
    const { position, top: offset } = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (position === 'fixed') return box.bottom;
    return position === 'sticky' ? (Number.parseFloat(offset) || 0) + box.height : 0;
  }));
  const bottom = Math.max(0, ...[...document.querySelectorAll('[data-syn-sticky="bottom"]')].filter(reaches).map((el) => {
    const box = el.getBoundingClientRect();
    return box.height > 0 && box.top < window.innerHeight && box.bottom > 0 ? box.height : 0;
  }));
  return { top, bottom };
}
