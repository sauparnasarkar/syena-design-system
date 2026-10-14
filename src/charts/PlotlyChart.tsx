import { useEffect, useRef } from 'react';
import type { Data, Layout, Config } from 'plotly.js';
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

  useEffect(() => {
    const el = host.current;
    if (!el || !tokens) return undefined;
    let cancelled = false;
    void import('plotly.js-basic-dist-min').then(({ default: Plotly }) => {
      if (cancelled) return;
      void Plotly.react(el, data, { ...layout, template: buildPlotlyTemplate(tokens), height, autosize: true }, config);
    });
    return () => { cancelled = true; };
  }, [data, layout, tokens, height]);

  useEffect(() => {
    const el = host.current;
    return () => {
      if (el) void import('plotly.js-basic-dist-min').then(({ default: Plotly }) => Plotly.purge(el));
    };
  }, []);

  return <div ref={host} role="img" aria-label={ariaLabel} style={{ height }} />;
}
