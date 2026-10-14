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
      setLift(avoid ? avoid.getBoundingClientRect().height : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [avoidSelector]);

  if (!visible) return null;
  const go = () => {
    const target = document.getElementById(targetId);
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  };
  return (
    <button type="button" className={styles.button} style={{ marginBlockEnd: lift }} onClick={go}>
      <Icon name="up" />
      <span className={styles.label}>Back to top</span>
    </button>
  );
}
