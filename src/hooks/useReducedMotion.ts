import { useContext, useSyncExternalStore } from 'react';
import { MotionContext } from '../theme/SynMotionProvider';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

/**
 * True when motion should be reduced: what the app forced with a SynMotionProvider (Reduce or Full), else the reader's own
 * preference. Updates when either changes. With no provider it reads only the preference.
 */
export const useReducedMotion = () => {
  const forced = useContext(MotionContext);
  const device = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
  return forced === null ? device : forced === 'reduce';
};
