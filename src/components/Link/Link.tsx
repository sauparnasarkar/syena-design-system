import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Link.module.css';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  href: string;
  children: ReactNode;
}

/** A link. One that opens a new tab says so, shows an external-link icon and is made safe. */
export function Link({ href, target, rel, className, children, ...rest }: LinkProps) {
  const external = target === '_blank';
  return (
    <a
      href={href}
      target={target}
      rel={external ? [...new Set(['noopener', 'noreferrer', ...(rel ?? '').split(/\s+/).filter(Boolean)])].join(' ') : rel}
      className={[styles.link, className ?? ''].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
      {external ? (
        <>
          <Icon name="external" size="small" className={styles.icon} />
          <span className={styles.hidden}> (opens in a new tab)</span>
        </>
      ) : null}
    </a>
  );
}
