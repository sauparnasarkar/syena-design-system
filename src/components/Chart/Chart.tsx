import type { Annotations, Data, Layout, Shape } from 'plotly.js';
import { useMemo, useState } from 'react';
import { blendStops } from '../../charts/map/heat';
import { projectionDash, seriesColour } from '../../charts/palette';
import { Icon } from '../Icon/Icon';
import { PlotlyChart } from '../../charts/PlotlyChart';
import { useChartTokens, type ChartTokens } from '../../charts/tokens';
import { useWidth } from '../../hooks/useWidth';
import styles from './Chart.module.css';

export type SeriesKind = 'line' | 'bar' | 'area' | 'marker';

export interface ChartSeries {
  name: string;
  x: Array<number | string>;
  y: number[];
  kind?: SeriesKind;
  /** Drawn dashed, with its band, and marked as a projection in the tooltip. */
  projected?: boolean;
  axis?: 'y' | 'y2';
  /** An interval around the line, drawn as a filled band at the band opacity. */
  band?: { low: number[]; high: number[]; label: string };
  /** Colours bars by their sign: `change` uses the falling and rising colours (a fall is good for emissions); `diverging` uses the cool and warm ends of the diverging ramp. The sign is always also in the tooltip, the table and the legend's glyphs. */
  signed?: 'change' | 'diverging';
  /** The legend's words for the two signs. */
  signLabels?: [string, string];
  /** Colours each bar by a second value on the sequential ramp, in the order of the bars. The legend shows the ramp and its two ends. */
  colorValues?: number[];
  /** The range the ramp covers. The range of `colorValues` by default. */
  colorDomain?: [number, number];
  /** What the colour measures, with its unit: the ramp's title and the tooltip and table label. */
  colorLabel?: string;
  formatColorValue?: (value: number) => string;
  /** The categorical slot (1 to 8) when a series must keep its colour across views. Slots are assigned in order otherwise. */
  slot?: number;
}

export interface ChartProps {
  series: ChartSeries[];
  xTitle?: string;
  yTitle: string;
  y2Title?: string;
  y2TickFormat?: string;
  /** What is plotted, the unit, the period and the headline reading, in one sentence. Required. */
  ariaLabel: string;
  showLegend?: boolean;
  height?: number;
  /** How area series combine. */
  stackedAreaMode?: 'stack' | 'percent';
  /** How bars combine. `percent` stacks them to the full height so each bar shows shares of its total; say so in the axis title. */
  barmode?: 'group' | 'stack' | 'relative' | 'percent';
  orientation?: 'v' | 'h';
  /** Where a projection begins: the region from here on is shaded and labelled. */
  projectionFrom?: number;
  /** A reference line, for example a milestone year. */
  referenceX?: { x: number; label: string };
  annotations?: Array<{ x: number | string; y: number; text: string }>;
  yRange?: [number, number];
}

const LABEL_ROW = 16;

/** The values behind a chart, as table columns and rows, for "View as table". */
export function chartTable(series: ChartSeries[], xTitle = 'Period') {
  const xs = [...new Set(series.flatMap((s) => s.x))];
  const columns = [{ key: 'x', header: xTitle }, ...series.flatMap((s, i) => [
    { key: `s${i}`, header: s.projected ? `${s.name} (projection)` : s.name, numeric: true as const },
    ...(s.colorValues ? [{ key: `c${i}`, header: `${s.name}: ${s.colorLabel ?? 'colour value'}`, numeric: true as const }] : []),
  ])];
  const rows = xs.map((x) => Object.fromEntries([['x', x], ...series.flatMap((s, i) => [[`s${i}`, s.y[s.x.indexOf(x)] ?? ''], ...(s.colorValues ? [[`c${i}`, s.colorValues[s.x.indexOf(x)] ?? '']] : [])])]));
  // A signed series is written with its sign, so the table does not rely on colour either.
  series.forEach((s, i) => { if (s.signed) rows.forEach((r) => { const v = r[`s${i}`]; if (typeof v === 'number') r[`s${i}`] = signedText(v); }); });
  return { columns, rows };
}

/** A value with its sign, written with the true minus. */
export const signedText = (v: number, format: (n: number) => string = (n) => n.toLocaleString('en-GB')) => (v === 0 ? format(0) : `${v < 0 ? '\u2212' : '+'}${format(Math.abs(v))}`);

const signColours = (t: ChartTokens, mode: 'change' | 'diverging') => (mode === 'change' ? { negative: t.decrease, positive: t.increase } : { negative: t.diverging[1], positive: t.diverging[5] });

