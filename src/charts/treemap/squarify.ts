export interface Rect { x: number; y: number; w: number; h: number }
export interface Placed<T> extends Rect { item: T }

/**
 * Squarified treemap layout (Bruls, Huizing, van Wijk): tiles of area proportional to their value, packed in rows along
 * the shorter side of the space left, each row closed when adding a tile would make the worst aspect ratio worse.
 * Items with a value of zero or less are left out. The result is deterministic: larger first, ties in the order given.
 */
export function squarify<T>(items: T[], value: (item: T) => number, box: Rect): Array<Placed<T>> {
  const sorted = items.map((item, i) => ({ item, v: value(item), i })).filter((d) => d.v > 0).sort((a, b) => b.v - a.v || a.i - b.i);
  const total = sorted.reduce((sum, d) => sum + d.v, 0);
  if (!sorted.length || box.w <= 0 || box.h <= 0) return [];
  const scale = (box.w * box.h) / total;
  const areas = sorted.map((d) => ({ item: d.item, a: d.v * scale }));
  const out: Array<Placed<T>> = [];
  let { x, y, w, h } = box;
  let row: typeof areas = [];

  const worst = (r: typeof areas, side: number) => {
    const s = r.reduce((sum, d) => sum + d.a, 0);
    const max = Math.max(...r.map((d) => d.a));
    const min = Math.min(...r.map((d) => d.a));
    return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
  };
  const flush = () => {
    if (!row.length) return;
    const s = row.reduce((sum, d) => sum + d.a, 0);
    if (w >= h) {
      // A column on the left, as wide as its area needs, split from top to bottom.
      const cw = s / h;
      let cy = y;
      for (const d of row) { const ch = d.a / cw; out.push({ item: d.item, x, y: cy, w: cw, h: ch }); cy += ch; }
      x += cw; w -= cw;
    } else {
      const rh = s / w;
      let cx = x;
      for (const d of row) { const cw = d.a / rh; out.push({ item: d.item, x: cx, y, w: cw, h: rh }); cx += cw; }
      y += rh; h -= rh;
    }
    row = [];
  };

  for (const d of areas) {
    const side = Math.min(w, h);
    if (row.length && worst([...row, d], side) > worst(row, side)) flush();
    row.push(d);
  }
  flush();
  return out;
}
