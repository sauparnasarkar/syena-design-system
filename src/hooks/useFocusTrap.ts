import { useEffect, type RefObject } from 'react';

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While `active`, keeps Tab inside `container`, moves focus into it on activation, closes on
 * Escape, and returns focus to the element that had it before.
 */
export function useFocusTrap(container: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  useEffect(() => {
    const root = container.current;
    if (!active || !root) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => [...root.querySelectorAll<HTMLElement>(focusable)];
    (items()[0] ?? root).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onEscape?.(); return; }
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
  }, [active, container, onEscape]);
}
