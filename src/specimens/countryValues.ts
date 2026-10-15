import { coded } from '../charts/map/countries';

// Illustrative annual emissions by country, in MtCO₂, for layout and colour review. They are generated, not
// measured, and the order of the countries is arbitrary. The sizes follow a taper of the rank-size curve
// v(k) = 9,900 · k^-1.35 · 10^(-2 (k/N)²): the largest is under a third of the 37 GtCO₂ world total shown
// elsewhere in the examples, the next few fall away quickly, and the tail reaches the bottom of the 0.01 to
// 10,000 scale. Every fifteenth country has no value, to show the no-data fill.
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const order = [...coded].sort((a, b) => hash(a.code) - hash(b.code));
const N = order.length;

export const illustrativeEmissions: Record<string, number> = Object.fromEntries(
  order.flatMap(({ code }, i) => {
    if ((i + 1) % 15 === 0) return [];
    const k = i + 1;
    const value = 9900 * k ** -1.35 * 10 ** (-2 * (k / N) ** 2);
    return [[code, Number(value.toPrecision(3))]];
  }),
);

export const worldTotalMt = Object.values(illustrativeEmissions).reduce((a, b) => a + b, 0);
