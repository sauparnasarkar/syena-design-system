import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { useOptionalSynTheme } from '../../theme/SynThemeProvider';
import { Button } from '../Button/Button';
import { Text } from '../Text/Text';
import { placePopover, type PopoverAlign, type PopoverPlacement, type PopoverSide } from './position';
import styles from './Popover.module.css';

export interface PopoverTriggerProps {
  ref: Ref<HTMLButtonElement>;
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  'aria-haspopup': 'dialog';
  onClick: () => void;
  onKeyDown: (event: ReactKeyboardEvent) => void;
}

export interface PopoverProps {
  /** Draws the trigger. Spread the props onto a button: they carry its ref, `aria-expanded`, `aria-controls` and the click that toggles the panel. */
  trigger: (props: PopoverTriggerProps, open: boolean) => ReactNode;
  /** The panel's heading, which also names it. */
  title: string;
  /** The panel's content. A function is given `close`, for a control inside that should dismiss the panel. */
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  /** The side of the trigger the panel prefers. It goes to the opposite side where that fits better. */
  side?: PopoverSide;
  /** Which edges line up: `end` lines the panel's far edge (right, or bottom beside the trigger) with the trigger's. */
  align?: PopoverAlign;
  /** An element the panel must clear on the side it opens (a rail the trigger sits in): it starts beyond that element's edge, not beside the trigger. */
  clearOf?: () => Element | null;
  /** The panel's width, in CSS; it never exceeds the screen. */
  width?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const GAP = 8;
const MARGIN = 8;

/**
 * A panel anchored to a trigger, for a few settings or actions that do not deserve a page. It is not modal: Escape, a press outside it,
 * or focus leaving it closes it. Escape and the close button return focus to the trigger. It sits above the page (in a portal, so a
 * narrow rail does not clip it), on the side of the trigger with room, and scrolls inside when the screen is short.
 */
export function Popover({ trigger, title, children, side = 'bottom', align = 'end', clearOf, width = '22.5rem', open: controlled, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const [placement, setPlacement] = useState<(PopoverPlacement & { maxWidth: number }) | null>(null);
  const [triggerEl, setTriggerEl] = useState<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Set once the reader has pressed or typed inside the panel: from then on a change in the panel's own size does not move it (see `place`).
  const used = useRef(false);
  const panelId = useId();
  const titleId = useId();
  const theme = useOptionalSynTheme();

  const setOpen = useCallback((next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
  }, [controlled, onOpenChange]);
  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    setPlacement(null);
    if (returnFocus) triggerEl?.focus();
  }, [setOpen, triggerEl]);

  // Read when the panel is placed, not a reason to place it again: a caller's inline function is a new one every render.
  const clearOfRef = useRef(clearOf);
  useLayoutEffect(() => { clearOfRef.current = clearOf; });

