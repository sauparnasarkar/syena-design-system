import type { themeQuartz } from 'ag-grid-community';

export const gridTokenNames = [
  'color-surface-base', 'color-surface-raised', 'color-surface-sunken', 'color-surface-overlay', 'color-surface-inverse',
  'color-text-primary', 'color-text-secondary', 'color-text-muted', 'color-text-disabled', 'color-text-inverse', 'color-text-on-accent',
  'color-border-subtle', 'color-border-default', 'color-border-emphasis',
  'color-accent-fill', 'color-accent-hover', 'color-accent-active', 'color-accent-tint', 'color-accent-text', 'color-focus-ring',
  'color-signal-positive-text', 'color-signal-negative-text', 'color-signal-negative-fill', 'color-signal-negative-tint',
  'data-cat-1', 'data-cat-2', 'data-cat-3', 'data-cat-4', 'data-cat-5', 'data-cat-6', 'data-cat-7',
  'elevation-1', 'elevation-2', 'elevation-3',
  'family-ui', 'type-text-sm-size', 'type-text-sm-line', 'type-title-sm-weight',
  'layout-control-height', 'layout-control-height-sm', 'layout-border-hairline', 'layout-focus-ring-width',
  'space-1', 'space-2', 'space-3', 'space-4', 'radius-card', 'radius-control', 'icon-small',
] as const;

export type GridTokens = Record<(typeof gridTokenNames)[number], string>;
export type GridParams = Parameters<typeof themeQuartz.withParams>[0];

/**
 * Every parameter of the data grid theme, from resolved tokens. `px` turns a resolved length into
 * whole pixels. Row and header height are the control height of section 2.5; padding is a spacing
 * step; shadows are the elevation tokens. Nothing here is a literal colour, shadow or size.
 */
export type GridDensity = 'comfortable' | 'compact';

/** Row and header height: the control height, or in compact density the text's line height plus one step of space. */
export function gridRowHeight(t: Pick<GridTokens, 'layout-control-height' | 'type-text-sm-line' | 'space-2'>, px: (length: string) => number, density: GridDensity = 'comfortable'): number {
  return density === 'compact' ? px(t['type-text-sm-line']) + px(t['space-2']) : px(t['layout-control-height']);
}

