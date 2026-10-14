import { useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { ProductMark, type ProductMarkSource } from '../ProductMark/ProductMark';
import { useShell } from '../AppShell/ShellContext';
import { SidebarNav, type SidebarNavProps } from '../SidebarNav/SidebarNav';
import styles from './Rail.module.css';

export interface RailProps extends Pick<SidebarNavProps, 'groups' | 'footerItems' | 'current' | 'onItemClick'> {
  /** The app's product mark. Required: the design system ships none. */
  logo: ProductMarkSource;
  /** The product name written beside the mark when the rail is expanded. */
  productName?: string;
  /** An optional slot above the mark, empty by default, for a switcher between related products. */
  productSwitcher?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  ariaLabel?: string;
}

export function Rail({ logo, productName, productSwitcher, groups, footerItems, current, onItemClick, collapsed, defaultCollapsed = false, onCollapsedChange, ariaLabel = 'Primary' }: RailProps) {
  const shell = useShell();
  const [own, setOwn] = useState(defaultCollapsed);
  // In the drawer the rail is always expanded and has no collapse control.
  const drawer = shell?.compact === true;
  const isCollapsed = drawer ? false : (collapsed ?? own);
  const toggle = () => { const next = !isCollapsed; setOwn(next); onCollapsedChange?.(next); };
  return (
    <nav aria-label={ariaLabel} className={[styles.rail, isCollapsed ? styles.collapsed : styles.expanded].join(' ')}>
      {productSwitcher ? <div className={styles.switcher}>{productSwitcher}</div> : null}
      <div className={styles.brand}>
        <ProductMark mark={logo} />
        {productName && !isCollapsed ? <span className={styles.name}>{productName}</span> : null}
      </div>
      <SidebarNav groups={groups} footerItems={footerItems} current={current} collapsed={isCollapsed} onItemClick={(item, event) => { onItemClick?.(item, event); if (drawer) shell?.setNavigationOpen(false); }} />
      {drawer ? null : (
        <div className={styles.foot}>
          <button type="button" className={styles.toggle} aria-expanded={!isCollapsed} aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={toggle}>
            <Icon name="collapse" className={isCollapsed ? styles.turned : undefined} />
            {isCollapsed ? null : <span>Collapse</span>}
          </button>
        </div>
      )}
    </nav>
  );
}
