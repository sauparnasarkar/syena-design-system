import { themeQuartz } from 'ag-grid-community';
import { useMemo } from 'react';
import { useResolvedTokens } from '../theme/SynThemeProvider';
import { toPx } from '../theme/lengths';

export const gridTokenNames = [
  'color-surface-raised', 'color-surface-sunken', 'color-surface-overlay', 'color-text-secondary', 'color-text-muted',
  'color-border-subtle', 'color-border-default', 'color-border-emphasis', 'color-accent-fill', 'color-accent-tint', 'color-focus-ring',
  'family-ui', 'type-text-sm-size', 'type-title-sm-weight',
  'layout-control-height', 'layout-border-hairline', 'layout-focus-ring-width',
  'space-2', 'space-4', 'radius-card', 'radius-control', 'icon-small',
] as const;

/**
 * The data grid theme (Theming API). Every value is a resolved token, converted to the unit the
 * grid takes. Row and header height are the control height of section 2.5; cell padding is a
 * spacing step. No grid class is restyled in CSS.
 */
export function useGridTheme() {
  const t = useResolvedTokens(gridTokenNames);
  return useMemo(() => {
    if (!t) return null;
    const hairline = toPx(t['layout-border-hairline']);
    return themeQuartz.withParams({
      backgroundColor: t['color-surface-raised'],
      foregroundColor: t['color-text-secondary'],
      headerBackgroundColor: t['color-surface-sunken'],
      headerTextColor: t['color-text-muted'],
      headerFontWeight: Number(t['type-title-sm-weight']),
      chromeBackgroundColor: t['color-surface-sunken'],
      borderColor: t['color-border-subtle'],
      accentColor: t['color-accent-fill'],
      rowHoverColor: t['color-surface-sunken'],
      selectedRowBackgroundColor: t['color-accent-tint'],
      fontFamily: t['family-ui'],
      fontSize: toPx(t['type-text-sm-size']),
      headerFontSize: toPx(t['type-text-sm-size']),
      rowHeight: toPx(t['layout-control-height']),
      headerHeight: toPx(t['layout-control-height']),
      spacing: toPx(t['space-2']),
      cellHorizontalPadding: toPx(t['space-4']),
      wrapperBorderRadius: toPx(t['radius-card']),
      borderRadius: toPx(t['radius-control']),
      iconSize: toPx(t['icon-small']),
      rowBorder: { style: 'solid', width: hairline, color: t['color-border-subtle'] },
      headerRowBorder: { style: 'solid', width: hairline, color: t['color-border-default'] },
      columnBorder: false,
      headerColumnBorder: false,
      pinnedColumnBorder: { style: 'solid', width: hairline, color: t['color-border-default'] },
      focusShadow: { spread: toPx(t['layout-focus-ring-width']), color: t['color-focus-ring'] },
      menuBackgroundColor: t['color-surface-overlay'],
    });
  }, [t]);
}
