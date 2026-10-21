import { useEffect, type RefObject } from 'react';

let holders = 0;
let unlock: (() => void) | null = null;

/** Whether a drag of `dy` pixels (positive: finger moving down) can scroll `el` or any scrolling ancestor up to and including `limit`. */
function canScrollWithin(el: Element | null, limit: HTMLElement, dy: number): boolean {
  for (let node = el; node instanceof HTMLElement; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if (!(dy > 0 && atTop) && !(dy < 0 && atBottom)) return true;
    }
    if (node === limit) break;
  }
  return false;
}

function lock(allow: RefObject<HTMLElement | null>) {
  const root = document.documentElement;
  const body = document.body;
  const saved = { root: root.style.overflow, body: body.style.overflow, pad: body.style.paddingRight };
  // The page stops scrolling without shifting: the width a vanishing scrollbar frees up is given back as padding.
  const gap = window.innerWidth - root.clientWidth;
  if (gap > 0) body.style.paddingRight = `calc(${getComputedStyle(body).paddingRight} + ${gap}px)`;
  root.style.overflow = 'hidden';
  body.style.overflow = 'hidden';

  // iOS Safari scrolls the page under a finger whatever its overflow is, so drags are also stopped: anywhere outside the
  // overlay, and inside it once the list under the finger has no more to scroll in that direction.
  let startY = 0;
  const onStart = (event: TouchEvent) => { startY = event.touches[0]?.clientY ?? 0; };
  const onMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) return; // a pinch is the browser's zoom, not a scroll
    const panel = allow.current;
    const dy = event.touches[0].clientY - startY;
    if (panel && event.target instanceof Node && panel.contains(event.target) && canScrollWithin(event.target as Element, panel, dy)) return;
    event.preventDefault();
  };
  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: false });

  return () => {
    document.removeEventListener('touchstart', onStart);
    document.removeEventListener('touchmove', onMove);
    root.style.overflow = saved.root;
    body.style.overflow = saved.body;
    body.style.paddingRight = saved.pad;
  };
}

/**
 * While `active`, the page behind a modal overlay does not scroll. `allow` is the overlay: lists inside it keep scrolling.
 * Locks nest: the page is released when the last overlay that asked for it closes.
 */
export function useScrollLock(allow: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return undefined;
    if (holders === 0) unlock = lock(allow);
    holders += 1;
    return () => {
      holders -= 1;
      if (holders === 0) { unlock?.(); unlock = null; }
    };
  }, [active, allow]);
}
