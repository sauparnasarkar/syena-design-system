import type { ReactNode } from 'react';
import { Icon, type IconProps } from '../Icon/Icon';
import styles from './Tag.module.css';

export type TagColor = 'neutral' | 'accent' | 'positive' | 'negative' | 'caution';

export interface TagProps {
  color?: TagColor;
  size?: 'default' | 'small';
  children: ReactNode;
}

// Signal tags carry an icon as well as text, so colour is never the only carrier.
const signalIcon: Partial<Record<TagColor, IconProps['name']>> = { positive: 'check', negative: 'close', caution: 'warning' };

export function Tag({ color = 'neutral', size = 'default', children }: TagProps) {
  const icon = signalIcon[color];
  return (
    <span className={[styles.tag, styles[color], size === 'small' ? styles.small : ''].filter(Boolean).join(' ')}>
      {icon ? <Icon name={icon} size="small" /> : null}
      {children}
    </span>
  );
}
