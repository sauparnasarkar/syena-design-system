import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
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
export function Popover({ trigger, title, children, side = 'bottom', align = 'end', width = '22.5rem', open: controlled, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [own, setOwn] = useState(defaultOpen);
  const open = controlled ?? own;
  const [placement, setPlacement] = useState<(PopoverPlacement & { maxWidth: number }) | null>(null);
  const [triggerEl, setTriggerEl] = useState<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Placed after layout and before paint, so it never shows in the wrong place; kept in place as the page moves or the panel changes size.
  const place = useCallback(() => {
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
    const seen = { left: anchor.left - origin.left, right: anchor.right - origin.left, top: anchor.top - origin.top, bottom: anchor.bottom - origin.top };
    const placed = placePopover(seen, size, viewport, side, align, GAP, MARGIN);
    const next = { ...placed, top: placed.top + origin.top, left: placed.left + origin.left, maxWidth };
    setPlacement((was) => (was && was.top === next.top && was.left === next.left && was.maxHeight === next.maxHeight && was.side === next.side && was.maxWidth === next.maxWidth ? was : next));
  }, [side, align, triggerEl]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    const resized = new ResizeObserver(place);
    if (panelRef.current) resized.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      resized.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [open, place]);

  // Focus moves into the panel once it is placed: a hidden element cannot take it.
  const placed = placement !== null;
  useEffect(() => {
    if (open && placed) panelRef.current?.focus({ preventScroll: true });
  }, [open, placed]);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (target: EventTarget | null) => !panelRef.current?.contains(target as Node) && !triggerEl?.contains(target as Node);
    // Escape inside the panel is handled by the panel itself (below), which keeps it from a drawer or rail around the trigger. This is for
    // Escape pressed with focus elsewhere, such as on the trigger, while the panel is open.
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented && !panelRef.current?.contains(event.target as Node)) close(); };
    // The trigger counts as inside: its own click toggles, and a press that closed the panel first would let that click reopen it.
    // A press, not a click, so a tap on a touch screen closes at once. Focus is not pulled back from what was pressed.
    const onPress = (event: PointerEvent) => { if (outside(event.target)) close(false); };
    const onFocusIn = (event: FocusEvent) => { if (outside(event.target)) close(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPress, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey);
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
        onKeyDown={(event) => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); close(); } }}
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
      {trigger({ ref: setTriggerEl, 'aria-expanded': open, 'aria-controls': open ? panelId : undefined, 'aria-haspopup': 'dialog', onClick: () => (open ? close(false) : setOpen(true)) }, open)}
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
