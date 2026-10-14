import type { ReactNode } from 'react';
import styles from './ProductMark.module.css';

/**
 * A product mark is supplied by the consuming app: the design system ships no brand assets.
 * Either an image source or an SVG node, always with an accessible name. There is no default.
 */
export type ProductMarkSource =
  | { src: string; name: string; node?: never }
  | { node: ReactNode; name: string; src?: never };

export function ProductMark({ mark, className }: { mark: ProductMarkSource; className?: string }) {
  const classes = [styles.mark, className ?? ''].filter(Boolean).join(' ');
  if ('src' in mark && mark.src) return <img className={classes} src={mark.src} alt={mark.name} />;
  return <span className={classes} role="img" aria-label={mark.name}>{mark.node}</span>;
}
