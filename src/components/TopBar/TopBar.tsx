import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { ProductMark, type ProductMarkSource } from '../ProductMark/ProductMark';
import { useShell } from '../AppShell/ShellContext';
import styles from './TopBar.module.css';

export interface TopBarProps {
  /** The app's product mark. Required: the design system ships none. */
  logo: ProductMarkSource;
  /** The view title. At compact widths this is the page heading. */
  title: string;
  /** The product's short name, written beside the mark with the title on the line under it. The mark's own name stays the full one, for assistive technology and as a tooltip. */
  productName?: string;
  /** A one-line summary of the current selection, under the title (on the title's line when there is a short name, so the bar keeps its height). */
  summary?: string;
  /** Opens the navigation drawer. Defaults to the enclosing shell's. */
  onOpenNavigation?: () => void;
  /** Opens the analysis controls. Defaults to the enclosing shell's. */
  onOpenControls?: () => void;
  navigationOpen?: boolean;
  controlsOpen?: boolean;
  /** Shows the analysis-controls button. Turn it off for a view that has no controls to open. */
  showControls?: boolean;
  actions?: ReactNode;
}

export function TopBar({ logo, title, productName, summary, onOpenNavigation, onOpenControls, navigationOpen, controlsOpen, showControls = true, actions }: TopBarProps) {
  const shell = useShell();
  return (
    <header className={styles.bar} data-syn-sticky="top">
      <button type="button" className={styles.button} aria-label="Open navigation" aria-expanded={navigationOpen ?? shell?.navigationOpen ?? false} onClick={onOpenNavigation ?? (() => shell?.setNavigationOpen(true))}>
        <Icon name="menu" />
      </button>
      {productName ? (
        <div className={styles.brand} title={logo.name}>
          <ProductMark mark={logo} />
          <div className={styles.title}>
            <p className={styles.product} aria-hidden="true">{productName}</p>
            <div className={styles.line}>
              <h1 className={styles.heading}>{title}</h1>
              {summary ? <p className={[styles.summary, styles.summaryBeside].join(' ')}>{summary}</p> : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ProductMark mark={logo} />
          <div className={styles.title}>
            <h1 className={styles.heading}>{title}</h1>
            {summary ? <p className={styles.summary}>{summary}</p> : null}
          </div>
        </>
      )}
      {actions}
      {showControls ? (
        <button type="button" className={styles.button} aria-label="Open analysis controls" aria-expanded={controlsOpen ?? shell?.controlsOpen ?? false} onClick={onOpenControls ?? (() => shell?.setControlsOpen(true))}>
          <Icon name="filters" />
        </button>
      ) : null}
    </header>
  );
}
