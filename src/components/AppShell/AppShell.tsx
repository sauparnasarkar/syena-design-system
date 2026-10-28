import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Button } from '../Button/Button';
import { pinnedClearance } from '../../lib/pinnedClearance';
import { scrollToJumpTarget } from '../../lib/scrollToJumpTarget';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useShortScreen } from '../../hooks/useShortScreen';
import { ShellContext } from './ShellContext';
import styles from './AppShell.module.css';

export interface AppShellProps {
  /** The `Rail`. Shown beside the content, or in a drawer at compact widths. */
  rail: ReactNode;
  /** The `TopBar`, shown at compact widths only. */
  topBar: ReactNode;
  /** The `AnalysisBar`. Shown above the canvas, or in a sheet at compact widths. */
  analysisBar?: ReactNode;
  /** The `SourceStrip`. */
  strip: ReactNode;
  /** The canvas of modules. */
  children: ReactNode;
  footer?: ReactNode;
  navigationOpen?: boolean;
  onNavigationOpenChange?: (open: boolean) => void;
  controlsOpen?: boolean;
  onControlsOpenChange?: (open: boolean) => void;
  /** Forces compact or wide layout instead of following the viewport; for previews and tests. */
  compact?: boolean;
  skipLabel?: string;
}

function Overlay({ label, side, onClose, children }: { label: string; side: 'start' | 'top'; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, true, onClose);
  useScrollLock(panel, true);
  return (
    <div className={styles.overlay}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={side === 'start' ? styles.drawer : styles.sheet}>
        <div className={styles.overlayHeader}>
          <Button variant="ghost" size="small" icon="close" aria-label={side === 'start' ? 'Close navigation' : 'Close analysis controls'} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function AppShell({ rail, topBar, analysisBar, strip, children, footer, navigationOpen, onNavigationOpenChange, controlsOpen, onControlsOpenChange, compact: forced, skipLabel = 'Skip to content' }: AppShellProps) {
  const detected = useIsMobile();
  const compact = forced ?? detected;
  // A short, narrow screen: the rail is narrow and leaves the page's flow (see Rail), so the page makes room for it.
  const short = useShortScreen() && !compact;
  const [ownNav, setOwnNav] = useState(false);
  const [ownControls, setOwnControls] = useState(false);
  const navOpen = navigationOpen ?? ownNav;
  const ctrlOpen = controlsOpen ?? ownControls;
  // A control reached by the keyboard is scrolled into view by the browser, which does not know about the shell's pinned bars: it can come to rest under the strip at the bottom or the
  // bars at the top, hidden while it has focus. So after focus lands, a control that sits under a pinned bar is brought clear of it. (This is done by hand, not with `scroll-padding`:
  // that would also push the page about whenever focus moves to a control inside a pinned bar.) Controls inside a pinned bar, or an overlay, are left where they are.
  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      const el = event.target;
      if (!(el instanceof HTMLElement) || el.closest('[data-syn-sticky], [role="dialog"]')) return;
      requestAnimationFrame(() => {
        if (document.activeElement !== el) return;
        const box = el.getBoundingClientRect();
        // Only the bars that reach across the control: the strip spans the canvas, not the rail beside it.
        const { top, bottom } = pinnedClearance(box);
        const floor = window.innerHeight - bottom;
        // Nothing to do for something taller than the room left, or already clear.
        if (box.height > floor - top) return;
        if (box.bottom > floor) window.scrollBy({ top: box.bottom - floor + 8, behavior: 'auto' });
        else if (box.top < top) window.scrollBy({ top: box.top - top - 8, behavior: 'auto' });
      });
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);
  const state = useMemo(() => ({
    compact,
    navigationOpen: navOpen,
    controlsOpen: ctrlOpen,
    setNavigationOpen: (open: boolean) => { setOwnNav(open); onNavigationOpenChange?.(open); },
    setControlsOpen: (open: boolean) => { setOwnControls(open); onControlsOpenChange?.(open); },
  }), [compact, navOpen, ctrlOpen, onNavigationOpenChange, onControlsOpenChange]);

  return (
    <ShellContext.Provider value={state}>
      <div className={[styles.app, compact ? styles.compact : '', short ? styles.short : ''].join(' ')}>
        <nav aria-label="Skip links"><a href="#content" className={styles.skip} onClick={(event) => { event.preventDefault(); scrollToJumpTarget('content'); }}>{skipLabel}</a></nav>
        {compact ? topBar : rail}
        <div className={styles.column}>
          {compact ? null : analysisBar}
          <main id="content" tabIndex={-1} className={styles.canvas}>{children}</main>
          {strip}
          {footer}
        </div>
        {compact && navOpen ? <Overlay label="Navigation" side="start" onClose={() => state.setNavigationOpen(false)}>{rail}</Overlay> : null}
        {compact && ctrlOpen ? <Overlay label="Analysis controls" side="top" onClose={() => state.setControlsOpen(false)}>{analysisBar}</Overlay> : null}
      </div>
    </ShellContext.Provider>
  );
}
