import { seriesColour } from './palette';
import { useChartTokens } from './tokens';

/**
 * The colour `Chart` draws for categorical slot `slot` (1 to 8; past 8, `data-other`), resolved for the theme in force exactly as the chart
 * resolves it. Use it for anything outside the chart that stands for a series -- a key, a swatch, a card's accent -- so it matches the line or bar.
 * Chart tokens are read from the theme provider's scope, and the data panel does not redefine the categorical slots, so this is the chart's colour
 * wherever the consumer sits. Null until the provider has mounted, and for a slot that is not a whole number from 1.
 */
export function useSeriesColour(slot: number): string | null {
  const t = useChartTokens();
  if (!t || !Number.isInteger(slot) || slot < 1) return null;
  return seriesColour(t, slot);
}
