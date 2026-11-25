/**
 * The declarations a stylesheet applies to `element` while it is hovered. A synthetic pointer does not
 * set the browser's `:hover`, so a story checks the rule itself: which properties it sets, and to what.
 */
export function hoverStyle(element: Element): CSSStyleDeclaration | null {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes(':hover')) continue;
      for (const selector of rule.selectorText.split(',')) {
        const plain = selector.replace(/:hover/g, '').trim();
        try { if (plain && element.matches(plain)) return rule.style; } catch { /* a selector the browser cannot match here */ }
      }
    }
  }
  return null;
}
