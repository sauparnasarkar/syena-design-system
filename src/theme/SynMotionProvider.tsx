import { createContext, useLayoutEffect, type ReactNode } from 'react';

/** What the reader chose: follow the device (`system`), or force reduced (`reduce`) or full (`full`) motion. */
export type MotionChoice = 'system' | 'reduce' | 'full';

/** The forced value, or null where nothing is forced: the default, so components outside a provider read only the device. */
export const MotionContext = createContext<'reduce' | 'full' | null>(null);

export interface SynMotionProviderProps {
  /** The reader's choice. `system` (the default) leaves the device in charge. */
  choice?: MotionChoice;
  children: ReactNode;
}

/**
 * Lets an app override the device's reduced-motion preference. `useReducedMotion` and `scrollToJumpTarget` follow it, and so does
 * the stylesheet's own rule that stops transitions and animations, through `data-syn-motion` on the document element. Without a
 * provider nothing changes: the device's preference decides.
 */
export function SynMotionProvider({ choice = 'system', children }: SynMotionProviderProps) {
  const forced = choice === 'system' ? null : choice;
  useLayoutEffect(() => {
    if (!forced) return undefined;
    document.documentElement.setAttribute('data-syn-motion', forced);
    return () => document.documentElement.removeAttribute('data-syn-motion');
  }, [forced]);
  return <MotionContext.Provider value={forced}>{children}</MotionContext.Provider>;
}
