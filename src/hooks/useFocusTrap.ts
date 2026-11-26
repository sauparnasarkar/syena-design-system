import { useEffect, useRef, type RefObject } from 'react';

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While `active`, keeps Tab inside `container`, moves focus into it on activation, closes on
 * Escape, and returns focus to the element that had it before.
 *
 * Only activation takes focus. A re-render while the trap is active, including one that passes a new
 * `onEscape` (a shell does, every time the page it hosts changes), leaves focus where it is.
 */
export function useFocusTrap(container: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  // The latest handler, read when Escape is pressed. It is not a dependency of the effect below: callers pass a new function every render, and re-running that effect
  // would hand focus back to where it was before the trap opened and then move it into the container's first control again, mid-use.
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });
  useEffect(() => {
    const root = container.current;
    if (!active || !root) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => [...root.querySelectorAll<HTMLElement>(focusable)];
    (items()[0] ?? root).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { escape.current?.(); return; }
      if (event.key !== 'Tab') return;
      const list = items();
      if (!list.length) { event.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [active, container]);
}