/** The range a series' ramp covers. */
const colourRange = (s: ChartSeries): [number, number] => s.colorDomain ?? (s.colorValues && s.colorValues.length ? [Math.min(...s.colorValues), Math.max(...s.colorValues)] : [0, 1]);

function buildTraces(t: ChartTokens, series: ChartSeries[], hidden: Set<number>, props: Pick<ChartProps, 'orientation' | 'stackedAreaMode'>): Data[] {
  const traces: Data[] = [];
  series.forEach((s, i) => {
    if (hidden.has(i)) return;
    const colour = seriesColour(t, s.slot ?? i + 1);
    const horizontal = props.orientation === 'h';
    const name = s.projected ? `${s.name} (projection)` : s.name;
    const axis = s.axis === 'y2' ? { yaxis: 'y2' as const } : {};
    if (s.band) {
      const xs = [...s.x, ...[...s.x].reverse()];
      traces.push({ type: 'scatter', mode: 'lines', name: s.band.label, x: xs, y: [...s.band.high, ...[...s.band.low].reverse()], fill: 'toself', fillcolor: colour, opacity: t.bandOpacity, line: { width: 0 }, hoverinfo: 'skip', showlegend: false, ...axis });
    }
    if (s.kind === 'bar') {
      const [lo, hi] = colourRange(s);
      const sign = s.signed ? signColours(t, s.signed) : null;
      const fills = sign ? s.y.map((v) => (v < 0 ? sign.negative : sign.positive)) : s.colorValues ? s.colorValues.map((v) => blendStops(t.sequential, (v - lo) / Math.max(1e-9, hi - lo))) : colour;
      const format = s.formatColorValue ?? ((v: number) => v.toLocaleString('en-GB'));
      traces.push({
        type: 'bar', name, orientation: horizontal ? 'h' : 'v', x: horizontal ? s.y : s.x, y: horizontal ? s.x : s.y, marker: { color: fills },
        ...(sign ? { customdata: s.y.map((v) => signedText(v)), hovertemplate: `%{${horizontal ? 'y' : 'x'}}: %{customdata}<extra>${name}</extra>` } : {}),
        ...(s.colorValues ? { customdata: s.colorValues.map(format), hovertemplate: `%{${horizontal ? 'y' : 'x'}}: %{${horizontal ? 'x' : 'y'}}<br>${s.colorLabel ?? 'Colour value'}: %{customdata}<extra>${name}</extra>` } : {}),
        ...axis,
      } as Data);
    } else if (s.kind === 'area') {
      traces.push({ type: 'scatter', mode: 'lines', name, x: s.x, y: s.y, stackgroup: 'area', ...(props.stackedAreaMode === 'percent' ? { groupnorm: 'percent' as const } : {}), line: { color: colour, width: 0 }, fillcolor: colour, ...axis } as Data);
    } else if (s.kind === 'marker') {
      // Points that are not joined: each reading stands alone, as in a relationship between two measures.
      traces.push({ type: 'scatter', mode: 'markers', name, x: s.x, y: s.y, marker: { color: colour, size: 4 * t.strokeWidth }, cliponaxis: false, ...axis } as Data);
    } else {
      traces.push({ type: 'scatter', mode: 'lines', name, x: s.x, y: s.y, line: { color: colour, ...(s.projected ? { dash: projectionDash(t) } : {}) }, ...axis } as Data);
    }
  });
  return traces;
}

function KeyMark({ series, colour, t }: { series: ChartSeries; colour: string; t: ChartTokens }) {
  if (series.colorValues) return <span className={styles.rampSwatch} aria-hidden="true" />;
  if (series.signed) {
    const c = signColours(t, series.signed);
    return <span className={styles.swatch} style={{ background: `linear-gradient(to right, ${c.negative} 50%, ${c.positive} 50%)` }} aria-hidden="true" />;
  }
  if (series.kind === 'bar' || series.kind === 'area') return <span className={styles.swatch} style={{ background: colour }} aria-hidden="true" />;
  if (series.kind === 'marker') return <span className={styles.dot} style={{ background: colour }} aria-hidden="true" />;
  return (
    <svg className={styles.line} viewBox="0 0 20 12" aria-hidden="true">
      <line x1="0" x2="20" y1="6" y2="6" strokeWidth={t.strokeWidth} strokeDasharray={series.projected ? `${3 * t.strokeWidth} ${2 * t.strokeWidth}` : undefined} style={{ stroke: colour }} />
    </svg>
  );
}

