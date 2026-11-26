import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useOptionalSynTheme } from '../../theme/SynThemeProvider';
import { Button } from '../Button/Button';
import { DialogOwner } from './dialogOwner';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  /** Closes the dialog: called by the close button, Escape and a click on the scrim. Without it the dialog has none of those. */
  onClose?: () => void;
  title: string;
  size?: 'default' | 'small';
  /** A footer slot at the trailing edge, for buttons. */
  actions?: ReactNode;
  children: ReactNode;
}

/** The wrappers of the open dialogs, in the order they opened: the last is topmost and the only one the reader can use. */
const dialogs: { element: HTMLElement; id: string }[] = [];
/** The elements this module made inert, so it never lifts an inert that something else set. */
const marked = new WeakSet<Element>();
let watcher: MutationObserver | null = null;

/** Everything in the body is inert except the topmost dialog and the portals that dialog owns (its tooltips, its popovers). */
function applyInert() {
  const top = dialogs[dialogs.length - 1];
  for (const child of Array.from(document.body.children)) {
    const live = !top || child === top.element || child.contains(top.element) || child.getAttribute('data-syn-owner') === top.id;
    if (live) {
      if (marked.has(child)) { child.removeAttribute('inert'); marked.delete(child); }
    } else if (!child.hasAttribute('inert')) {
      child.setAttribute('inert', '');
      marked.add(child);
    }
  }
}

function openDialog(element: HTMLElement, id: string) {
  dialogs.push({ element, id });
  // Anything added to the body while a dialog is open (a portal mounted later) is made inert too.
  if (!watcher) { watcher = new MutationObserver(applyInert); watcher.observe(document.body, { childList: true }); }
  applyInert();
}

function closeDialog(element: HTMLElement) {
  const at = dialogs.findIndex((dialog) => dialog.element === element);
  if (at !== -1) dialogs.splice(at, 1);
  applyInert();
  if (!dialogs.length) { watcher?.disconnect(); watcher = null; }
}

/**
 * While `active`, the rest of the page is inert (not focusable and hidden from assistive technology), which a Tab trap and
 * `aria-modal` do not themselves guarantee. Several dialogs share one manager: only the topmost is live, the page stays inert
 * until the last one closes, and the page is live again before the trap returns focus to the control that opened the dialog.
 */
function useInertBackground(owner: RefObject<HTMLElement | null>, id: string, active: boolean) {
  useEffect(() => {
    const own = owner.current;
    if (!active || !own) return undefined;
    openDialog(own, id);
    return () => closeDialog(own);
  }, [owner, id, active]);
}

/** A dialog that interrupts the page. Below the compact breakpoint it is a full-height sheet. */
export function Modal({ open, onClose, title, size = 'default', actions, children }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const ownerId = useId();
  const sheet = useIsMobile();
  const theme = useOptionalSynTheme();
  // Declared before the trap: the page is made live again before the trap returns focus to the control that opened the dialog.
  useInertBackground(wrapper, ownerId, open);
  useFocusTrap(panel, open, onClose);
  useScrollLock(panel, open);
  // The title takes focus first, so a reader hears what the dialog is before reaching its controls. Declared after the trap, which focuses the first control.
  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
  }, [open]);
  if (!open) return null;
  return createPortal(
    <DialogOwner.Provider value={ownerId}>
    <div ref={wrapper} data-syn-theme={theme?.theme} style={{ display: 'contents' }}>
      <div className={[styles.overlay, sheet ? styles.sheetOverlay : ''].filter(Boolean).join(' ')}>
        {/* The scrim is a convenience for a pointer; the keyboard has Escape and the close button. */}
        <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
        <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={[styles.dialog, size === 'small' ? styles.small : '', sheet ? styles.sheet : ''].filter(Boolean).join(' ')}>
          <header className={styles.header}>
            <h2 ref={heading} id={titleId} tabIndex={-1} className={styles.title}>{title}</h2>
            {onClose ? <Button variant="ghost" size="small" icon="close" aria-label="Close" onClick={onClose} /> : null}
          </header>
          <div className={styles.body}>{children}</div>
          {actions ? <footer className={styles.footer}>{actions}</footer> : null}
        </div>
      </div>
    </div>
    </DialogOwner.Provider>,
    document.body,
  );
}
