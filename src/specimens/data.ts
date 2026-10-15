// Illustrative values for layout review. They are generated, not measured.
const wave = (i: number, phase: number) => Math.sin(i * 1.7 + phase) * 0.5 + Math.sin(i * 0.6 + phase * 2) * 0.5;

export const years = Array.from({ length: 35 }, (_, i) => 1990 + i);
export const futureYears = Array.from({ length: 27 }, (_, i) => 2024 + i);

export const observed = years.map((year, i) => ({ year, value: 22.5 + i * 0.44 + wave(i, 0.4) * 0.5 - (i > 29 ? (i - 29) * 0.12 : 0) }));
const last = observed[observed.length - 1].value;

export function scenario(slope: number, spread: number) {
  return futureYears.map((year, i) => ({
    year,
    value: last + slope * i,
    low: last + slope * i - spread * Math.sqrt(i) * 0.45,
    high: last + slope * i + spread * Math.sqrt(i) * 0.45,
  }));
}

export const scenarios = [
  { name: 'Current policies', points: scenario(-0.04, 0.55) },
  { name: 'Announced pledges', points: scenario(-0.38, 0.5) },
  { name: 'Net zero pathway', points: scenario(-1.1, 0.4) },
];

export const emitters = [
  { name: 'Country A', value: 11.9 },
  { name: 'Country B', value: 5.0 },
  { name: 'Country C', value: 2.8 },
  { name: 'Country D', value: 1.9 },
  { name: 'Country E', value: 1.7 },
  { name: 'Country F', value: 0.8 },
  { name: 'Country G', value: 0.7 },
  { name: 'Country H', value: 0.65 },
];

export const composition = years.map((year, i) => {
  // Shares of a total: each part stays at or above zero and the parts add up to 100.
  const co2 = 62 + i * 0.4 + wave(i, 1) * 0.4;
  const methane = 22 - i * 0.22 + wave(i, 2) * 0.3;
  const nitrous = 6 + wave(i, 3) * 0.2;
  const other = 100 - co2 - methane - nitrous;
  return { year, parts: [co2, methane, nitrous, other] };
});

export const compositionNames = ['Carbon dioxide', 'Methane', 'Nitrous oxide', 'Other gases'];

// Against the 1991 to 2020 baseline: close to zero in the middle of that period, about +0.6 by the latest year.
export const anomaly = Array.from({ length: 21 }, (_, i) => ({ year: 2004 + i, value: -0.12 + i * 0.037 + wave(i, 0.8) * 0.12 }));

// One country, in MtCO₂ a year. It passes through the indicator table's values (412, 468, 521 and 449) at 1990, 2000,
// 2010 and 2024; between them it follows a smooth path with small wiggles that vanish at those years.
const anchors: Array<[number, number]> = [[1990, 412], [2000, 468], [2010, 521], [2024, 449]];
export const countryObserved = years.map((year, i) => {
  const k = anchors.findIndex(([y]) => y >= year);
  const [y1, v1] = anchors[Math.max(1, k)];
  const [y0, v0] = anchors[Math.max(1, k) - 1];
  const f = (year - y0) / (y1 - y0);
  return { year, value: v0 + (v1 - v0) * f + Math.sin(f * Math.PI) * wave(i, 0.9) * 9 };
});
const countryLast = countryObserved[countryObserved.length - 1].value;

/** A projection that ends at a given change on the latest year (for example −18% by 2050), with a widening 66% range. */
export function countryScenario(changePercent: number, spread: number) {
  const end = countryLast * (1 + changePercent / 100);
  return futureYears.map((year, i) => {
    const f = i / (futureYears.length - 1);
    const value = countryLast + (end - countryLast) * (f * 0.7 + f * f * 0.3);
    return { year, value, low: value - spread * Math.sqrt(i) * 1.6, high: value + spread * Math.sqrt(i) * 1.6 };
  });
}
export const countryScenarios = [{ name: 'Current policies', points: countryScenario(-18, 4) }];

export const heatRegions = ['Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5', 'Region 6'];
export const heatDecades = ['1990s', '2000s', '2010s', '2020s'];
export const heat: Array<Array<number | null>> = [
  [0.12, 0.31, 0.52, 0.61],
  [0.2, 0.34, 0.41, 0.46],
  [0.05, 0.18, 0.36, 0.55],
  [0.09, 0.15, null, 0.38],
  [0.3, 0.44, 0.62, 0.78],
  [0.02, 0.08, 0.17, 0.24],
];

export const fmt = (n: number, d = 1) => n.toFixed(d).replace('-', '−');
export const signed = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}`;
