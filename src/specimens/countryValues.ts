import { coded } from '../charts/map/countries';

// Illustrative annual emissions by country, in MtCO₂, for layout and colour review. They are generated, not
// measured. The larger economies come first, so the large values fall where a reader expects them, and the sizes
// follow a taper of the rank-size curve v(k) = 8,200 · k^-1.25 · 10^(-2 (k/N)²): the largest is under a third of
// the 37 GtCO₂ world total shown elsewhere in the examples, the next few fall away quickly, and the tail reaches the
// bottom of the 0.01 to 10,000 scale. A handful of countries have no value, to show the no-data fill.
const head = [
  'CHN', 'USA', 'IND', 'RUS', 'JPN', 'IRN', 'IDN', 'DEU', 'KOR', 'SAU', 'CAN', 'BRA', 'MEX', 'ZAF', 'TUR', 'AUS', 'GBR', 'ITA', 'FRA', 'POL',
  'THA', 'VNM', 'EGY', 'KAZ', 'ARG', 'ESP', 'MYS', 'PAK', 'UKR', 'ARE', 'IRQ', 'DZA', 'NLD', 'TWN', 'PHL', 'BGD', 'UZB', 'VEN', 'CHL', 'COL',
  'NGA', 'ROU', 'CZE', 'BEL', 'IRL', 'GRC', 'LBY', 'OMN', 'KWT', 'QAT', 'ISR', 'PRT', 'HUN', 'AUT', 'BLR', 'SGP', 'NOR', 'SWE', 'PER', 'MAR',
];
const noValue = new Set(['PRK', 'SOM', 'SSD', 'TCD', 'CAF', 'MRT', 'GNQ', 'SYR']);
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const rest = coded.map((c) => c.code).filter((c) => !head.includes(c)).sort((a, b) => hash(a) - hash(b));
const order = [...head.filter((c) => coded.some((x) => x.code === c)), ...rest];
const N = order.length;

export const illustrativeEmissions: Record<string, number> = Object.fromEntries(
  order.flatMap((code, i) => {
    if (noValue.has(code)) return [];
    const k = i + 1;
    return [[code, Number((8200 * k ** -1.25 * 10 ** (-2 * (k / N) ** 2)).toPrecision(3))]];
  }),
);

export const noDataCodes = order.filter((c) => noValue.has(c));
export const worldTotalMt = Object.values(illustrativeEmissions).reduce((a, b) => a + b, 0);
