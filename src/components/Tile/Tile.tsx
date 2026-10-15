import type { MouseEventHandler, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import cardStyles from '../Card/Card.module.css';
import styles from './Tile.module.css';

interface Common {
  children: ReactNode;
  className?: string;
}

export type TileProps =
  | (Common & { interactive?: false; href?: never; onClick?: never })
  | (Common & { interactive: true; href: string; onClick?: MouseEventHandler<HTMLAnchorElement> })
  | (Common & { interactive: true; href?: undefined; onClick: MouseEventHandler<HTMLButtonElement> });

/** An interactive card, such as a suggested question. It is a link or a button, never a div with a role. */
export function Tile(props: TileProps) {
  const classes = [cardStyles.card, cardStyles.bordered, cardStyles.padDefault, props.className ?? ''].filter(Boolean).join(' ');
  if (!props.interactive) return <div className={classes}>{props.children}</div>;
  const body = (
    <>
      <span className={styles.body}>{props.children}</span>
      <Icon name="arrow" size="small" className={styles.arrow} />
    </>
  );
  const interactive = [classes, styles.tile].join(' ');
  if (props.href !== undefined) return <a href={props.href} className={interactive} onClick={props.onClick}>{body}</a>;
  return <button type="button" className={interactive} onClick={props.onClick}>{body}</button>;
}
