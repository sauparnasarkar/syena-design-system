import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import iso from 'iso-3166-1';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countries from 'world-atlas/countries-110m.json';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useResolvedTokens } from '../../theme/SynThemeProvider';
import styles from './Globe.module.css';

export interface GlobeProps {
  /** Values by ISO 3166-1 alpha-3 country code. Countries without a value are drawn as no data. */
  values: Record<string, number>;
  /** What the value is, with its unit: written in the legend and the text alternative. */
  valueLabel: string;
  /** What is shown, the period and the headline reading, in one sentence. Required. */
  ariaLabel: string;
  /** The range the colour steps cover. The range of `values` by default. */
  domain?: [number, number];
  /** Turns slowly until the pointer or focus is on the globe. Off when the reader prefers reduced motion. */
  autoRotate?: boolean;
  /** The country in view at the start, as longitude and latitude in degrees. */
  center?: [number, number];
  formatValue?: (value: number) => string;
  /** The side of the square drawing area in pixels. */
  size?: number;
}

const defaultCenter: [number, number] = [10, 20];
const rampNames = ['data-seq-1', 'data-seq-2', 'data-seq-3', 'data-seq-4', 'data-seq-5', 'data-seq-6', 'data-seq-7'] as const;
const tokenNames = ['data-surface', 'data-text', 'data-text-muted', 'data-no-data', 'data-gridline', 'data-seq-1', 'data-seq-2', 'data-seq-3', 'data-seq-4', 'data-seq-5', 'data-seq-6', 'data-seq-7'] as const;

const topology = countries as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const shapes = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>;
const alpha3ByNumeric = new Map(iso.all().map((c) => [c.numeric.padStart(3, '0'), c.alpha3]));
const alpha3Of = (f: Feature) => alpha3ByNumeric.get(String(f.id).padStart(3, '0'));

/**
 * A globe that colours countries by value on a sequential ramp. Drawn on a canvas from resolved
 * tokens; the values are also written as a table for assistive technology.
 */
export function Globe({ values, valueLabel, ariaLabel, domain, autoRotate = true, center = defaultCenter, formatValue = (v) => v.toLocaleString('en-GB'), size = 360 }: GlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = useResolvedTokens(tokenNames);
  const reduced = useReducedMotion();
  const [rotation, setRotation] = useState(center[0]);
  const [paused, setPaused] = useState(false);
  const tableId = useId();
  const [lo, hi] = useMemo<[number, number]>(() => {
    if (domain) return domain;
    const v = Object.values(values);
    return v.length ? [Math.min(...v), Math.max(...v)] : [0, 1];
  }, [domain, values]);

  const steps = t ? rampNames.map((n) => t[n]) : [];
  const rows = useMemo(() => shapes.features.map((f) => ({ code: alpha3Of(f), name: f.properties.name })).filter((r): r is { code: string; name: string } => !!r.code && r.code in values).sort((a, b) => values[b.code] - values[a.code]), [values]);

  useEffect(() => {
    if (!autoRotate || reduced || paused) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setRotation((r) => (r + (now - last) * 0.006) % 360);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate, reduced, paused]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !t) return;
    const ratio = window.devicePixelRatio || 1;
    el.width = size * ratio;
    el.height = size * ratio;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const ramp = rampNames.map((n) => t[n]);
    const stepOf = (v: number) => Math.min(ramp.length - 1, Math.max(0, Math.floor(((v - lo) / Math.max(1e-9, hi - lo)) * ramp.length)));
    const projection = geoOrthographic().translate([size / 2, size / 2]).scale(size / 2 - 2).rotate([-rotation, -center[1]]);
    const path = geoPath(projection, ctx);
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = t['data-surface']; ctx.fill();
    ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = t['data-gridline']; ctx.lineWidth = 0.5; ctx.stroke();
    for (const f of shapes.features) {
      const code = alpha3Of(f);
      ctx.beginPath(); path(f);
      ctx.fillStyle = code && code in values ? ramp[stepOf(values[code])] : t['data-no-data'];
      ctx.fill();
      ctx.strokeStyle = t['data-surface']; ctx.lineWidth = 0.5; ctx.stroke();
    }
    ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = t['data-text-muted']; ctx.lineWidth = 1; ctx.stroke();
  }, [t, rotation, size, values, lo, hi, center]);

  if (!t) return null;
  return (
    <figure className={styles.globe}>
      {/* The canvas is focusable so keyboard readers can reach the description; the turn pauses while it has the pointer or focus. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <canvas ref={canvas} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} role="img" aria-label={ariaLabel} aria-describedby={tableId} tabIndex={0} className={styles.canvas} style={{ width: size }} />
      <figcaption className={styles.legend}>
        <span>{valueLabel}</span>
        <span className={styles.ramp} aria-hidden="true">{steps.map((c, i) => <span key={i} className={styles.step} style={{ background: c }} />)}</span>
        <span className={styles.ends}><span>{formatValue(lo)}</span><span>{formatValue(hi)}</span></span>
        <span className={styles.nodata}><span className={styles.step} style={{ background: t['data-no-data'] }} aria-hidden="true" />No data</span>
      </figcaption>
      <div className={styles.hidden}>
      <table id={tableId}>
        <caption>{ariaLabel}</caption>
        <thead><tr><th scope="col">Country</th><th scope="col">{valueLabel}</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.code}><th scope="row">{r.name}</th><td>{formatValue(values[r.code])}</td></tr>)}</tbody>
      </table>
      </div>
    </figure>
  );
}
