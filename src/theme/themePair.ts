import { themePolarity, type ThemeName } from '../generated/tokens';

/** The two themes a product offers its readers: one dark, one light. */
export type ThemePair = readonly [ThemeName, ThemeName];

/** What a product offers when it does not say. */
export const defaultThemePair: ThemePair = ['night', 'tidewater'];

/** The pair itself, after checking that it holds one dark and one light theme. */
export function checkThemePair(pair: ThemePair): ThemePair {
  const [first, second] = pair;
  if (!(first in themePolarity) || !(second in themePolarity)) throw new Error(`SynThemeProvider: unknown theme in themes [${pair.join(', ')}]`);
  if (themePolarity[first] === themePolarity[second]) throw new Error(`SynThemeProvider: themes must hold one dark and one light theme, got [${pair.join(', ')}]`);
  return pair;
}

/** The theme `system` gives for a colour preference: the dark theme of the pair for dark, the light one for light. */
export function systemThemeFor(pair: ThemePair, prefersDark: boolean): ThemeName {
  const wanted = prefersDark ? 'dark' : 'light';
  return pair.find((name) => themePolarity[name] === wanted) ?? pair[0];
}

/** Whether `value` is one of the themes in the pair. */
export const isOffered = (pair: ThemePair, value: unknown): value is ThemeName => pair.includes(value as ThemeName);
