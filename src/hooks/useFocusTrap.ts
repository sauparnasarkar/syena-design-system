import { useEffect, useRef, type RefObject } from 'react';

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The traps that are active, the most recent last. Only the topmost one answers the keyboard, so an overlay opened from another closes alone. */
const openTraps: symbol[] = [];

/**
 * While `active`, keeps Tab inside `container`, moves focus into it on activation, closes on
 * Escape, and returns focus to the element that had it before. With several traps active (an
 * overlay opened from another) only the topmost handles Escape and Tab.
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
    const id = Symbol('focus trap');
    openTraps.push(id);
    const previous = document.activeElement as HTMLElement | null;
    // Only controls that are rendered: one inside hidden content cannot take focus, and a wrap onto it would leave focus where it was.
    const items = () => [...root.querySelectorAll<HTMLElement>(focusable)].filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
    (items()[0] ?? root).focus();
    const onKey = (event: KeyboardEvent) => {
      if (openTraps[openTraps.length - 1] !== id) return;
      if (event.key === 'Escape') { escape.current?.(); return; }
      if (event.key !== 'Tab') return;
      const list = items();
      if (!list.length) { event.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      const here = document.activeElement as HTMLElement | null;
      if (here && !list.includes(here)) {
        // Focus is on the container, on something that is not a tab stop inside it, or outside it: step to the neighbouring tab stop in page order, or wrap.
        event.preventDefault();
        const inside = root.contains(here);
        const next = inside ? list.findIndex((el) => here.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) : -1;
        const target = event.shiftKey ? (next === -1 ? last : list[next - 1] ?? last) : (next === -1 ? first : list[next]);
        target.focus();
        return;
      }
      if (event.shiftKey && here === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && here === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const at = openTraps.indexOf(id);
      if (at !== -1) openTraps.splice(at, 1);
      previous?.focus?.();
    };
  }, [active, container]);
}
