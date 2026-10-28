type Box = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width'>;

/** The air kept between two labels, in pixels: two that are closer than this count as touching. */
const labelGap = 2;

/** Whether two boxes overlap, or sit closer than the gap. A box with no size (before layout) overlaps nothing. */
const touches = (a: Box, b: Box): boolean => a.width > 0 && b.width > 0 && a.left < b.right + labelGap && b.left < a.right + labelGap && a.top < b.bottom + labelGap && b.top < a.bottom + labelGap;

/** The labels to hide so that no two overlap: taken in the order given, a label is kept unless it touches one already kept. */
export function collidingLabels(boxes: ReadonlyArray<{ id: string; box: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width'> }>): Set<string> {
  const kept: Box[] = [];
  const hidden = new Set<string>();
  for (const { id, box } of boxes) {
    if (kept.some((other) => touches(other, box))) hidden.add(id);
    else kept.push(box);
  }
  return hidden;
}

