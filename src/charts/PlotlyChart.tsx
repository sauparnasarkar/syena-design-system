import { useEffect, useRef, useState } from 'react';
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

/** Hosts a Plotly chart themed from tokens. The chart components build on this. */
export function PlotlyChart({ data, layout, ariaLabel, height }: PlotlyChartProps) {
  const host = useRef<HTMLDivElement>(null);
  const tokens = useChartTokens();
  // The library is loaded on demand and can fail to arrive (a stale cached build asks for a file the server no longer has) or to draw: say so, never leave a blank panel.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || !tokens) return undefined;
    let cancelled = false;
    void import('plotly.js-basic-dist-min')
      .then(({ default: Plotly }) => (cancelled ? undefined : Plotly.react(el, data, { ...layout, template: buildPlotlyTemplate(tokens), height, autosize: true }, config)))
      .catch(() => { if (!cancelled) setFailed(true); });
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
      <div ref={host} role={failed ? undefined : 'img'} aria-label={failed ? undefined : ariaLabel} hidden={failed} style={{ height }} />
      {failed ? (
        <div>
          <InlineAlert variant="error" title="Chart failed to load">Reload the page to try again.</InlineAlert>
          <Button size="small" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      ) : null}
    </>
  );
}
