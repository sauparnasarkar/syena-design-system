import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { breakpointPx } from '../generated/tokens';

const query = `(max-width: ${breakpointPx.compact}px)`;
const subscribe = (notify: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener('change', notify);
  return () => m.removeEventListener('change', notify);
};

/** True below the compact breakpoint. */
export const useCompact = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);

/** Width in pixels of the element the ref is attached to. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
