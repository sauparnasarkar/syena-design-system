import { cloneElement, useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useOptionalSynTheme } from '../../theme/SynThemeProvider';
import { useDialogOwner } from '../Modal/dialogOwner';
import { useAnchoredPlacement } from '../Popover/useAnchoredPlacement';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** The explanation. Short: a tooltip never holds interactive content. */
  label: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Milliseconds before a hover opens it. Defaults to the `motion-base` duration, which is zero under reduced motion. */
  delay?: number;
  /** One focusable element that exists to carry the explanation (an info icon or a focusable term), not a control that acts or navigates. */
  children: ReactElement<Record<string, unknown>>;
}

/** How long the pointer may be away from both the trigger and the bubble before the bubble closes, so it can move from one to the other. */
const GRACE = 100;

const motionBase = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--syn-motion-base')) || 0;

/** A short explanation of a term or figure, on hover and keyboard focus (on touch, a tap opens it and the next tap closes it). */
export function Tooltip({ label, placement = 'top', delay, children }: TooltipProps) {
  const id = useId();
  const bubble = useRef<HTMLDivElement>(null);
  // What the reader has asked for and how long to wait before it takes effect. The wait is an effect's timer, so a newer request replaces an older one.
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [touch, setTouch] = useState(false);
  // Escape has closed it: it stays closed until the next hover or focus.
  const [dismissed, setDismissed] = useState(false);
  // How the pointer asks for it, and how long to wait: an effect's timer, so a newer request replaces an older one.
  const [intent, setIntent] = useState<{ on: boolean; wait: number }>({ on: false, wait: 0 });
  useEffect(() => {
    const timer = window.setTimeout(() => setHover(intent.on), intent.wait);
    return () => window.clearTimeout(timer);
  }, [intent]);
  // Open while the trigger is hovered or focused (or tapped, on touch), and closed when none of them remains.
  const open = !dismissed && (hover || focus || touch);
  const [wrapper, setWrapper] = useState<HTMLElement | null>(null);
  // The trigger is the wrapper's one child; the wrapper has no box of its own.
  const anchor = (wrapper?.firstElementChild as HTMLElement | null) ?? null;
  const placed = useAnchoredPlacement(anchor, bubble, open, placement, 'center');
  const [input, setInput] = useState<'pointer' | 'touch' | 'key'>('pointer');
  const theme = useOptionalSynTheme();
  const owner = useDialogOwner();

  // Escape closes it wherever focus is, so a tooltip opened by hovering can be dismissed too. Heard first, so it closes the tooltip alone.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); setDismissed(true); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  const own = children.props as Record<string, ((event: unknown) => void) | string | undefined>;
  const forward = (name: string, event: unknown) => { const handler = own[name]; if (typeof handler === 'function') handler(event); };

  const trigger = cloneElement(children, {
    'aria-describedby': [own['aria-describedby'], id].filter(Boolean).join(' '),
    onPointerDown: (event: PointerEvent) => { forward('onPointerDown', event); setInput(event.pointerType === 'touch' ? 'touch' : 'pointer'); },
    onPointerEnter: (event: PointerEvent) => {
      forward('onPointerEnter', event);
      if (event.pointerType === 'touch') return;
      setDismissed(false);
      setIntent({ on: true, wait: delay ?? motionBase() });
    },
    onPointerLeave: (event: PointerEvent) => { forward('onPointerLeave', event); if (event.pointerType !== 'touch') setIntent({ on: false, wait: GRACE }); },
    // A tap focuses the trigger and then clicks it: only the click decides, so it opens once and the next tap closes it.
    onClick: (event: unknown) => {
      forward('onClick', event);
      if (input !== 'touch') return;
      // Open means closed by this tap, whatever opened it (a tap, or keyboard focus before it); closed means opened by it.
      if (open) { setDismissed(true); setTouch(false); } else { setDismissed(false); setTouch(true); }
    },
    onFocus: (event: FocusEvent) => { forward('onFocus', event); if (input !== 'touch') { setDismissed(false); setFocus(true); } },
    // Leaving focus closes it only if the pointer is not over the trigger or the bubble.
    onBlur: (event: FocusEvent) => { forward('onBlur', event); setFocus(false); setTouch(false); setInput('pointer'); },
    onKeyDown: (event: KeyboardEvent) => { forward('onKeyDown', event); setInput('key'); },
  });

  return (
    <>
      <span ref={setWrapper} style={{ display: 'contents' }}>{trigger}</span>
      {typeof document !== 'undefined' ? createPortal(
        <div data-syn-theme={theme?.theme} data-syn-owner={owner ?? undefined} style={{ display: 'contents' }}>
          <div
            ref={bubble}
            id={id}
            role="tooltip"
            hidden={!open}
            data-syn-side={placed?.side ?? placement}
            className={styles.bubble}
            // The pointer may move onto the bubble without closing it.
            onPointerEnter={() => setIntent({ on: true, wait: 0 })}
            onPointerLeave={() => setIntent({ on: false, wait: GRACE })}
            style={{ top: placed?.top ?? 0, left: placed?.left ?? 0, maxWidth: placed ? `${placed.maxWidth}px` : undefined, maxHeight: placed ? `${placed.maxHeight}px` : undefined, overflowY: 'auto', visibility: placed ? 'visible' : 'hidden' }}
          >
            {label}
            <span className={styles.arrow} style={placed ? (placed.side === 'top' || placed.side === 'bottom' ? { left: placed.anchorOffset } : { top: placed.anchorOffset }) : undefined} />
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
