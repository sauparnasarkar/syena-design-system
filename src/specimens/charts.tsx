import { Fragment, type ReactNode } from 'react';
import { anomaly, composition, compositionNames, emitters, fmt, heat, heatDecades, heatRegions, observed, scenarios, years } from './data';
import { useWidth } from './hooks';
import styles from './Charts.module.css';

const pad = { l: 44, r: 16, b: 30 };
const rowStep = 16;
const charWidth = 7;

const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
const path = (pts: Array<[number, number]>) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
const thin = (ticks: number[], xs: (v: number) => number, min = 56) => {
  const kept: number[] = [];
  for (const t of ticks) if (!kept.length || xs(t) - xs(kept[kept.length - 1]) >= min) kept.push(t);
  return kept;
};

/** Renders a chart at the width of its container, so text is never scaled. */
export function Fit({ children }: { children: (width: number) => ReactNode }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  return <div ref={ref}>{width > 0 ? children(width) : null}</div>;
}

type Box = { x0: number; x1: number; row: number };
const overlaps = (a: Box, b: Box) => a.row === b.row && a.x0 < b.x1 && b.x0 < a.x1;

function Axes({ W, H, top, xs, ys, yTicks, xTicks, yFormat = (v: number) => fmt(v, 0), yTitle }: { W: number; H: number; top: number; xs: (v: number) => number; ys: (v: number) => number; yTicks: number[]; xTicks: number[]; yFormat?: (v: number) => string; yTitle: string }) {
  return (
    <g>
      {yTicks.map((t) => (
        <g key={t}>
          <line className={styles.grid} x1={pad.l} x2={W - pad.r} y1={ys(t)} y2={ys(t)} />
          <text className={styles.tick} x={pad.l - 8} y={ys(t)} textAnchor="end" dominantBaseline="middle">{yFormat(t)}</text>
        </g>
      ))}
      {thin(xTicks, xs).map((t) => (
        <text key={t} className={styles.tick} x={xs(t)} y={H - pad.b + 18} textAnchor="middle">{t}</text>
      ))}
      <text className={styles.axisTitle} x={pad.l} y={top - 14}>{yTitle}</text>
    </g>
  );
}

/** Observed line, projected scenarios and bands. */
type Trend = { year: number; value: number; low?: number; high?: number };
type Path = { name: string; points: Array<Required<Trend>> };

