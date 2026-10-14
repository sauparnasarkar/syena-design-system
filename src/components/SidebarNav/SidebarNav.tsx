import type { MouseEvent } from 'react';
import { Icon, type IconProps } from '../Icon/Icon';
import styles from './SidebarNav.module.css';

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: IconProps['name'];
  /** A count shown after the label, for example unread items. */
  count?: number;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface SidebarNavProps {
  groups: NavGroup[];
  /** Items listed after the groups, for example about and help. */
  footerItems?: NavItem[];
  /** The id of the current destination. */
  current?: string;
  /** Icons only; labels show in a tooltip on hover and keyboard focus. */
  collapsed?: boolean;
  onItemClick?: (item: NavItem, event: MouseEvent) => void;
  className?: string;
}

function Item({ item, current, collapsed, onItemClick }: { item: NavItem; current?: string; collapsed?: boolean; onItemClick?: SidebarNavProps['onItemClick'] }) {
  const isCurrent = item.id === current;
  const body = (
    <>
      {item.icon ? <Icon name={item.icon} /> : null}
      <span className={collapsed ? styles.labelHidden : styles.label}>{item.label}</span>
      {item.count != null && !collapsed ? <span className={styles.count}>{item.count}</span> : null}
      {collapsed ? <span className={styles.tip} aria-hidden="true">{item.label}</span> : null}
    </>
  );
  const common = {
    className: styles.item,
    'aria-current': isCurrent ? ('page' as const) : undefined,
    onClick: (event: MouseEvent) => onItemClick?.(item, event),
  };
  return <li className={styles.entry}>{item.href ? <a href={item.href} {...common}>{body}</a> : <button type="button" {...common}>{body}</button>}</li>;
}

export function SidebarNav({ groups, footerItems, current, collapsed, onItemClick, className }: SidebarNavProps) {
  return (
    <div className={[styles.nav, className ?? ''].filter(Boolean).join(' ')}>
      {groups.map((group) => (
        <div key={group.id}>
          <p className={collapsed ? styles.groupLabelHidden : styles.groupLabel} id={`syn-nav-${group.id}`}>{group.label}</p>
          <ul className={styles.list} aria-labelledby={`syn-nav-${group.id}`}>
            {group.items.map((item) => <Item key={item.id} item={item} current={current} collapsed={collapsed} onItemClick={onItemClick} />)}
          </ul>
        </div>
      ))}
      {footerItems?.length ? (
        <ul className={styles.list}>
          {footerItems.map((item) => <Item key={item.id} item={item} current={current} collapsed={collapsed} onItemClick={onItemClick} />)}
        </ul>
      ) : null}
    </div>
  );
}
