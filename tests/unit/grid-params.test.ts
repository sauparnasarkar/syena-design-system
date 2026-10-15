import { describe, expect, it } from 'vitest';
import { gridParams, gridTokenNames, type GridTokens } from '../../src/grid/params';

const tokens = Object.fromEntries(gridTokenNames.map((n) => [n, `<${n}>`])) as GridTokens;
const params = gridParams(tokens, (length) => length.length);

// The parameters the data grid theme sets. Adding or removing one is a deliberate change to this list.
const expected = [
  'accentColor',
  'advancedFilterBuilderColumnPillColor',
  'advancedFilterBuilderJoinPillColor',
  'advancedFilterBuilderOptionPillColor',
  'advancedFilterBuilderValuePillColor',
  'backgroundColor',
  'borderColor',
  'borderRadius',
  'buttonActiveBackgroundColor',
  'buttonActiveBorder',
  'buttonBackgroundColor',
  'buttonBorder',
  'buttonDisabledBackgroundColor',
  'buttonDisabledBorder',
  'buttonDisabledTextColor',
  'buttonHoverBackgroundColor',
  'buttonTextColor',
  'cardShadow',
  'cellBatchEditBackgroundColor',
  'cellBatchEditTextColor',
  'cellEditingBorder',
  'cellEditingShadow',
  'browserColorScheme',
  'cellHorizontalPadding',
  'cellTextColor',
  'checkboxCheckedBackgroundColor',
  'checkboxCheckedBorderColor',
  'checkboxCheckedShapeColor',
  'checkboxIndeterminateBackgroundColor',
  'checkboxIndeterminateBorderColor',
  'checkboxIndeterminateShapeColor',
  'checkboxUncheckedBackgroundColor',
  'checkboxUncheckedBorderColor',
  'chromeBackgroundColor',
  'columnBorder',
  'dialogBorder',
  'dialogShadow',
  'dragAndDropImageBorder',
  'dragAndDropImageShadow',
  'dropdownShadow',
  'findActiveMatchBackgroundColor',
  'findActiveMatchColor',
  'findMatchBackgroundColor',
  'findMatchColor',
  'focusShadow',
  'fontFamily',
  'fontSize',
  'foregroundColor',
  'formulaToken1BackgroundColor',
  'formulaToken1Border',
  'formulaToken1Color',
  'formulaToken2BackgroundColor',
  'formulaToken2Border',
  'formulaToken2Color',
  'formulaToken3BackgroundColor',
  'formulaToken3Border',
  'formulaToken3Color',
  'formulaToken4BackgroundColor',
  'formulaToken4Border',
  'formulaToken4Color',
  'formulaToken5BackgroundColor',
  'formulaToken5Border',
  'formulaToken5Color',
  'formulaToken6BackgroundColor',
  'formulaToken6Border',
  'formulaToken6Color',
  'formulaToken7BackgroundColor',
  'formulaToken7Border',
  'formulaToken7Color',
  'headerBackgroundColor',
  'headerColumnBorder',
  'headerColumnResizeHandleColor',
  'headerFontSize',
  'headerFontWeight',
  'headerHeight',
  'headerRowBorder',
  'headerTextColor',
  'iconSize',
  'inputBackgroundColor',
  'inputBorder',
  'inputDisabledBackgroundColor',
  'inputDisabledBorder',
  'inputDisabledTextColor',
  'inputFocusBorder',
  'inputFocusShadow',
  'inputHeight',
  'inputIconColor',
  'inputInvalidBorder',
  'inputInvalidTextColor',
  'inputPlaceholderTextColor',
  'inputTextColor',
  'invalidColor',
  'menuBackgroundColor',
  'menuBorder',
  'menuTextColor',
  'modalOverlayBackgroundColor',
  'overlayLoadingBackgroundColor',
  'pickerButtonBackgroundColor',
  'pickerButtonBorder',
  'pickerButtonFocusBorder',
  'pickerListBackgroundColor',
  'pickerListBorder',
  'pinnedColumnBorder',
  'popupShadow',
  'rangeSelectionChartBackgroundColor',
  'rangeSelectionChartCategoryBackgroundColor',
  'rowBatchEditBackgroundColor',
  'rowBorder',
  'rowHeight',
  'rowHoverColor',
  'rowLoadingSkeletonEffectColor',
  'selectedRowBackgroundColor',
  'spacing',
  'tabBarBackgroundColor',
  'tabBarBorder',
  'tabHoverTextColor',
  'tabSelectedBackgroundColor',
  'tabSelectedBorderColor',
  'tabSelectedTextColor',
  'tabSelectedUnderlineColor',
  'tabTextColor',
  'toggleButtonOffBackgroundColor',
  'toggleButtonOnBackgroundColor',
  'tooltipBackgroundColor',
  'tooltipBorder',
  'tooltipErrorBackgroundColor',
  'tooltipErrorBorder',
  'tooltipErrorTextColor',
  'tooltipTextColor',
  'valueChangeDeltaDownColor',
  'valueChangeDeltaUpColor',
  'valueChangeValueHighlightBackgroundColor',
  'wrapperBorderRadius',
];

describe('grid theme parameters', () => {
  it('sets exactly the listed parameters', () => {
    expect(Object.keys(params).sort()).toEqual([...expected].sort());
  });

  it('draws every colour and shadow from a token', () => {
    const literal = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;
    expect(JSON.stringify(params)).not.toMatch(literal);
  });

  it('takes row and header height from the control height and padding from a spacing step', () => {
    expect(params.rowHeight).toBe('<layout-control-height>'.length);
    expect(params.headerHeight).toBe('<layout-control-height>'.length);
    expect(params.cellHorizontalPadding).toBe('<space-4>'.length);
  });

  it('draws popup, dropdown, card, dialog and drag shadows from the elevation tokens', () => {
    expect(params.popupShadow).toBe('<elevation-2>');
    expect(params.dropdownShadow).toBe('<elevation-2>');
    expect(params.cardShadow).toBe('<elevation-1>');
    expect(params.dialogShadow).toBe('<elevation-3>');
    expect(params.dragAndDropImageShadow).toBe('<elevation-2>');
  });
});
