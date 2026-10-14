import type { CSSProperties } from 'react';
import { iconPx, rootPx, scale } from '../../generated/tokens';
import { icons, type IconName } from './icons';
import styles from './Icon.module.css';

export type IconSize = 'small' | 'medium' | 'large';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  /** An accessible name. Icons without one are decorative and hidden from assistive technology. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

const ringPx = Math.round(parseFloat(scale.layout['focus-ring-width']) * rootPx);

export function Icon({ name, size = 'medium', title, className, style }: IconProps) {
  const Glyph = icons[name];
  const px = iconPx[size];
  const classes = [styles.icon, styles[size], className ?? ''].filter(Boolean).join(' ');
  return (
    <Glyph
      className={classes}
      style={style}
      size={px}
      // The stroke is the ring width in rendered pixels at every size.
      strokeWidth={(ringPx * 24) / px}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? 'img' : undefined}
      focusable="false"
    />
  );
}
