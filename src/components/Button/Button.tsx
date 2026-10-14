import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { Icon, type IconProps } from '../Icon/Icon';
import controls from '../controls.module.css';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  /** Shows progress, keeps the label and ignores activation. */
  isLoading?: boolean;
  icon?: IconProps['name'];
  trailingIcon?: IconProps['name'];
};

/** A button has a visible label, or an accessible name when it is icon-only. */
export type ButtonProps = Base & ({ children: ReactNode } | { children?: undefined; 'aria-label': string });

export function Button({ variant = 'secondary', size = 'default', isLoading = false, icon, trailingIcon, children, className, disabled, onClick, type = 'button', ...rest }: ButtonProps) {
  const classes = [controls.box, styles.button, styles[variant], size === 'small' ? controls.small : '', children ? '' : styles.iconOnly, isLoading ? styles.loading : '', className ?? ''].filter(Boolean).join(' ');
  const handle = (event: MouseEvent<HTMLButtonElement>) => { if (isLoading) { event.preventDefault(); return; } onClick?.(event); };
  const iconSize = size === 'small' ? 'small' : 'medium';
  return (
    <button type={type} className={classes} disabled={disabled} aria-busy={isLoading || undefined} onClick={handle} {...rest}>
      {isLoading && icon ? <span className={styles.spinner} aria-hidden="true" /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children ? <span>{children}</span> : null}
      {trailingIcon ? <Icon name={trailingIcon} size={iconSize} /> : null}
    </button>
  );
}