export function TrendChart({ label, showScenarios = 1, neutralObserved = false, width: W, height: H = 300, observedData = observed, scenarioData = scenarios, yTicks = [10, 20, 30, 40], yStep = 5, yTitle = 'GtCO₂ a year' }: { label: string; showScenarios?: 1 | 3; neutralObserved?: boolean; width: number; height?: number; observedData?: Trend[]; scenarioData?: Path[]; yTicks?: number[]; yStep?: number; yTitle?: string }) {
  const shown = scenarioData.slice(0, showScenarios);
  const obs = observedData;
  // Direct labels need room on the right; narrow charts rely on the legend instead.
  const direct = W >= 520;
  const labelW = direct ? Math.max(...shown.map((s) => s.name.length)) * charWidth + 12 : 0;
  const right = pad.r + labelW;
  const all = [...obs.map((p) => p.value), ...scenarioData.flatMap((s) => s.points.flatMap((p) => [p.low, p.high]))];
  const xs = scale(1990, 2050, pad.l, W - right);

  // Annotation labels sit in a band above the plot. A label that would overlap an earlier one moves down a row.
  const notes = [
    { text: 'Projection', x: xs(2024) + 6 },
    { text: '2030 milestone', x: xs(2030) + 6 },
  ];
  const placed: Box[] = [];
  const rows = notes.map((n) => {
    const box = { x0: n.x, x1: n.x + n.text.length * charWidth, row: 0 };
    while (placed.some((p) => overlaps(p, { ...box, x0: box.x0 - 8, x1: box.x1 + 8 }))) box.row += 1;
    placed.push(box);
    return box.row;
  });
  const top = 28 + Math.max(...rows) * rowStep;
  const ys = scale(Math.floor(Math.min(...all) / yStep) * yStep, Math.ceil(Math.max(...all) / yStep) * yStep, H - pad.b, top);

  // End labels: one per path, kept inside the chart and at least a line apart.
  const ends = shown.map((s, i) => ({ s, i, y: ys(s.points[s.points.length - 1].value) }));
  const sorted = [...ends].sort((a, b) => a.y - b.y);
  sorted.forEach((e, k) => { if (k > 0 && e.y - sorted[k - 1].y < rowStep) e.y = sorted[k - 1].y + rowStep; });

  return (
    <svg className={styles.chart} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <Axes W={W - labelW} H={H} top={top} xs={xs} ys={ys} yTicks={yTicks} xTicks={[1990, 2000, 2010, 2020, 2030, 2040, 2050]} yFormat={(v) => v.toLocaleString('en-GB')} yTitle={yTitle} />
      <rect className={styles.projection} x={xs(2024)} y={top} width={W - right - xs(2024)} height={H - pad.b - top} />
      {notes.map((n, i) => (
        <text key={n.text} className={styles.annotation} x={n.x} y={14 + rows[i] * rowStep}>{n.text}</text>
      ))}
      {shown.map((s, i) => (
        <path key={s.name} className={styles.band} style={{ fill: `var(--syn-data-cat-${i + 1})` }}
          d={`${path(s.points.map((p) => [xs(p.year), ys(p.high)]))}L${[...s.points].reverse().map((p) => `${xs(p.year).toFixed(1)} ${ys(p.low).toFixed(1)}`).join('L')}Z`} />
      ))}
      <path className={styles.line} style={{ stroke: neutralObserved ? 'var(--syn-data-text)' : 'var(--syn-data-cat-1)' }} d={path(obs.map((p) => [xs(p.year), ys(p.value)]))} />
      {shown.map((s, i) => (
        <Fragment key={s.name}>
          <path className={styles.dashed} style={{ stroke: `var(--syn-data-cat-${i + 1})` }} d={path([[xs(2024), ys(obs[obs.length - 1].value)], ...s.points.slice(1).map((p): [number, number] => [xs(p.year), ys(p.value)])])} />
        </Fragment>
      ))}
      {direct && ends.map((e) => (
        <text key={e.s.name} className={styles.direct} x={W - right + 8} y={e.y} dominantBaseline="middle" style={{ fill: 'var(--syn-data-text)' }}>{e.s.name}</text>
      ))}
      <circle cx={xs(2024)} cy={ys(obs[obs.length - 1].value)} r="3" style={{ fill: neutralObserved ? 'var(--syn-data-text)' : 'var(--syn-data-cat-1)' }} />
      <line className={styles.reference} x1={xs(2030)} x2={xs(2030)} y1={top} y2={H - pad.b} />
    </svg>
  );
}

export function RankingChart({ label, width: w }: { label: string; width: number }) {
  const rowH = 30; const h = emitters.length * rowH + 36; const left = 82;
  const xs = scale(0, 12, left, w - 44);
  return (
    <svg className={styles.chart} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {[0, 4, 8, 12].map((t) => (
        <g key={t}>
          <line className={styles.grid} x1={xs(t)} x2={xs(t)} y1={6} y2={h - 26} />
          <text className={styles.tick} x={xs(t)} y={h - 8} textAnchor="middle">{t}</text>
        </g>
      ))}
      {emitters.map((e, i) => (
        <g key={e.name}>
          <text className={styles.tick} x={left - 10} y={14 + i * rowH + 9} textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--syn-data-text)' }}>{e.name}</text>
          <rect x={xs(0)} y={14 + i * rowH} width={xs(e.value) - xs(0)} height={18} rx="2" style={{ fill: 'var(--syn-data-cat-1)' }} />
          <text className={styles.value} x={xs(e.value) + 8} y={14 + i * rowH + 9} dominantBaseline="middle">{fmt(e.value, 1)}</text>
        </g>
      ))}
    </svg>
  );
}

