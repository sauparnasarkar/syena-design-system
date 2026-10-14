// Simple stroke glyphs used by the specimens only. Size comes from the icon tokens, in CSS.
import styles from './Glyph.module.css';

const paths: Record<string, string> = {
  overview: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  country: 'M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  historical: 'M4 4v16h16M7 15l4-4 3 3 5-6',
  forecasts: 'M4 18l5-6 4 3 7-9M16 6h4v4',
  scenarios: 'M6 4v6a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4M6 4l-2 2M6 4l2 2M18 18l-2-2M18 18l-2 2',
  explorer: 'M4 5h16v14H4zM4 10h16M10 5v14',
  ask: 'M5 5h14v10H10l-5 4z',
  collapse: 'M15 5l-7 7 7 7',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  info: 'M12 8v.01M12 11v6M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0',
  warning: 'M12 4l9 16H3zM12 10v4M12 17v.01',
  chevron: 'M6 9l6 6 6-6',
  table: 'M4 6h16M4 12h16M4 18h16',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  filters: 'M4 6h16M7 12h10M10 18h4',
  switcher: 'M7 4v16M7 4L4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3',
};

export function Glyph({ name, size = 'medium' }: { name: keyof typeof paths | string; size?: 'small' | 'medium' | 'large' }) {
  return (
    <svg className={`${styles.glyph} ${styles[size]}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