/** A themed chart: observed series solid, projections dashed with a band, a legend of toggle buttons, direct labels when there is room. */
export function Chart(props: ChartProps) {
  const { series, xTitle, yTitle, y2Title, y2TickFormat, ariaLabel, showLegend = true, height = 320, barmode, orientation, stackedAreaMode, projectionFrom, referenceX, annotations, yRange } = props;
  const t = useChartTokens();
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [ref, width] = useWidth<HTMLDivElement>();

  const toggle = (i: number) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else if (series.length - next.size > 1) next.add(i);
    return next;
  });

  const spec = useMemo(() => {
    if (!t) return null;
    const visible = series.filter((_, i) => !hidden.has(i));
    const lines = visible.filter((s) => (s.kind ?? 'line') === 'line');
    // End labels name lines directly, when there are few and the chart is wide enough; otherwise the legend carries identity.
    const direct = lines.length > 0 && lines.length <= 4 && width >= 520 && orientation !== 'h';
    const labelWidth = direct ? Math.max(...lines.map((s) => s.name.length)) * 0.56 * t.smallSize + t.space.s3 : 0;
    const xs = series.flatMap((s) => s.x).filter((x): x is number => typeof x === 'number');
    // The axis ends at the first and last data values, not at a padded tick; bars need their padding.
    const numericX = xs.length > 0 && xs.length === series.flatMap((s) => s.x).length && !series.some((s) => s.kind === 'bar') && orientation !== 'h';
    const x0 = Math.min(...xs); const x1 = Math.max(...xs);
    const plotWidth = Math.max(1, width - t.space.s5 - t.space.s4 - labelWidth);
    const px = (x: number) => ((x - x0) / Math.max(1, x1 - x0)) * plotWidth;

    // Labels above the plot: a label that would overlap an earlier one moves down a row.
    const notes: Array<{ x: number; text: string }> = [];
    if (projectionFrom !== undefined) notes.push({ x: projectionFrom, text: 'Projection' });
    if (referenceX) notes.push({ x: referenceX.x, text: referenceX.label });
    const placed: Array<{ a: number; b: number; row: number }> = [];
    const rows = notes.map((n) => {
      const box = { a: px(n.x) - t.space.s2, b: px(n.x) + n.text.length * 0.6 * t.captionSize + t.space.s2, row: 0 };
      while (placed.some((p) => p.row === box.row && p.a < box.b && box.a < p.b)) box.row += 1;
      placed.push(box);
      return box.row;
    });
    const topRows = notes.length ? Math.max(...rows) + 1 : 0;

    const shapes: Partial<Shape>[] = [];
    const notations: Partial<Annotations>[] = [];
    if (projectionFrom !== undefined) shapes.push({ type: 'rect', xref: 'x', yref: 'paper', x0: projectionFrom, x1, y0: 0, y1: 1, fillcolor: t.uncertainty, opacity: t.projectionOpacity, line: { width: 0 }, layer: 'below' });
    if (referenceX) shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: referenceX.x, x1: referenceX.x, y0: 0, y1: 1 });
    notes.forEach((n, i) => notations.push({ x: n.x, xref: 'x', y: 1, yref: 'paper', text: n.text, xanchor: 'left', yanchor: 'bottom', xshift: t.space.s2, yshift: rows[i] * LABEL_ROW, showarrow: false }));
    (annotations ?? []).forEach((a) => notations.push({ x: a.x, y: a.y, text: a.text, showarrow: true, ax: 0, ay: -t.space.s5, arrowwidth: t.strokeWidth }));
    if (direct) {
      const ends = lines.map((s) => ({ s, y: s.y[s.y.length - 1], x: s.x[s.x.length - 1] })).sort((a, b) => a.y - b.y);
      ends.forEach((e) => {
        const atEdge = typeof e.x !== 'number' || e.x >= x1;
        // A line that stops before the right edge is named just before its end, on the side away from its
        // own stroke, so the label never sits on the range that continues beyond it.
        const rising = e.s.y[e.s.y.length - 1] >= e.s.y[Math.max(0, e.s.y.length - 4)];
        notations.push({
          x: e.x, y: e.y, xref: 'x', yref: e.s.axis === 'y2' ? 'y2' : 'y', text: e.s.name, showarrow: false,
          ...(atEdge ? { xanchor: 'left' as const, xshift: t.space.s2 } : { xanchor: 'right' as const, xshift: -t.space.s2, yanchor: rising ? ('bottom' as const) : ('top' as const), yshift: rising ? t.space.s2 : -t.space.s2 }),
          font: { color: t.text, size: t.smallSize, family: t.familyUi },
        });
      });
    }

    const layout: Partial<Layout> = {
      showlegend: false,
      barmode: barmode === 'percent' ? 'stack' : barmode ?? (series.some((s) => s.kind === 'area') ? undefined : 'group'),
      ...(barmode === 'percent' ? { barnorm: 'percent' as const } : {}),
      margin: { t: t.space.s3 + topRows * LABEL_ROW + (topRows ? t.space.s2 : 0), r: t.space.s4 + labelWidth, l: t.space.s5, b: t.space.s5 },
      xaxis: { title: xTitle ? { text: xTitle } : undefined, ...(numericX && Number.isFinite(x0) ? { range: [x0, x1] } : {}) },
      yaxis: { title: { text: yTitle }, ...(yRange ? { range: yRange } : {}) },
      ...(y2Title ? { yaxis2: { title: { text: y2Title }, overlaying: 'y', side: 'right', tickformat: y2TickFormat, showgrid: false } } : {}),
      shapes, annotations: notations,
      hovermode: orientation === 'h' ? 'closest' : 'x unified',
    };
    return { layout, traces: buildTraces(t, series, hidden, { orientation, stackedAreaMode }) };
  }, [t, series, hidden, width, xTitle, yTitle, y2Title, y2TickFormat, barmode, orientation, projectionFrom, referenceX, annotations, yRange, stackedAreaMode]);

  const ramped = series.filter((s, i) => s.colorValues && !hidden.has(i));
  const bandSeries = series.filter((s) => s.band);
  // One range gets a swatch in its path's colour. Several ranges with the same name share one neutral
  // swatch whose label says each takes its own path's colour, instead of one path's colour for all.
  const sharedBandLabel = bandSeries.length > 1 && new Set(bandSeries.map((s) => s.band!.label)).size === 1;
  return (
    <div ref={ref} className={styles.chart}>
      {showLegend && t ? (
        <ul className={styles.legend} aria-label="Legend">
          {series.map((s, i) => (s.signed ? null : (
            <li key={`${s.name}-${i}`}>
              <button type="button" className={[styles.key, hidden.has(i) ? styles.off : ''].join(' ')} aria-pressed={!hidden.has(i)} onClick={() => toggle(i)}>
                <KeyMark series={s} colour={seriesColour(t, s.slot ?? i + 1)} t={t} />
                <span>{s.projected ? `${s.name} (projection)` : s.name}</span>
              </button>
            </li>
          )))}
          {series.filter((s) => s.signed).map((s) => {
            const c = signColours(t, s.signed!);
            const [fall, rise] = s.signLabels ?? ['Falls', 'Rises'];
            return [
              <li key={`neg-${s.name}`} className={styles.bandKey}><span className={styles.swatch} style={{ background: c.negative }} aria-hidden="true" /><Icon name="down" size="small" /><span>{fall}</span></li>,
              <li key={`pos-${s.name}`} className={styles.bandKey}><span className={styles.swatch} style={{ background: c.positive }} aria-hidden="true" /><Icon name="up" size="small" /><span>{rise}</span></li>,
            ];
          })}
          {sharedBandLabel ? (
            <li className={styles.bandKey}><span className={styles.swatch} style={{ background: t.textMuted, opacity: t.bandOpacity }} aria-hidden="true" /><span>{bandSeries[0].band!.label}, in each path’s colour</span></li>
          ) : bandSeries.map((s) => (
            <li key={`band-${s.name}`} className={styles.bandKey}><span className={styles.swatch} style={{ background: seriesColour(t, s.slot ?? series.indexOf(s) + 1), opacity: t.bandOpacity }} aria-hidden="true" /><span>{s.band!.label}</span></li>
          ))}
        </ul>
      ) : null}
      {spec ? <PlotlyChart data={spec.traces} layout={spec.layout} ariaLabel={ariaLabel} height={height} /> : null}
      {ramped.map((s) => {
        const [lo, hi] = colourRange(s);
        const format = s.formatColorValue ?? ((v: number) => v.toLocaleString('en-GB'));
        return (
          <div key={`ramp-${s.name}`} className={styles.ramp}>
            <span>{s.colorLabel ?? 'Colour value'}</span>
            <div className={styles.rampRow}><span>{format(lo)}</span><span className={styles.bar} aria-hidden="true" /><span>{format(hi)}</span></div>
          </div>
        );
      })}
    </div>
  );
}
