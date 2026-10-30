export type PopoverSide = 'bottom' | 'top' | 'right' | 'left';
export type PopoverAlign = 'start' | 'end';

export interface PopoverPlacement {
  top: number;
  left: number;
  /** The side it landed on: the preferred one, or the opposite where that has more room. */
  side: PopoverSide;
  /** The tallest the panel may be where it landed; it scrolls inside beyond that. */
  maxHeight: number;
}

const opposite: Record<PopoverSide, PopoverSide> = { bottom: 'top', top: 'bottom', right: 'left', left: 'right' };

interface Box { top: number; left: number; right: number; bottom: number }

/**
 * Where to put a panel of `size` against `anchor`, inside a `viewport` of the given size and `margin` from its edges. It goes on the
 * preferred side, or the opposite one when the panel does not fit there and the opposite has more room; it is then slid along that side
 * to stay in view, and given a `maxHeight` so that what does not fit scrolls inside it.
 */
export function placePopover(anchor: Box, size: { width: number; height: number }, viewport: { width: number; height: number }, side: PopoverSide, align: PopoverAlign, gap: number, margin: number): PopoverPlacement {
  const room: Record<PopoverSide, number> = {
    bottom: viewport.height - anchor.bottom - gap - margin,
    top: anchor.top - gap - margin,
    right: viewport.width - anchor.right - gap - margin,
    left: anchor.left - gap - margin,
  };
  const need = side === 'bottom' || side === 'top' ? size.height : size.width;
  const chosen = room[side] >= need || room[side] >= room[opposite[side]] ? side : opposite[side];

  const vertical = chosen === 'bottom' || chosen === 'top';
  const innerWidth = Math.max(0, viewport.width - 2 * margin);
  const width = Math.min(size.width, innerWidth);
  let top: number;
  let left: number;
  let maxHeight: number;
  if (vertical) {
    maxHeight = Math.max(0, room[chosen]);
    const height = Math.min(size.height, maxHeight);
    top = chosen === 'bottom' ? anchor.bottom + gap : anchor.top - gap - height;
    left = align === 'end' ? anchor.right - width : anchor.left;
  } else {
    maxHeight = Math.max(0, viewport.height - 2 * margin);
    const height = Math.min(size.height, maxHeight);
    left = chosen === 'right' ? anchor.right + gap : anchor.left - gap - width;
    top = align === 'end' ? anchor.bottom - height : anchor.top;
  }
  const height = Math.min(size.height, maxHeight);
  left = Math.min(Math.max(left, margin), Math.max(margin, viewport.width - margin - width));
  top = Math.min(Math.max(top, margin), Math.max(margin, viewport.height - margin - height));
  return { top, left, side: chosen, maxHeight };
}
