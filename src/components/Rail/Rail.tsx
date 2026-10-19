import { useState, type MouseEvent, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { ProductMark, type ProductMarkSource } from '../ProductMark/ProductMark';
import { useShell } from '../AppShell/ShellContext';
import { SidebarNav, type SidebarNavProps } from '../SidebarNav/SidebarNav';
import styles from './Rail.module.css';

export type RailSlot = ReactNode | ((collapsed: boolean) => ReactNode);

export interface RailProps extends Pick<SidebarNavProps, 'groups' | 'footerItems' | 'current' | 'onItemClick'> {
  /** The app's product mark. Required: the design system ships none. */
  logo: ProductMarkSource;
  /** The product name written beside the mark when the rail is expanded. */
  productName?: string;
  /** Where the mark and name lead, usually the start page. The mark becomes a link; when the rail is collapsed the mark's name, in full, is its accessible name and shows as a tooltip, so the written `productName` may be shorter on hover and keyboard focus. */
  brandHref?: string;
  /** Called when the brand link is activated, for an app that navigates without a page load. It also closes the drawer. */
  onBrandClick?: (event: MouseEvent) => void;
  /** An optional slot above the mark, empty by default, for a switcher between related products. */
  productSwitcher?: ReactNode;
  /** A persistent action below the mark and above the destinations, for example the entry to an assistant. A function is told whether the rail is collapsed, so it can show an icon only. */
  actions?: RailSlot;
  /** Utilities at the foot, above the collapse control, for example a theme switch. They are in the drawer too. */
  utilities?: RailSlot;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  ariaLabel?: string;
}

export function Rail({ logo, productName, brandHref, onBrandClick, productSwitcher, actions, utilities, groups, footerItems, current, onItemClick, collapsed, defaultCollapsed = false, onCollapsedChange, ariaLabel = 'Primary' }: RailProps) {
  const shell = useShell();
  const [own, setOwn] = useState(defaultCollapsed);
  // In the drawer the rail is always expanded and has no collapse control.
  const drawer = shell?.compact === true;
  const isCollapsed = drawer ? false : (collapsed ?? own);
  const toggle = () => { const next = !isCollapsed; setOwn(next); onCollapsedChange?.(next); };
  const brandBody = (
    <>
      <ProductMark mark={logo} />
      {productName && !isCollapsed ? <span className={styles.name}>{productName}</span> : null}
    </>
  );
  return (
    <nav aria-label={ariaLabel} className={[styles.rail, isCollapsed ? styles.collapsed : styles.expanded].join(' ')}>
      {productSwitcher ? <div className={styles.switcher}>{productSwitcher}</div> : null}
      <div className={styles.brand}>
        {brandHref ? (
          <a
            href={brandHref}
            className={styles.brandLink}
            // Collapsed, the name is written nowhere, so the link carries it.
            aria-label={isCollapsed ? logo.name : undefined}
            onClick={(event) => { onBrandClick?.(event); if (drawer) shell?.setNavigationOpen(false); }}
          >
            {brandBody}
            {isCollapsed ? <span className={styles.tip} aria-hidden="true">{logo.name}</span> : null}
          </a>
        ) : brandBody}
      </div>
      {actions ? <div className={styles.actions}>{typeof actions === 'function' ? actions(isCollapsed) : actions}</div> : null}
      {/* In the drawer only the destinations scroll, so the utilities stay in view; a collapsed rail needs its tooltips to overflow. */}
      <div className={drawer ? styles.destinations : styles.destinationsFree}>
        <SidebarNav groups={groups} footerItems={footerItems} current={current} collapsed={isCollapsed} onItemClick={(item, event) => { onItemClick?.(item, event); if (drawer) shell?.setNavigationOpen(false); }} />
      </div>
      <div className={styles.foot}>
        {utilities ? <div className={styles.utilities}>{typeof utilities === 'function' ? utilities(isCollapsed) : utilities}</div> : null}
        {drawer ? null : (
          <button type="button" className={styles.toggle} aria-expanded={!isCollapsed} aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={toggle}>
            <Icon name="collapse" className={isCollapsed ? styles.turned : undefined} />
            {isCollapsed ? null : <span>Collapse</span>}
          </button>
        )}
      </div>
    </nav>
  );
}