export function gridParams(t: GridTokens, px: (length: string) => number, density: GridDensity = 'comfortable'): GridParams {
  const rowHeight = gridRowHeight(t, px, density);
  const hairline = px(t['layout-border-hairline']);
  const line = (color: string) => ({ style: 'solid' as const, width: hairline, color });
  const formula = (n: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    const color = t[`data-cat-${n}` as const];
    return {
      [`formulaToken${n}Color`]: color,
      [`formulaToken${n}Border`]: line(color),
      [`formulaToken${n}BackgroundColor`]: `color-mix(in srgb, transparent, ${color} 12%)`,
    };
  };
  return {
    // Surfaces and text
    backgroundColor: t['color-surface-raised'],
    foregroundColor: t['color-text-secondary'],
    cellTextColor: t['color-text-secondary'],
    chromeBackgroundColor: t['color-surface-sunken'],
    headerBackgroundColor: t['color-surface-sunken'],
    headerTextColor: t['color-text-muted'],
    headerFontWeight: Number(t['type-title-sm-weight']),
    borderColor: t['color-border-subtle'],
    accentColor: t['color-accent-fill'],
    // Rows
    rowHoverColor: t['color-surface-sunken'],
    selectedRowBackgroundColor: t['color-accent-tint'],
    rowBorder: line(t['color-border-subtle']),
    headerRowBorder: line(t['color-border-default']),
    columnBorder: false,
    headerColumnBorder: false,
    headerColumnResizeHandleColor: t['color-border-subtle'],
    pinnedColumnBorder: line(t['color-border-default']),
    wrapperBorderRadius: px(t['radius-card']),
    // Type and size
    fontFamily: t['family-ui'],
    fontSize: px(t['type-text-sm-size']),
    headerFontSize: px(t['type-text-sm-size']),
    rowHeight,
    headerHeight: rowHeight,
    spacing: px(t['space-2']),
    cellHorizontalPadding: px(t['space-4']),
    borderRadius: px(t['radius-control']),
    iconSize: px(t['icon-small']),
    // Scrollbars and built-in controls follow the theme's colour scheme (set on the theme root)
    browserColorScheme: 'inherit',
    // Focus
    focusShadow: { spread: px(t['layout-focus-ring-width']), color: t['color-focus-ring'] },
    // Menus, popups, dialogs, tooltips: surfaces, borders and the elevation tokens
    menuBackgroundColor: t['color-surface-overlay'],
    menuBorder: line(t['color-border-default']),
    menuTextColor: t['color-text-primary'],
    popupShadow: t['elevation-2'],
    dropdownShadow: t['elevation-2'],
    cardShadow: t['elevation-1'],
    dialogShadow: t['elevation-3'],
    dialogBorder: line(t['color-border-default']),
    cellEditingShadow: t['elevation-1'],
    cellEditingBorder: line(t['color-accent-fill']),
    dragAndDropImageShadow: t['elevation-2'],
    dragAndDropImageBorder: line(t['color-border-default']),
    tooltipBackgroundColor: t['color-surface-inverse'],
    tooltipTextColor: t['color-text-inverse'],
    tooltipBorder: line(t['color-border-default']),
    tooltipErrorBackgroundColor: t['color-signal-negative-tint'],
    tooltipErrorTextColor: t['color-signal-negative-text'],
    tooltipErrorBorder: line(t['color-signal-negative-fill']),
    // Overlays: loading and no rows
    modalOverlayBackgroundColor: `color-mix(in srgb, transparent, ${t['color-surface-sunken']} 66%)`,
    overlayLoadingBackgroundColor: `color-mix(in srgb, transparent, ${t['color-surface-raised']} 66%)`,
    rowLoadingSkeletonEffectColor: t['color-border-default'],
    // Fields, buttons, pickers and toggles in menus and filter popups
    inputBackgroundColor: t['color-surface-base'],
    inputBorder: line(t['color-border-emphasis']),
    inputTextColor: t['color-text-primary'],
    inputPlaceholderTextColor: t['color-text-muted'],
    inputIconColor: t['color-text-muted'],
    inputFocusBorder: line(t['color-accent-fill']),
    inputFocusShadow: { spread: px(t['layout-focus-ring-width']), color: t['color-focus-ring'] },
    inputDisabledBackgroundColor: t['color-surface-sunken'],
    inputDisabledTextColor: t['color-text-disabled'],
    inputDisabledBorder: line(t['color-border-subtle']),
    inputInvalidBorder: line(t['color-signal-negative-fill']),
    inputInvalidTextColor: t['color-signal-negative-text'],
    invalidColor: t['color-signal-negative-text'],
    inputHeight: px(t['layout-control-height-sm']),
    buttonBackgroundColor: t['color-surface-base'],
    buttonTextColor: t['color-text-primary'],
    buttonBorder: line(t['color-border-emphasis']),
    buttonHoverBackgroundColor: t['color-surface-sunken'],
    buttonActiveBackgroundColor: t['color-accent-tint'],
    buttonActiveBorder: line(t['color-accent-fill']),
    buttonDisabledBackgroundColor: t['color-surface-sunken'],
    buttonDisabledTextColor: t['color-text-disabled'],
    buttonDisabledBorder: line(t['color-border-subtle']),
    pickerButtonBackgroundColor: t['color-surface-base'],
    pickerButtonBorder: line(t['color-border-emphasis']),
    pickerButtonFocusBorder: line(t['color-accent-fill']),
    pickerListBackgroundColor: t['color-surface-overlay'],
    pickerListBorder: line(t['color-border-default']),
    checkboxCheckedBackgroundColor: t['color-accent-fill'],
    checkboxCheckedBorderColor: t['color-accent-fill'],
    checkboxCheckedShapeColor: t['color-text-on-accent'],
    checkboxUncheckedBackgroundColor: t['color-surface-base'],
    checkboxUncheckedBorderColor: t['color-border-emphasis'],
    checkboxIndeterminateBackgroundColor: t['color-accent-fill'],
    checkboxIndeterminateBorderColor: t['color-accent-fill'],
    checkboxIndeterminateShapeColor: t['color-text-on-accent'],
    toggleButtonOffBackgroundColor: t['color-border-emphasis'],
    toggleButtonOnBackgroundColor: t['color-accent-fill'],
    // Tabs and panels in the column menu
    tabBarBackgroundColor: t['color-surface-sunken'],
    tabBarBorder: line(t['color-border-default']),
    tabTextColor: t['color-text-muted'],
    tabHoverTextColor: t['color-text-primary'],
    tabSelectedTextColor: t['color-accent-text'],
    tabSelectedUnderlineColor: t['color-accent-fill'],
    tabSelectedBackgroundColor: t['color-surface-overlay'],
    tabSelectedBorderColor: t['color-border-default'],
    // Colours of features this system does not use; still drawn from tokens so no default can render
    findMatchColor: t['color-text-primary'],
    findMatchBackgroundColor: t['color-accent-tint'],
    findActiveMatchColor: t['color-text-on-accent'],
    findActiveMatchBackgroundColor: t['color-accent-fill'],
    cellBatchEditTextColor: t['color-text-primary'],
    cellBatchEditBackgroundColor: t['color-accent-tint'],
    rowBatchEditBackgroundColor: t['color-accent-tint'],
    rangeSelectionChartBackgroundColor: t['color-accent-tint'],
    rangeSelectionChartCategoryBackgroundColor: t['color-accent-tint'],
    advancedFilterBuilderJoinPillColor: t['color-accent-tint'],
    advancedFilterBuilderColumnPillColor: t['color-accent-tint'],
    advancedFilterBuilderOptionPillColor: t['color-accent-tint'],
    advancedFilterBuilderValuePillColor: t['color-accent-tint'],
    valueChangeDeltaUpColor: t['color-signal-positive-text'],
    valueChangeDeltaDownColor: t['color-signal-negative-text'],
    valueChangeValueHighlightBackgroundColor: t['color-accent-tint'],
    ...formula(1), ...formula(2), ...formula(3), ...formula(4), ...formula(5), ...formula(6), ...formula(7),
  } as GridParams;
}
