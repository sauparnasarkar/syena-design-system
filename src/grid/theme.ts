import { themeQuartz } from 'ag-grid-community';
import { useMemo } from 'react';
import { useResolvedTokens } from '../theme/SynThemeProvider';
import { toPx } from '../theme/lengths';
import { gridParams, gridTokenNames, type GridDensity } from './params';

/** The data grid theme (Theming API), from resolved tokens only; see gridParams for the mapping. */
export function useGridTheme(density: GridDensity = 'comfortable') {
  const t = useResolvedTokens(gridTokenNames);
  return useMemo(() => (t ? themeQuartz.withParams(gridParams(t, (length) => toPx(length), density)) : null), [t, density]);
}
