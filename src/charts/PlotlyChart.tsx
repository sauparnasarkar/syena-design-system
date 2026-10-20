import { useEffect, useReducer, useRef } from 'react';
import type { Data, Layout, Config } from 'plotly.js';
import { Button } from '../components/Button/Button';
import { InlineAlert } from '../components/InlineAlert/InlineAlert';
import { buildPlotlyTemplate } from './template';
import { useChartTokens } from './tokens';

export interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  /** The accessible name of the chart: what is plotted, the unit, the period and the headline reading. */
  ariaLabel: string;
  height: number;
}

const config: Partial<Config> = { displayModeBar: false, responsive: true };

/** The layout and height each data set last failed to draw with. */
const failures = new WeakMap<Data[], { layout?: Partial<Layout>; height: number }>();

/** Hosts a Plotly chart themed from tokens. The chart components build on this. */
export function PlotlyChart({ data, layout, ariaLabel, height }: PlotlyChartProps) {
  const host = useRef<HTMLDivElement>(null);
  const tokens = useChartTokens();
  // The library is loaded on demand and can fail to arrive (a stale cached build asks for a file the server no longer has) or to draw: say so, never leave a blank panel.
  // It is the failure of these inputs: a chart given new data, layout or height gets a fresh try, and the message goes. Kept apart from state
  // (which only counts, to draw again) so the data is never stored where tooling would walk it.
  const [, drawAgain] = useReducer((n: number) => n + 1, 0);
  const failedWith = failures.get(data);
  const failed = failedWith !== undefined && failedWith.layout === layout && failedWith.height === height;

  useEffect(() => {
    const el = host.current;
    if (!el || !tokens) return undefined;
    let cancelled = false;
    void import('plotly.js-basic-dist-min')
      .then(({ default: Plotly }) => (cancelled ? undefined : Plotly.react(el, data, { ...layout, template: buildPlotlyTemplate(tokens), height, autosize: true }, config)))
      .catch(() => { if (!cancelled) { failures.set(data, { layout, height }); drawAgain(); } });
    return () => { cancelled = true; };
  }, [data, layout, tokens, height]);

  useEffect(() => {
    const el = host.current;
    return () => {
      if (el) void import('plotly.js-basic-dist-min').then(({ default: Plotly }) => Plotly.purge(el)).catch(() => undefined);
    };
  }, []);

  return (
    <>
      {/* Folded away, not removed or hidden: it keeps its width, so a chart drawn again after a failure comes out at the right size. */}
      <div ref={host} role={failed ? undefined : 'img'} aria-label={failed ? undefined : ariaLabel} aria-hidden={failed || undefined} style={{ height: failed ? 0 : height, overflow: failed ? 'hidden' : undefined }} />
      {failed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--syn-space-3)' }}>
          <InlineAlert variant="error" title="Chart failed to load">Reload the page to try again.</InlineAlert>
          <Button size="small" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      ) : null}
    </>
  );
}
