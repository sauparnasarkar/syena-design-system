import { useSyncExternalStore } from 'react';
import { breakpointPx } from '../generated/tokens';

const query = `(max-width: ${breakpointPx.compact}px)`;
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

/** True below the compact breakpoint. False before mount, so server and first client render agree. */
export const useIsMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
