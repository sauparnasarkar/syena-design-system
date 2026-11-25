import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ThemeName } from '../generated/tokens';
import { resolveToken } from './resolveToken';
import { checkThemePair, defaultThemePair, isPairChoice, resolveChoice, resolveTheme, type ThemePair } from './themePair';

export type ThemeChoice = ThemeName | 'system';
/** The themes offered when a product does not say. */
export const themeNames: ThemeName[] = [...defaultThemePair];
export type { ThemePair };

const query = '(prefers-color-scheme: dark)';

export interface ThemeContextValue {
  /** The theme in force. */
  theme: ThemeName;
  /** The two themes on offer: one dark, one light. */
  themes: ThemePair;
  /** What the reader chose: a theme, or `system`. */
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
  /** The element that carries `data-syn-theme`; null until the provider has mounted. */
  scope: HTMLElement | null;
  /** Calls back after the theme in force has been applied to the DOM. */
  subscribe: (notify: () => void) => () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(key: string | null, pair: ThemePair): ThemeChoice | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(key);
    return isPairChoice(pair, stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStored(key: string | null, choice: ThemeChoice) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, choice);
  } catch {
    // Storage can be blocked; the choice then lasts for the session only.
  }
}

const prefersDark = (): boolean => typeof window !== 'undefined' && window.matchMedia(query).matches;

export interface SynThemeProviderProps {
  /** The two themes this product offers, one dark and one light. Defaults to `night` and `tidewater`. */
  themes?: ThemePair;
  /** Forces a theme and ignores the stored choice. */
  theme?: ThemeName;
  /** The choice used when nothing is stored; a theme that is not on offer is ignored. */
  defaultChoice?: ThemeChoice;
  /** Where the choice is remembered, one key for each product; `null` turns remembering off. A stored value that is not on offer is ignored. */
  storageKey?: string | null;
  /** Also set `data-syn-theme` on the document element, so page background and portals follow the theme. */
  syncDocument?: boolean;
  onThemeChange?: (theme: ThemeName) => void;
  children: ReactNode;
}

export function SynThemeProvider({ themes: offered = defaultThemePair, theme: forced, defaultChoice = 'system', storageKey = 'syn-theme', syncDocument = true, onThemeChange, children }: SynThemeProviderProps) {
  // The pair is compared by value, so a new array with the same two names changes nothing.
  const pairKey = offered.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pair = useMemo(() => checkThemePair(offered), [pairKey]);
  const [chosen, setChosen] = useState<ThemeChoice>(() => readStored(storageKey, pair) ?? resolveChoice(pair, defaultChoice, 'system'));
  const [dark, setDark] = useState<boolean>(prefersDark);
  const [scope, setScope] = useState<HTMLElement | null>(null);
  const listeners = useRef(new Set<() => void>());

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // A choice that is no longer on offer (the pair changed) gives way to a valid default, else to `system`.
  const choice: ThemeChoice = resolveChoice(pair, chosen, defaultChoice);
  const theme: ThemeName = resolveTheme(pair, forced, choice, dark);

  useLayoutEffect(() => {
    if (!syncDocument) return undefined;
    document.documentElement.setAttribute('data-syn-theme', theme);
    return () => document.documentElement.removeAttribute('data-syn-theme');
  }, [theme, syncDocument]);

  // Tell resolved-token readers once the new theme is in the DOM.
  useLayoutEffect(() => {
    listeners.current.forEach((notify) => notify());
  }, [theme]);

  const onChange = useRef(onThemeChange);
  useEffect(() => {
    onChange.current = onThemeChange;
  });
  useEffect(() => onChange.current?.(theme), [theme]);

  const subscribe = useCallback((notify: () => void) => {
    listeners.current.add(notify);
    return () => { listeners.current.delete(notify); };
  }, []);

  const setChoice = useCallback((next: ThemeChoice) => {
    if (!isPairChoice(pair, next)) return;
    setChosen(next);
    writeStored(storageKey, next);
  }, [storageKey, pair]);

  const value = useMemo(() => ({ theme, themes: pair, choice, setChoice, scope, subscribe }), [theme, pair, choice, setChoice, scope, subscribe]);

  return (
    <ThemeContext.Provider value={value}>
      {/* The wrapper carries the attribute in the commit, so child layout effects already see the new theme. */}
      <div ref={setScope} data-syn-theme={theme} style={{ display: 'contents' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** The theme context where there is one, else null: for a part that renders outside the provider's wrapper (a portal) and must still carry the theme. */
export const useOptionalSynTheme = () => useContext(ThemeContext);

export function useSynTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useSynTheme must be used inside SynThemeProvider');
  return value;
}

/**
 * The resolved value of a token, kept current across theme changes. It is re-read after the new
 * theme is in the DOM, so a switch never paints the previous theme's value.
 */
export function useResolvedToken(name: string) {
  const { scope, subscribe } = useSynTheme();
  return useSyncExternalStore(
    subscribe,
    () => (scope ? resolveToken(name, scope) : ''),
    () => '',
  );
}

/**
 * Several resolved tokens at once, as one object that changes only when a value does. Pass a
 * module-level array so the names are stable.
 */
export function useResolvedTokens<const Names extends readonly string[]>(names: Names) {
  const { scope, subscribe } = useSynTheme();
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (scope ? JSON.stringify(names.map((n) => resolveToken(n, scope))) : ''),
    () => '',
  );
  return useMemo(() => {
    if (!snapshot) return null;
    const values = JSON.parse(snapshot) as string[];
    return Object.fromEntries(names.map((n, i) => [n, values[i]])) as { [K in Names[number]]: string };
  }, [snapshot, names]);
}