export function CompositionChart({ label, width: W, height: H = 300 }: { label: string; width: number; height?: number }) {
  const top = 28;
  const xs = scale(1990, 2024, pad.l, W - pad.r);
  const ys = scale(0, 100, H - pad.b, top);
  const stacks = composition.map((c) => {
    let acc = 0;
    return c.parts.map((p) => { const lo = acc; acc += p; return { lo, hi: acc }; });
  });
  return (
    <svg className={styles.chart} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <Axes W={W} H={H} top={top} xs={xs} ys={ys} yTicks={[0, 25, 50, 75, 100]} xTicks={[1990, 2000, 2010, 2020]} yFormat={(v) => `${v}`} yTitle="Share of CO₂-equivalent (%)" />
      {compositionNames.map((n, k) => (
        <path key={n} style={{ fill: k === 3 ? 'var(--syn-data-other)' : `var(--syn-data-cat-${k + 1})` }}
          d={`${path(stacks.map((s, i): [number, number] => [xs(years[i]), ys(s[k].hi)]))}L${[...stacks].reverse().map((s, i) => `${xs(years[years.length - 1 - i]).toFixed(1)} ${ys(s[k].lo).toFixed(1)}`).join('L')}Z`} />
      ))}
    </svg>
  );
}

export function AnomalyChart({ label, width: W, height: H = 300 }: { label: string; width: number; height?: number }) {
  const top = 28;
  const xs = scale(2003.5, 2024.5, pad.l, W - pad.r);
  const ys = scale(-1.5, 1.5, H - pad.b, top);
  const bw = (xs(2005) - xs(2004)) * 0.72;
  const colour = (v: number) => {
    const a = Math.min(3, Math.max(1, Math.ceil(Math.abs(v) / 0.5)));
    return `var(--syn-data-div-${v < 0 ? 'neg' : 'pos'}-${a})`;
  };
  return (
    <svg className={styles.chart} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <Axes W={W} H={H} top={top} xs={xs} ys={ys} yTicks={[-1, 0, 1]} xTicks={[2005, 2010, 2015, 2020]} yFormat={(v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0')} yTitle="°C against the 1991 to 2020 baseline" />
      {anomaly.map((a) => (
        <rect key={a.year} x={xs(a.year) - bw / 2} width={bw} y={a.value >= 0 ? ys(a.value) : ys(0)} height={Math.abs(ys(a.value) - ys(0))} style={{ fill: colour(a.value) }} />
      ))}
      <line className={styles.baseline} x1={pad.l} x2={W - pad.r} y1={ys(0)} y2={ys(0)} />
    </svg>
  );
}

export function HeatGrid({ label, width: w }: { label: string; width: number }) {
  const left = 76; const top = 24; const cellH = 34;
  const cellW = Math.floor((w - left - 4) / heatDecades.length);
  const h = top + heatRegions.length * cellH + 8;
  const roomy = cellW >= 72;
  return (
    <svg className={styles.chart} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {heatDecades.map((d, c) => (
        <text key={d} className={styles.tick} x={left + c * cellW + cellW / 2} y={14} textAnchor="middle">{d}</text>
      ))}
      {heatRegions.map((r, ri) => (
        <g key={r}>
          <text className={styles.tick} x={left - 10} y={top + ri * cellH + cellH / 2} textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--syn-data-text)' }}>{r}</text>
          {heatDecades.map((d, c) => {
            const v = heat[ri][c];
            const step = v === null ? 0 : Math.min(7, Math.max(1, Math.ceil(v * 7 / 0.8)));
            return (
              <g key={d}>
                <rect x={left + c * cellW + 2} y={top + ri * cellH + 2} width={cellW - 4} height={cellH - 4} rx="2" style={{ fill: v === null ? 'var(--syn-data-no-data)' : `var(--syn-data-seq-${step})` }}>
                  {v === null ? <title>No data</title> : null}
                </rect>
                <text className={styles.cellValue} x={left + c * cellW + cellW / 2} y={top + ri * cellH + cellH / 2} textAnchor="middle" dominantBaseline="middle" style={{ fill: v === null ? 'var(--syn-data-ink-light)' : step === 1 ? 'var(--syn-data-ink-light)' : 'var(--syn-data-ink-dark)' }}>{v === null ? (roomy ? 'No data' : '–') : fmt(v, 2)}</text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
