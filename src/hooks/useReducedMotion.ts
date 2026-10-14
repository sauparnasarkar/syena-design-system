import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

/** True when the reader prefers reduced motion; updates when the preference changes. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
