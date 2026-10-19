import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Icon } from '../Icon/Icon';
import styles from './BackToTop.module.css';

export interface BackToTopProps {
  /** The element to return to; it receives focus. */
  targetId: string;
  /** An element the button must not cover, such as a pinned prompt bar. */
  avoidSelector?: string;
}

/** Appears after one viewport of scrolling and returns to the top of the canvas. */
export function BackToTop({ targetId, avoidSelector }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const update = () => {
      setVisible(window.scrollY > window.innerHeight);
      const avoid = avoidSelector ? document.querySelector(avoidSelector) : null;
      // Clear of whatever is pinned to the bottom, wherever it is just now: its distance from the bottom of the view, not a fixed offset.
      const pinned = [...document.querySelectorAll('[data-syn-sticky="bottom"]')].map((el) => {
        const box = el.getBoundingClientRect();
        return box.height > 0 && box.top < window.innerHeight && box.bottom > 0 ? window.innerHeight - box.top : 0;
      });
      setLift(Math.max(avoid ? avoid.getBoundingClientRect().height : 0, ...pinned));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const resized = new ResizeObserver(update);
    document.querySelectorAll('[data-syn-sticky="bottom"]').forEach((el) => resized.observe(el));
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); resized.disconnect(); };
  }, [avoidSelector]);

  if (!visible) return null;
  const go = () => {
    const target = document.getElementById(targetId);
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  };
  return (
    <button type="button" className={styles.button} style={{ insetBlockEnd: `calc(var(--syn-space-4) + ${lift}px)` }} onClick={go}>
      <Icon name="up" />
      <span className={styles.label}>Back to top</span>
    </button>
  );
}
