import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Icon, type IconProps } from '../Icon/Icon';
import styles from './InlineAlert.module.css';

export type AlertVariant = 'default' | 'warning' | 'error';

export interface InlineAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  /** Adds a close button. */
  onDismiss?: () => void;
}

const icon: Record<AlertVariant, IconProps['name']> = { default: 'info', warning: 'warning', error: 'error' };

/** A message inside the flow. Errors are announced at once; the others politely. The icon and the text carry the meaning, not the colour. */
export function InlineAlert({ variant = 'default', title, children, onDismiss }: InlineAlertProps) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={[styles.alert, styles[variant]].join(' ')}>
      <Icon name={icon[variant]} className={styles.icon} />
      <p className={styles.message}>
        {title ? <span className={styles.title}>{title}. </span> : null}
        {children}
      </p>
      {onDismiss ? <Button variant="ghost" size="small" icon="close" aria-label="Dismiss" onClick={onDismiss} /> : null}
    </div>
  );
}
