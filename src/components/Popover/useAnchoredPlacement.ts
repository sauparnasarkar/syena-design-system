import { useLayoutEffect, useState, type RefObject } from 'react';
import { placePopover, type PopoverAlign, type PopoverPlacement, type PopoverSide } from './position';

const GAP = 8;
const MARGIN = 8;

/** The panel's natural size at the width it will have: measured with its height limit lifted, then put back. */
function measure(el: HTMLElement, maxWidth: number) {
  const held = el.style.maxHeight;
  // Lifting the limit makes the panel grow to its full height, which resets how far it was scrolled; put that back.
  const scrolled = el.scrollTop;
  el.style.maxHeight = '';
  el.style.maxWidth = `${maxWidth}px`;
  const size = { width: el.offsetWidth, height: el.scrollHeight + (el.offsetHeight - el.clientHeight) };
  el.style.maxHeight = held;
  el.scrollTop = scrolled;
  return size;
}

export interface AnchoredPlacement extends PopoverPlacement {
  maxWidth: number;
  /** Where the anchor's centre is along the panel's own edge, in pixels, for an arrow that points at it. */
  anchorOffset: number;
}

/**
 * Where a floating panel goes against an anchor: the side it prefers, or the opposite one where that has more room, kept inside the
 * visible area and followed as the page scrolls or resizes. `center` centres the panel on the anchor along the chosen side.
 * Returns null until the panel is open and measured.
 */
export function useAnchoredPlacement(anchor: HTMLElement | null, panel: RefObject<HTMLElement | null>, open: boolean, side: PopoverSide, align: PopoverAlign | 'center') {
  const [placement, setPlacement] = useState<AnchoredPlacement | null>(null);
  useLayoutEffect(() => {
    if (!open || !anchor) return undefined;
    const place = () => {
      const el = panel.current;
      if (!el) return;
      const rect = anchor.getBoundingClientRect();
      const view = window.visualViewport;
      const viewport = { width: view?.width ?? window.innerWidth, height: view?.height ?? window.innerHeight };
      const origin = { left: view?.offsetLeft ?? 0, top: view?.offsetTop ?? 0 };
      const maxWidth = Math.max(0, viewport.width - 2 * MARGIN);
      const size = measure(el, maxWidth);
      const seen = { left: rect.left - origin.left, right: rect.right - origin.left, top: rect.top - origin.top, bottom: rect.bottom - origin.top };
      const placed = placePopover(seen, size, viewport, side, align === 'center' ? 'start' : align, GAP, MARGIN);
      let { top, left } = placed;
      const vertical = placed.side === 'top' || placed.side === 'bottom';
      let anchorOffset = 0;
      if (align === 'center') {
        const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), Math.max(low, high));
        if (vertical) {
          left = clamp((seen.left + seen.right) / 2 - Math.min(size.width, maxWidth) / 2, MARGIN, viewport.width - MARGIN - Math.min(size.width, maxWidth));
          anchorOffset = (seen.left + seen.right) / 2 - left;
        } else {
          const height = Math.min(size.height, placed.maxHeight);
          top = clamp((seen.top + seen.bottom) / 2 - height / 2, MARGIN, viewport.height - MARGIN - height);
          anchorOffset = (seen.top + seen.bottom) / 2 - top;
        }
      }
      const next: AnchoredPlacement = { ...placed, top: top + origin.top, left: left + origin.left, maxWidth, anchorOffset };
      setPlacement((was) => (was && was.top === next.top && was.left === next.left && was.side === next.side && was.maxHeight === next.maxHeight && was.maxWidth === next.maxWidth && was.anchorOffset === next.anchorOffset ? was : next));
    };
    place();
    const resized = new ResizeObserver(place);
    if (panel.current) resized.observe(panel.current);
    window.addEventListener('resize', place);
    // Scrolling inside the panel moves nothing: only the page, or something the anchor sits in, does.
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) return;
      place();
    };
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      resized.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [anchor, panel, open, side, align]);
  // Closed, there is no placement: the next opening measures afresh, before it is painted.
  return open && anchor ? placement : null;
}
