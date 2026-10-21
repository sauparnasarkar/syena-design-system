import { geoArea, geoCentroid, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { coded } from '../../charts/map/countries';
import { tableRows } from '../../charts/map/tableRows';
import { HeatLegend } from '../../charts/map/HeatLegend';
import { MapControls } from '../../charts/map/MapControls';
import { formatTick, heatColour, type Domain } from '../../charts/map/heat';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import { defaultTurnPeriod, degreesPerMillisecond } from './turn';
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
  /** Seconds for one full turn while it turns on its own. 60 by default. */
  turnPeriod?: number;
  /** The longitude and latitude in view at the start, in degrees. */
  center?: [number, number];
  formatValue?: (value: number) => string;
  /** The unit written after a value in the hover read-out, for example `MtCO₂`. */
  unit?: string;
  /** The side of the square drawing area in pixels. */
  size?: number;
  /** Content drawn directly under the picture and above the legend, for example the year in view. With `compact` it is drawn on the picture's top-left corner instead. */
  caption?: ReactNode;
  /** A shorter figure for a wide setting: the caption and the pointed-at country are drawn on the picture's corners, and the legend's name shares a row with its scale. */
  compact?: boolean;
  /** Words kept on the picture for a few countries, for example the largest values: each names a country by its alpha-3 code. A label is drawn only while its country faces the viewer, and not in the table view. */
  labels?: { id: string; text: string }[];
}

const heatNames = ['data-heat-1', 'data-heat-2', 'data-heat-3', 'data-heat-4', 'data-heat-5', 'data-heat-6', 'data-heat-7'] as const;
const tokenNames = ['data-surface', 'data-text', 'data-text-muted', 'data-no-data', 'data-gridline', ...heatNames] as const;
const defaultCenter: [number, number] = [10, 20];
const defaultDomain: Domain = [0.01, 10000];
const zoomMin = 1;
const zoomMax = 6;
const zoomStep = 1.4;
const turnStep = 10;
const maxTilt = 70;
/** How far a press may move and still be a tap, in pixels. */
const tapSlop = 6;

/** The middle of the country's largest part, so a country with far islands is labelled on its mainland. */
const anchorOf = (shape: (typeof coded)[number]['shape']): [number, number] => {
  const g = shape.geometry;
  if (g.type !== 'MultiPolygon') return geoCentroid(shape);
  const largest = g.coordinates.reduce((best, part) => { const p = { type: 'Polygon' as const, coordinates: part }; const a = geoArea(p); return a > best.a ? { a, p } : best; }, { a: -1, p: { type: 'Polygon' as const, coordinates: g.coordinates[0] } });
  return geoCentroid(largest.p);
};

/**
 * A globe that colours countries by value on the heat scale, drawn on a canvas from resolved tokens.
 * It turns, zooms and resets with buttons, the keyboard or a drag, and its values are also a table.
 */
export function Globe({ values, valueLabel, ariaLabel, domain = defaultDomain, autoRotate = true, turnPeriod = defaultTurnPeriod, center = defaultCenter, formatValue: givenFormat, unit, size = 360, caption, compact = false, labels }: GlobeProps) {
  const formatValue = givenFormat ?? formatTick;
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
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const tableId = useId();

  const rows = useMemo(() => tableRows(values, givenFormat), [values, givenFormat]);
  const stops = t ? heatNames.map((n) => t[n]) : [];

  const turning = autoRotate && !reduced && !paused && !touched && !tableView;
  useEffect(() => {
    if (!turning) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // The step is worked out here: an updater may run after `last` has moved on, which would shrink it.
      const step = (now - last) * degreesPerMillisecond(turnPeriod);
      last = now;
      setLon((r) => (r + step) % 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [turning, turnPeriod]);

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
    const chosen = selected ? coded.find((c) => c.code === selected) : undefined;
    if (chosen) { ctx.beginPath(); path(chosen.shape); ctx.strokeStyle = t['data-text']; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = t['data-text-muted']; ctx.lineWidth = 1; ctx.stroke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, projection, size, values, domain, tableView, selected]);

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
    else if (k === 'Escape' && selected) setSelected(null);
    else return;
    event.preventDefault();
  };

  const countryAt = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const point = projection.invert?.([((event.clientX - box.left) / box.width) * size, ((event.clientY - box.top) / box.height) * size]);
    return point ? coded.find((c) => geoContains(c.shape, point)) : undefined;
  };
  const describe = (code: string) => {
    const found = coded.find((c) => c.code === code);
    return found ? `${found.name}: ${code in values ? [formatValue(values[code]), unit].filter(Boolean).join(' ') : 'No data'}` : null;
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
      // A finger always wobbles: the globe turns only once the press has clearly travelled.
      if (!d.moved && Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < tapSlop) return;
      d.moved = true;
      const scale = 0.4 / zoom;
      turn(-(event.clientX - d.x) * scale, (event.clientY - d.y) * scale);
      d.x = event.clientX;
      d.y = event.clientY;
      return;
    }
    // A finger does not hover: only a pointer that can rest on the globe names what is under it.
    if (event.pointerType === 'touch') return;
    setHover(countryAt(event)?.code ?? null);
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    // A press that did not travel is a tap: it chooses the country under it, or none on the sea.
    if (drag.current && !drag.current.moved) setSelected(countryAt(event)?.code ?? null);
    drag.current = null;
    capture(event.currentTarget, event.pointerId, false);
  };

  const shown = hover ?? selected;
  const shownText = shown ? describe(shown) : null;
  const anchors = useMemo(() => new Map((labels ?? []).flatMap((l) => { const c = coded.find((x) => x.code === l.id); return c ? [[l.id, anchorOf(c.shape)] as const] : []; })), [labels]);
  const placed = tableView ? [] : (labels ?? []).flatMap((l) => {
    const at = anchors.get(l.id);
    // Only the side facing the viewer, and only what is inside the picture.
    if (!at || geoDistance(at, [lon, lat]) >= Math.PI / 2) return [];
    const xy = projection(at);
    return xy && xy[0] >= 0 && xy[0] <= size && xy[1] >= 0 && xy[1] <= size ? [{ ...l, x: xy[0], y: xy[1] }] : [];
  });

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
          onPointerCancel={() => { drag.current = null; }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        />
        {compact && caption && !tableView ? <div className={styles.corner}>{caption}</div> : null}
        {placed.length ? (
          <div className={styles.labels} aria-hidden="true">
            {placed.map((l) => <span key={l.id} className={styles.label} style={{ left: `${(l.x / size) * 100}%`, top: `${(l.y / size) * 100}%` }}>{l.text}</span>)}
          </div>
        ) : null}
        {tableView ? null : compact ? (shownText ? <p className={styles.readoutCorner} aria-hidden="true">{shownText}</p> : null) : <p className={styles.readout} aria-hidden="true">{shownText ?? ' '}</p>}
      </div>
      {caption && !compact ? <div className={styles.caption}>{caption}</div> : null}
      <HeatLegend label={valueLabel} domain={domain} formatValue={formatValue} inline={compact} />
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
      <div className={tableView ? styles.tableView : styles.hidden} {...(tableView ? { role: 'region', 'aria-label': 'Table of values', tabIndex: 0 } : {})}>
        <table id={tableId}>
          <caption>{ariaLabel}</caption>
          <thead><tr><th scope="col">Country</th><th scope="col">{valueLabel}</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.code}><th scope="row">{r.name}</th><td>{r.text}</td></tr>)}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
