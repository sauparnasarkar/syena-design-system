import { geoContains, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { coded } from '../../charts/map/countries';
import { HeatLegend } from '../../charts/map/HeatLegend';
import { MapControls } from '../../charts/map/MapControls';
import { formatTick, heatColour, type Domain } from '../../charts/map/heat';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import styles from './Globe.module.css';

export interface GlobeProps {
  /** Values by ISO 3166-1 alpha-3 country code. Countries without a value are drawn as no data. */
  values: Record<string, number>;
  /** What the value is, with its unit: written in the legend and the table. */
  valueLabel: string;
  /** What is shown, the period and the headline reading, in one sentence. Required. */
  ariaLabel: string;
  /** The range the heat scale covers, on a log axis. 0.01 to 10,000 by default (annual emissions in MtCO₂). */
  domain?: Domain;
  /** Turns slowly until the pointer or focus is on the globe, or the view has been changed. Off when the reader prefers reduced motion. */
  autoRotate?: boolean;
  /** The longitude and latitude in view at the start, in degrees. */
  center?: [number, number];
  formatValue?: (value: number) => string;
  /** The unit written after a value in the hover read-out, for example `MtCO₂`. */
  unit?: string;
  /** The side of the square drawing area in pixels. */
  size?: number;
}

const heatNames = ['data-heat-1', 'data-heat-2', 'data-heat-3', 'data-heat-4', 'data-heat-5', 'data-heat-6', 'data-heat-7'] as const;
const tokenNames = ['data-surface', 'data-text-muted', 'data-no-data', 'data-gridline', ...heatNames] as const;
const defaultCenter: [number, number] = [10, 20];
const defaultDomain: Domain = [0.01, 10000];
const zoomMin = 1;
const zoomMax = 6;
const zoomStep = 1.4;
const turnStep = 10;
const maxTilt = 70;

/**
 * A globe that colours countries by value on the heat scale, drawn on a canvas from resolved tokens.
 * It turns, zooms and resets with buttons, the keyboard or a drag, and its values are also a table.
 */
export function Globe({ values, valueLabel, ariaLabel, domain = defaultDomain, autoRotate = true, center = defaultCenter, formatValue = formatTick, unit, size = 360 }: GlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = useResolvedTokens(tokenNames);
  const reduced = useReducedMotion();
  const [lon, setLon] = useState(center[0]);
  const [lat, setLat] = useState(center[1]);
  const [zoom, setZoom] = useState(1);
  const [paused, setPaused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [tableView, setTableView] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const tableId = useId();

  const rows = useMemo(() => coded.filter((r) => r.code in values).sort((a, b) => values[b.code] - values[a.code]), [values]);
  const stops = t ? heatNames.map((n) => t[n]) : [];

  const turning = autoRotate && !reduced && !paused && !touched && !tableView;
  useEffect(() => {
    if (!turning) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setLon((r) => (r + (now - last) * 0.006) % 360);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [turning]);

  const projection = useMemo(() => geoOrthographic().translate([size / 2, size / 2]).scale((size / 2 - 2) * zoom).rotate([-lon, -lat]), [size, zoom, lon, lat]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !t || tableView) return;
    const ratio = window.devicePixelRatio || 1;
    el.width = size * ratio;
    el.height = size * ratio;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const path = geoPath(projection, ctx);
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = t['data-surface']; ctx.fill();
    ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = t['data-gridline']; ctx.lineWidth = 0.5; ctx.stroke();
    for (const { code, shape } of coded) {
      ctx.beginPath(); path(shape);
      ctx.fillStyle = code in values ? heatColour(values[code], domain, stops) : t['data-no-data'];
      ctx.fill();
      // Borders in the panel's colour: visible wherever a step has 3:1 against it, which every step does.
      ctx.strokeStyle = t['data-surface']; ctx.lineWidth = 0.6; ctx.stroke();
    }
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = t['data-text-muted']; ctx.lineWidth = 1; ctx.stroke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, projection, size, values, domain, tableView]);

  const reset = () => { setLon(center[0]); setLat(center[1]); setZoom(1); setTouched(true); };
  const zoomBy = (factor: number) => { setZoom((z) => Math.min(zoomMax, Math.max(zoomMin, z * factor))); setTouched(true); };
  const turn = (dLon: number, dLat: number) => { setLon((v) => (v + dLon + 360) % 360); setLat((v) => Math.max(-maxTilt, Math.min(maxTilt, v + dLat))); setTouched(true); };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const k = event.key;
    const step = turnStep / zoom;
    if (k === 'ArrowLeft') turn(-step, 0);
    else if (k === 'ArrowRight') turn(step, 0);
    else if (k === 'ArrowUp') turn(0, step);
    else if (k === 'ArrowDown') turn(0, -step);
    else if (k === '+' || k === '=') zoomBy(zoomStep);
    else if (k === '-' || k === '_') zoomBy(1 / zoomStep);
    else if (k === '0' || k === 'Home') reset();
    else return;
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (drag.current) {
      const scale = 0.4 / zoom;
      turn(-(event.clientX - drag.current.x) * scale, (event.clientY - drag.current.y) * scale);
      drag.current = { x: event.clientX, y: event.clientY };
      return;
    }
    const point = projection.invert?.([((event.clientX - box.left) / box.width) * size, ((event.clientY - box.top) / box.height) * size]);
    const found = point ? coded.find((c) => geoContains(c.shape, point)) : undefined;
    setHover(found ? `${found.name}: ${found.code in values ? [formatValue(values[found.code]), unit].filter(Boolean).join(' ') : 'No data'}` : null);
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => { drag.current = null; event.currentTarget.releasePointerCapture?.(event.pointerId); };

  if (!t) return null;
  return (
    <figure className={styles.globe}>
      <div className={styles.stage} style={{ width: size }}>
        {/* Focusable so the keyboard can turn and zoom it; the turn pauses while it has the pointer or focus. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <canvas
          ref={canvas}
          role="img"
          aria-label={ariaLabel}
          aria-describedby={tableId}
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - 0"
          hidden={tableView}
          tabIndex={tableView ? -1 : 0}
          className={styles.canvas}
          style={{ width: size }}
          onKeyDown={onKeyDown}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => { setPaused(false); setHover(null); drag.current = null; }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        />
        {tableView ? null : <p className={styles.readout} aria-hidden="true">{hover ?? ' '}</p>}
      </div>
      <MapControls
        subject="globe"
        onZoomIn={() => zoomBy(zoomStep)}
        onZoomOut={() => zoomBy(1 / zoomStep)}
        onReset={reset}
        zoomInDisabled={zoom >= zoomMax}
        zoomOutDisabled={zoom <= zoomMin}
        tableView={tableView}
        onTableViewChange={setTableView}
        hint="Arrow keys turn the globe, + and − zoom, 0 resets."
      />
      <div className={tableView ? styles.tableView : styles.hidden}>
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
