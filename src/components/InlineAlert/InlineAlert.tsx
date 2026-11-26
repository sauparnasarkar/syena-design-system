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
  /** `inline` sits within a card or section; `page` runs the full width of the content and stays until dismissed or resolved. */
  placement?: 'inline' | 'page';
  /** One or two buttons after the message. */
  actions?: ReactNode;
}

const icon: Record<AlertVariant, IconProps['name']> = { default: 'info', warning: 'warning', error: 'error' };

/** A message inside the flow. Errors are announced at once; the others politely. The icon and the text carry the meaning, not the colour. */
export function InlineAlert({ variant = 'default', title, children, onDismiss, placement = 'inline', actions }: InlineAlertProps) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={[styles.alert, styles[variant], placement === 'page' ? styles.page : '', actions ? styles.hasActions : ''].filter(Boolean).join(' ')}>
      <Icon name={icon[variant]} className={styles.icon} />
      <p className={styles.message}>
        {title ? <span className={styles.title}>{title}. </span> : null}
        {children}
      </p>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
      {onDismiss ? <Button variant="ghost" size="small" icon="close" aria-label="Dismiss" onClick={onDismiss} /> : null}
    </div>
  );
}
