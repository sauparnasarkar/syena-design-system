import { geoContains, geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { coded } from '../../charts/map/countries';
import { tableRows } from '../../charts/map/tableRows';
import { HeatLegend } from '../../charts/map/HeatLegend';
import { StepLegend } from '../../charts/map/StepLegend';
import { bandCounts, bandIndex, bandTokens, defaultBandLabels, defaultBreaks, validBreaks } from '../../charts/map/bands';
import { MapControls } from '../../charts/map/MapControls';
import { formatTick, heatColour, type Domain } from '../../charts/map/heat';
import { useWidth } from '../../hooks/useWidth';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import styles from './Choropleth.module.css';

export interface ChoroplethProps {
  /** Values by ISO 3166-1 alpha-3 country code. Countries without a value are drawn as no data. */
  values: Record<string, number>;
  /** What the value is, with its unit: written in the legend and the table. */
  valueLabel: string;
  /** What is shown, the period and the headline reading, in one sentence. Required. */
  ariaLabel: string;
  /** The range the heat scale covers, on a log axis. 0.01 to 10,000 by default (annual emissions in MtCO₂). */
  domain?: Domain;
  formatValue?: (value: number) => string;
  /** The unit written after a value in the hover read-out, for example `MtCO₂`. */
  unit?: string;
  /** Countries to outline, for example the ones the reader has selected. Restyling the outline never resets the view. */
  outline?: string[];
  /** Content drawn directly under the picture and above the legend, for example the year in view. */
  caption?: ReactNode;
  /** `log` (default): the continuous heat scale on a log axis. `bands`: eight fixed bands between `breaks`, darker = more, with a step legend. */
  scale?: 'log' | 'bands';
  /** For `bands`: seven ascending values, the edges of eight bands. A value equal to an edge is in the upper band. Defaults to annual emissions in MtCO₂ (1 to 2,500). */
  breaks?: number[];
  /** For `bands`: the range written under each band (eight). Worked out from `breaks` when omitted. */
  bandLabels?: string[];
  /** `data` (default): the dark data panel. `map`: a mid-tone panel, with its own ink, borders and hatched no-data fill. */
  surface?: 'data' | 'map';
  /** For `bands`: how the number of countries in a band is written; "12 countries" by default. */
  formatCount?: (count: number) => string;
  /** With `surface="map"`: draw no panel of its own (no padding or background), for a card whose body is already that panel (`ChartCard surface="map"`). */
  flush?: boolean;
}

const heatNames = ['data-heat-1', 'data-heat-2', 'data-heat-3', 'data-heat-4', 'data-heat-5', 'data-heat-6', 'data-heat-7'] as const;
const tokenNames = ['data-surface', 'data-text', 'data-text-muted', 'data-no-data', 'data-map-panel', 'data-map-stroke', 'data-map-no-data', 'data-map-ink', ...heatNames, ...bandTokens] as const;
const defaultDomain: Domain = [0.01, 10000];
const zoomMax = 8;
const zoomStep = 1.5;
/** How far, in px, a press may wander and still be a tap: a finger always wobbles. */
const tapSlop = 6;
const land = { type: 'FeatureCollection' as const, features: coded.map((c) => c.shape) };

type View = { k: number; x: number; y: number };
const home: View = { k: 1, x: 0, y: 0 };

/**
 * A flat world map that colours countries by value on the heat scale, drawn on a canvas from resolved tokens.
 * It zooms, pans and resets with buttons, the keyboard or a drag, and its values are also a table.
 */
export function Choropleth({ values, valueLabel, ariaLabel, domain = defaultDomain, formatValue: givenFormat, unit, outline = [], caption, scale = 'log', breaks: givenBreaks, bandLabels: givenLabels, surface = 'data', formatCount, flush = false }: ChoroplethProps) {
  const formatValue = givenFormat ?? formatTick;
  const [box, width] = useWidth<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const banded = scale === 'bands';
  const breaks = banded && givenBreaks && validBreaks(givenBreaks) ? givenBreaks : defaultBreaks;
  const bandLabels = givenLabels && givenLabels.length === bandTokens.length ? givenLabels : defaultBandLabels(breaks);
  const onMap = surface === 'map';
  const t = useResolvedTokens(tokenNames) as Record<string, string> | null;
  const [view, setView] = useState<View>(home);
  const [tableView, setTableView] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  // A finger does not hover: a tap names a country and its value until another tap or Escape.
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const tableId = useId();

  const rows = useMemo(() => tableRows(values, givenFormat, 'No data', banded ? (v) => bandLabels[bandIndex(v, breaks)] : undefined), [values, givenFormat, banded, breaks, bandLabels]);
  // Every country with a value counts, drawn or not (a small one may have no shape on the map): the bands add up to the number of values.
  const counts = useMemo(() => (banded ? bandCounts(Object.values(values).filter((v) => Number.isFinite(v)), breaks) : []), [banded, values, breaks]);
  const stops = t && !banded ? heatNames.map((n) => t[n]) : [];
  // The projection is fitted to the width of the countries shown, so the map is exactly as tall as it needs to be.
  const { projection, height } = useMemo(() => {
    const p = geoNaturalEarth1().fitWidth(Math.max(1, width), land);
    const [, [, bottom]] = geoPath(p).bounds(land);
    return { projection: p, height: Math.max(1, Math.ceil(bottom)) };
  }, [width]);

  // The map cannot be dragged off the canvas: at zoom k the pan stays within the extra size.
  const clamp = (v: View): View => ({ k: v.k, x: Math.min(0, Math.max(width - width * v.k, v.x)), y: Math.min(0, Math.max(height - height * v.k, v.y)) });
  const zoomAbout = (factor: number, px = width / 2, py = height / 2) => setView((v) => {
    const k = Math.min(zoomMax, Math.max(1, v.k * factor));
    const ratio = k / v.k;
    return clamp({ k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio });
  });
  const pan = (dx: number, dy: number) => setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }));

  const outlined = useMemo(() => new Set(outline), [outline]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !t || tableView || width === 0) return;
    const ratio = window.devicePixelRatio || 1;
    el.width = width * ratio;
    el.height = height * ratio;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const ground = onMap ? t['data-map-panel'] : t['data-surface'];
    const border = onMap ? t['data-map-stroke'] : t['data-surface'];
    const noData = onMap ? t['data-map-no-data'] : t['data-no-data'];
    const ink = onMap ? t['data-map-ink'] : t['data-text'];
    ctx.fillStyle = ground; ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.k, view.k);
    const path = geoPath(projection, ctx);
    // Banded maps hatch the no-data fill (45°, 1px, the ink at 35%), so it is not mistaken for a band; the hatch keeps its size on screen however far the map is zoomed.
    let hatch: CanvasPattern | null = null;
    if (banded) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 4 * ratio;
      const tc = tile.getContext('2d');
      if (tc) {
        tc.fillStyle = noData; tc.fillRect(0, 0, tile.width, tile.height);
        tc.strokeStyle = ink; tc.globalAlpha = 0.35; tc.lineWidth = ratio;
        tc.beginPath(); tc.moveTo(0, tile.height); tc.lineTo(tile.width, 0); tc.moveTo(-1, 1); tc.lineTo(1, -1); tc.moveTo(tile.width - 1, tile.height + 1); tc.lineTo(tile.width + 1, tile.height - 1); tc.stroke();
        hatch = ctx.createPattern(tile, 'repeat');
        hatch?.setTransform(new DOMMatrix().scale(1 / (ratio * view.k)));
      }
    }
    for (const { code, shape } of coded) {
      ctx.beginPath(); path(shape);
      ctx.fillStyle = code in values ? (banded ? t[bandTokens[bandIndex(values[code], breaks)]] : heatColour(values[code], domain, stops)) : (hatch ?? noData);
      ctx.fill();
      // Borders in the panel's colour: visible wherever a step has 3:1 against it, which every step does.
      ctx.strokeStyle = border; ctx.lineWidth = 0.6 / view.k; ctx.stroke();
    }
    // On the map panel the outline is two strokes, a light one under the ink, so it reads on all eight bands (dark red and pale yellow alike).
    const strokes: Array<[string, number]> = onMap ? [[t['data-map-stroke'], 2.5], [ink, 1.25]] : [[ink, 1.6]];
    for (const [colour, w] of strokes) {
      ctx.strokeStyle = colour; ctx.lineWidth = w / view.k;
      for (const { code, shape } of coded) if (outlined.has(code)) { ctx.beginPath(); path(shape); ctx.stroke(); }
    }
    ctx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, projection, view, width, height, values, domain, outlined, tableView, banded, onMap, breaks]);

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const k = event.key;
    const step = 48;
    if (k === 'ArrowLeft') pan(step, 0);
    else if (k === 'ArrowRight') pan(-step, 0);
    else if (k === 'ArrowUp') pan(0, step);
    else if (k === 'ArrowDown') pan(0, -step);
    else if (k === '+' || k === '=') zoomAbout(zoomStep);
    else if (k === '-' || k === '_') zoomAbout(1 / zoomStep);
    else if (k === '0' || k === 'Home') setView(home);
    else if (k === 'Escape' && selected) setSelected(null);
    else return;
    event.preventDefault();
  };
  const countryAt = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = projection.invert?.([(event.clientX - rect.left - view.x) / view.k, (event.clientY - rect.top - view.y) / view.k]);
    return point ? coded.find((c) => geoContains(c.shape, point)) : undefined;
  };
  // Worked out from the code each time, so the figure follows the values (for example while a year plays).
  const describe = (code: string) => {
    const found = coded.find((c) => c.code === code);
    return found ? `${found.name}: ${code in values ? [formatValue(values[code]), unit].filter(Boolean).join(' ') + (banded ? ` · band ${bandLabels[bandIndex(values[code], breaks)]}` : '') : 'No data'}` : null;
  };
  // Capture keeps a drag going outside the picture; it is only an aid, and the pointer may already be gone.
  const capture = (el: HTMLElement, id: number, on: boolean) => { try { if (on) el.setPointerCapture(id); else el.releasePointerCapture?.(id); } catch { /* the pointer ended */ } };
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false };
    capture(event.currentTarget, event.pointerId, true);
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (d) {
      if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < tapSlop) return;
      d.moved = true;
      pan(event.clientX - d.x, event.clientY - d.y);
      d.x = event.clientX;
      d.y = event.clientY;
      return;
    }
    const found = countryAt(event);
    setHover(found ? describe(found.code) : null);
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    // A touch that did not travel is a tap: it chooses the country under it, or none on the sea. A mouse has hover instead.
    if (drag.current && !drag.current.moved && event.pointerType === 'touch') setSelected(countryAt(event)?.code ?? null);
    drag.current = null;
    capture(event.currentTarget, event.pointerId, false);
  };
  const tapped = !tableView && selected ? describe(selected) : null;

  return (
    <figure className={onMap ? [styles.map, styles.onMap, flush ? styles.flush : ''].filter(Boolean).join(' ') : styles.map}>
      <div ref={box} className={styles.stage}>
        {t && width > 0 ? (
          // Focusable so the keyboard can pan and zoom it.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <canvas
            ref={canvas}
            role="img"
            aria-label={ariaLabel}
            aria-describedby={tableId}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - 0"
            hidden={tableView}
            tabIndex={tableView ? -1 : 0}
            className={styles.canvas}
            style={{ width, height }}
            onKeyDown={onKeyDown}
            onPointerLeave={() => { setHover(null); drag.current = null; }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { drag.current = null; }}
          />
        ) : null}
        {tapped ? <p className={styles.readoutTap} aria-hidden="true">{tapped}</p> : null}
        {tableView ? null : <p className={styles.readout} aria-hidden="true">{hover ?? ' '}</p>}
      </div>
      {caption ? <div className={styles.caption}>{caption}</div> : null}
      {banded
        ? <StepLegend label={valueLabel} bandLabels={bandLabels} counts={counts} formatCount={formatCount} onMap={onMap} />
        : <HeatLegend label={valueLabel} domain={domain} formatValue={formatValue} />}
      <MapControls
        subject="map"
        onZoomIn={() => zoomAbout(zoomStep)}
        onZoomOut={() => zoomAbout(1 / zoomStep)}
        onReset={() => setView(home)}
        zoomInDisabled={view.k >= zoomMax}
        zoomOutDisabled={view.k <= 1}
        tableView={tableView}
        onTableViewChange={setTableView}
        hint="Arrow keys move the map, + and − zoom, 0 resets."
        onMap={onMap}
      />
      <div className={tableView ? styles.tableView : styles.hidden} {...(tableView ? { role: 'region', 'aria-label': 'Table of values', tabIndex: 0 } : {})}>
        <table id={tableId}>
          <caption>{ariaLabel}</caption>
          <thead><tr><th scope="col">Country</th><th scope="col">{valueLabel}</th>{banded ? <th scope="col">Band</th> : null}</tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.code}><th scope="row">{r.name}</th><td>{r.text}</td>{banded ? <td>{r.band}</td> : null}</tr>)}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
