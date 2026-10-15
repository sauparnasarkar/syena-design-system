import { geoContains, geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { coded } from '../../charts/map/countries';
import { HeatLegend } from '../../charts/map/HeatLegend';
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
}

const heatNames = ['data-heat-1', 'data-heat-2', 'data-heat-3', 'data-heat-4', 'data-heat-5', 'data-heat-6', 'data-heat-7'] as const;
const tokenNames = ['data-surface', 'data-text', 'data-text-muted', 'data-no-data', ...heatNames] as const;
const defaultDomain: Domain = [0.01, 10000];
const zoomMax = 8;
const zoomStep = 1.5;
const land = { type: 'FeatureCollection' as const, features: coded.map((c) => c.shape) };

type View = { k: number; x: number; y: number };
const home: View = { k: 1, x: 0, y: 0 };

/**
 * A flat world map that colours countries by value on the heat scale, drawn on a canvas from resolved tokens.
 * It zooms, pans and resets with buttons, the keyboard or a drag, and its values are also a table.
 */
export function Choropleth({ values, valueLabel, ariaLabel, domain = defaultDomain, formatValue = formatTick, unit, outline = [] }: ChoroplethProps) {
  const [box, width] = useWidth<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = useResolvedTokens(tokenNames);
  const [view, setView] = useState<View>(home);
  const [tableView, setTableView] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const tableId = useId();

  const rows = useMemo(() => coded.filter((r) => r.code in values).sort((a, b) => values[b.code] - values[a.code]), [values]);
  const stops = t ? heatNames.map((n) => t[n]) : [];
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
    ctx.fillStyle = t['data-surface']; ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.k, view.k);
    const path = geoPath(projection, ctx);
    for (const { code, shape } of coded) {
      ctx.beginPath(); path(shape);
      ctx.fillStyle = code in values ? heatColour(values[code], domain, stops) : t['data-no-data'];
      ctx.fill();
      // Borders in the panel's colour: visible wherever a step has 3:1 against it, which every step does.
      ctx.strokeStyle = t['data-surface']; ctx.lineWidth = 0.6 / view.k; ctx.stroke();
    }
    ctx.strokeStyle = t['data-text']; ctx.lineWidth = 1.6 / view.k;
    for (const { code, shape } of coded) if (outlined.has(code)) { ctx.beginPath(); path(shape); ctx.stroke(); }
    ctx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, projection, view, width, height, values, domain, outlined, tableView]);

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
    else return;
    event.preventDefault();
  };
  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => { drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drag.current) {
      pan(event.clientX - drag.current.x, event.clientY - drag.current.y);
      drag.current = { x: event.clientX, y: event.clientY };
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const point = projection.invert?.([(event.clientX - rect.left - view.x) / view.k, (event.clientY - rect.top - view.y) / view.k]);
    const found = point ? coded.find((c) => geoContains(c.shape, point)) : undefined;
    setHover(found ? `${found.name}: ${found.code in values ? [formatValue(values[found.code]), unit].filter(Boolean).join(' ') : 'No data'}` : null);
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => { drag.current = null; event.currentTarget.releasePointerCapture?.(event.pointerId); };

  return (
    <figure className={styles.map}>
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
          />
        ) : null}
        {tableView ? null : <p className={styles.readout} aria-hidden="true">{hover ?? ' '}</p>}
      </div>
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
      />
      <div className={tableView ? styles.tableView : styles.hidden} {...(tableView ? { role: 'region', 'aria-label': 'Table of values', tabIndex: 0 } : {})}>
        <table id={tableId}>
          <caption>{ariaLabel}</caption>
          <thead><tr><th scope="col">Country</th><th scope="col">{valueLabel}</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.code}><th scope="row">{r.name}</th><td>{formatValue(values[r.code])}</td></tr>)}
          </tbody>
        </table>
      </div>
      <HeatLegend label={valueLabel} domain={domain} formatValue={formatValue} />
    </figure>
  );
}
