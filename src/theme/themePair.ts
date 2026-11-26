import { themePolarity, type ThemeName } from '../generated/tokens';

/** The two themes a product offers its readers: one dark, one light. */
export type ThemePair = readonly [ThemeName, ThemeName];

/** What a product offers when it does not say. */
export const defaultThemePair: ThemePair = ['night', 'tidewater'];

/** The pair itself, after checking that it holds one dark and one light theme. */
export function checkThemePair(pair: ThemePair): ThemePair {
  // Configuration can arrive as JSON or from untyped code: the pair is exactly two names, and each is a theme the system has.
  if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`SynThemeProvider: themes must be exactly two theme names, got ${JSON.stringify(pair)}`);
  const [first, second] = pair;
  const known = (name: unknown) => typeof name === 'string' && Object.hasOwn(themePolarity, name);
  if (!known(first) || !known(second)) throw new Error(`SynThemeProvider: unknown theme in themes [${pair.join(', ')}]`);
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

/** A choice is `system` or one of the offered themes. */
export type PairChoice = ThemeName | 'system';
export const isPairChoice = (pair: ThemePair, value: unknown): value is PairChoice => value === 'system' || isOffered(pair, value);

/**
 * The choice in force. A choice that is not on offer (the pair changed, or the stored value was never on offer)
 * gives way to the default when that is on offer, and to `system` otherwise.
 */
export function resolveChoice(pair: ThemePair, chosen: unknown, defaultChoice: unknown): PairChoice {
  if (isPairChoice(pair, chosen)) return chosen;
  return isPairChoice(pair, defaultChoice) ? defaultChoice : 'system';
}

/** The theme in force: the forced theme, which must be one of the pair, or what the choice and the colour preference give. */
export function resolveTheme(pair: ThemePair, forced: ThemeName | undefined, choice: PairChoice, prefersDark: boolean): ThemeName {
  if (forced !== undefined) {
    if (!isOffered(pair, forced)) throw new Error(`SynThemeProvider: theme "${forced}" is not one of themes [${pair.join(', ')}]`);
    return forced;
  }
  return choice === 'system' ? systemThemeFor(pair, prefersDark) : choice;
}