  // Placed after layout and before paint, so it never shows in the wrong place; kept in place as the page moves or the panel changes size.
  const place = useCallback((fromContent = false) => {
    // The panel grew or shrank (a list opened inside it, say) after the reader started using it: it stays where it is, within the room it
    // was given, and scrolls inside. Moving it out from under their pointer would be worse than a scrollbar. Before that, and for a change
    // of the window or the page, it is placed afresh.
    if (fromContent && used.current) return;
    const anchor = triggerEl?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    // What the reader can see: with the page pinch-zoomed it is the visual viewport, which is smaller than the layout viewport and may be scrolled within it.
    const view = window.visualViewport;
    const viewport = { width: view?.width ?? window.innerWidth, height: view?.height ?? window.innerHeight };
    const origin = { left: view?.offsetLeft ?? 0, top: view?.offsetTop ?? 0 };
    const maxWidth = Math.max(0, viewport.width - 2 * MARGIN);
    // Measured at its natural height, not the one it was last held to, and at the width it will have.
    const held = panel.style.maxHeight;
    panel.style.maxHeight = '';
    panel.style.maxWidth = `${maxWidth}px`;
    const size = { width: panel.offsetWidth, height: panel.scrollHeight + (panel.offsetHeight - panel.clientHeight) };
    panel.style.maxHeight = held;
    // The edge the panel opens from: the trigger's own, or (clearOf) the far edge of the element around it, so it never covers that element.
    const around = clearOfRef.current?.()?.getBoundingClientRect();
    const edge = {
      left: side === 'left' && around ? Math.min(anchor.left, around.left) : anchor.left,
      right: side === 'right' && around ? Math.max(anchor.right, around.right) : anchor.right,
      top: side === 'top' && around ? Math.min(anchor.top, around.top) : anchor.top,
      bottom: side === 'bottom' && around ? Math.max(anchor.bottom, around.bottom) : anchor.bottom,
    };
    const seen = { left: edge.left - origin.left, right: edge.right - origin.left, top: anchor.top - origin.top, bottom: anchor.bottom - origin.top };
    if (side === 'top' || side === 'bottom') { seen.top = edge.top - origin.top; seen.bottom = edge.bottom - origin.top; seen.left = anchor.left - origin.left; seen.right = anchor.right - origin.left; }
    const placed = placePopover(seen, size, viewport, side, align, GAP, MARGIN);
    const next = { ...placed, top: placed.top + origin.top, left: placed.left + origin.left, maxWidth };
    setPlacement((was) => (was && was.top === next.top && was.left === next.left && was.maxHeight === next.maxHeight && was.side === next.side && was.maxWidth === next.maxWidth ? was : next));
  }, [side, align, triggerEl]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    used.current = false;
    place();
    const resized = new ResizeObserver(() => place(true));
    if (panelRef.current) resized.observe(panelRef.current);
    const again = () => place();
    // The page or an ancestor scrolling moves the trigger, so the panel follows; the panel's own content scrolling does not.
    const scrolled = (event: Event) => { if (!panelRef.current?.contains(event.target as Node)) place(); };
    window.addEventListener('resize', again);
    window.addEventListener('scroll', scrolled, true);
    window.visualViewport?.addEventListener('resize', again);
    window.visualViewport?.addEventListener('scroll', again);
    return () => {
      resized.disconnect();
      window.removeEventListener('resize', again);
      window.removeEventListener('scroll', scrolled, true);
      window.visualViewport?.removeEventListener('resize', again);
      window.visualViewport?.removeEventListener('scroll', again);
    };
  }, [open, place]);

  // The reader has started using the panel: it keeps the place and the height it has now, so what grows inside it scrolls inside it.
  const settle = () => {
    if (used.current) return;
    used.current = true;
    const height = panelRef.current?.offsetHeight;
    if (height) setPlacement((was) => (was ? { ...was, maxHeight: Math.min(was.maxHeight, height) } : was));
  };

  // Focus moves into the panel once it is placed: a hidden element cannot take it.
  const placed = placement !== null;
  useEffect(() => {
    if (open && placed) panelRef.current?.focus({ preventScroll: true });
  }, [open, placed]);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (target: EventTarget | null) => !panelRef.current?.contains(target as Node) && !triggerEl?.contains(target as Node);
    // The trigger counts as inside: its own click toggles, and a press that closed the panel first would let that click reopen it.
    // A press, not a click, so a tap on a touch screen closes at once. Focus is not pulled back from what was pressed.
    const onPress = (event: PointerEvent) => { if (outside(event.target)) close(false); };
    const onFocusIn = (event: FocusEvent) => { if (outside(event.target)) close(false); };
    document.addEventListener('pointerdown', onPress, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPress, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, close, triggerEl]);

  const panel = open ? (
    <div data-syn-theme={theme?.theme} style={{ display: 'contents' }}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-syn-popover=""
        className={styles.panel}
        // A control inside that handles Escape itself (an open list) has already said so with preventDefault, and stopped it; then only it closes.
        // Otherwise the panel closes and the Escape goes no further, so it does not also close a drawer or an opened rail around the trigger.
        onPointerDown={settle}
        onKeyDown={(event) => { settle(); if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); close(); } }}
        style={{ width, maxWidth: placement ? `${placement.maxWidth}px` : `calc(100vw - ${2 * MARGIN}px)`, top: placement?.top ?? 0, left: placement?.left ?? 0, maxHeight: placement ? placement.maxHeight : undefined, visibility: placement ? 'visible' : 'hidden' }}
      >
        <div className={styles.header}>
          <Text as="h2" type="title-sm" id={titleId}>{title}</Text>
          <Button variant="ghost" size="small" icon="close" aria-label={`Close ${title.toLowerCase()}`} onClick={() => close()} />
        </div>
        <div className={styles.body}>{typeof children === 'function' ? children({ close: () => close() }) : children}</div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {trigger({
        ref: setTriggerEl, 'aria-expanded': open, 'aria-controls': open ? panelId : undefined, 'aria-haspopup': 'dialog',
        onClick: () => (open ? close(false) : setOpen(true)),
        // Escape with focus on the trigger, which keeps the panel open (it is not a press outside): close it here and go no further, so a drawer or an opened rail around the trigger does not close too.
        onKeyDown: (event) => { if (open && event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); close(); } },
      }, open)}
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
