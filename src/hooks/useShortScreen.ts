import { useSyncExternalStore } from 'react';
import { shortScreenQuery } from '../lib/shortScreen';

const subscribe = (notify: () => void) => {
  const media = window.matchMedia(shortScreenQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

/** True on a short, narrow screen (see `shortScreenQuery`). False before mount, so server and first client render agree. */
export const useShortScreen = () => useSyncExternalStore(subscribe, () => window.matchMedia(shortScreenQuery).matches, () => false);
