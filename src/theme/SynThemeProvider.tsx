import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { themes, type ThemeName } from '../generated/tokens';
import { resolveToken } from './resolveToken';

export type ThemeChoice = ThemeName | 'system';
export const themeNames = Object.keys(themes) as ThemeName[];

/** The theme used for each system colour preference. */
const systemTheme: Record<'dark' | 'light', ThemeName> = { dark: 'night', light: 'tidewater' };
const query = '(prefers-color-scheme: dark)';

export interface ThemeContextValue {
  /** The theme in force. */
  theme: ThemeName;
  /** What the reader chose: a theme, or `system`. */
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
  /** The element that carries `data-syn-theme`; null until the provider has mounted. */
  scope: HTMLElement | null;
  /** Calls back after the theme in force has been applied to the DOM. */
  subscribe: (notify: () => void) => () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isChoice = (value: unknown): value is ThemeChoice => value === 'system' || themeNames.includes(value as ThemeName);

function readStored(key: string | null): ThemeChoice | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(key);
    return isChoice(stored) ? stored : null;
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

const systemPreference = (): ThemeName =>
  typeof window !== 'undefined' && window.matchMedia(query).matches ? systemTheme.dark : systemTheme.light;

export interface SynThemeProviderProps {
  /** Forces a theme and ignores the stored choice. */
  theme?: ThemeName;
  /** The choice used when nothing is stored. */
  defaultChoice?: ThemeChoice;
  /** Where the choice is remembered; `null` turns remembering off. */
  storageKey?: string | null;
  /** Also set `data-syn-theme` on the document element, so page background and portals follow the theme. */
  syncDocument?: boolean;
  onThemeChange?: (theme: ThemeName) => void;
  children: ReactNode;
}

export function SynThemeProvider({ theme: forced, defaultChoice = 'system', storageKey = 'syn-theme', syncDocument = true, onThemeChange, children }: SynThemeProviderProps) {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => readStored(storageKey) ?? defaultChoice);
  const [system, setSystem] = useState<ThemeName>(systemPreference);
  const [scope, setScope] = useState<HTMLElement | null>(null);
  const listeners = useRef(new Set<() => void>());

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setSystem(media.matches ? systemTheme.dark : systemTheme.light);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const theme: ThemeName = forced ?? (choice === 'system' ? system : choice);

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
    setChoiceState(next);
    writeStored(storageKey, next);
  }, [storageKey]);

  const value = useMemo(() => ({ theme, choice, setChoice, scope, subscribe }), [theme, choice, setChoice, scope, subscribe]);

  return (
    <ThemeContext.Provider value={value}>
      {/* The wrapper carries the attribute in the commit, so child layout effects already see the new theme. */}
      <div ref={setScope} data-syn-theme={theme} style={{ display: 'contents' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

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
