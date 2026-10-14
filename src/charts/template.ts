import type { Layout, Template } from 'plotly.js';
import { sequentialScale, divergingScale } from './palette';
import type { ChartTokens } from './tokens';

/** The Plotly template for a theme: every colour, font and length comes from resolved tokens. */
export function buildPlotlyTemplate(t: ChartTokens): Partial<Template> {
  const tickFont = { family: t.familyFigure, size: t.captionSize, color: t.textMuted };
  const titleFont = { family: t.familyUi, size: t.captionSize, color: t.textMuted };
  const axis = {
    gridcolor: t.gridline,
    linecolor: t.gridline,
    zerolinecolor: t.gridline,
    tickfont: tickFont,
    title: { font: titleFont },
    automargin: true,
    ticks: '' as const,
  };
  // Plotly accepts annotation and shape defaults in a template; its typings do not list them.
  const layout: Record<string, unknown> = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: t.surface,
      colorway: t.categorical,
      font: { family: t.familyUi, size: t.captionSize, color: t.textMuted },
      margin: { l: t.space.s5, r: t.space.s4, t: t.space.s3, b: t.space.s5 },
      xaxis: axis,
      yaxis: axis,
      legend: { orientation: 'h', x: 0, y: 1, yanchor: 'bottom', bgcolor: 'transparent', font: { family: t.familyUi, size: t.smallSize, color: t.text } },
      hovermode: 'x unified',
      hoverlabel: { bgcolor: t.overlay, bordercolor: t.border, font: { family: t.familyFigure, size: t.smallSize, color: t.textPrimary } },
      annotationdefaults: { font: { family: t.familyUi, size: t.captionSize, color: t.annotation }, arrowcolor: t.annotation, showarrow: false },
      shapedefaults: { line: { color: t.annotation, width: t.strokeWidth, dash: 'dot' } },
      colorscale: { sequential: sequentialScale(t), diverging: divergingScale(t) },
  };
  return {
    layout: layout as Partial<Layout>,
    data: {
      scatter: [{ line: { width: t.strokeWidth }, marker: { size: 3 * t.strokeWidth } }],
      bar: [{ marker: { line: { width: 0 } } }],
    },
  };
}
