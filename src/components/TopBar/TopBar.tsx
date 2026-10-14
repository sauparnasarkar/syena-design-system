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
  /** A one-line summary of the current selection, under the title. */
  summary?: string;
  /** Opens the navigation drawer. Defaults to the enclosing shell's. */
  onOpenNavigation?: () => void;
  /** Opens the analysis controls. Defaults to the enclosing shell's. */
  onOpenControls?: () => void;
  navigationOpen?: boolean;
  controlsOpen?: boolean;
  actions?: ReactNode;
}

export function TopBar({ logo, title, summary, onOpenNavigation, onOpenControls, navigationOpen, controlsOpen, actions }: TopBarProps) {
  const shell = useShell();
  return (
    <header className={styles.bar} data-syn-sticky="top">
      <button type="button" className={styles.button} aria-label="Open navigation" aria-expanded={navigationOpen ?? shell?.navigationOpen ?? false} onClick={onOpenNavigation ?? (() => shell?.setNavigationOpen(true))}>
        <Icon name="menu" />
      </button>
      <ProductMark mark={logo} />
      <div className={styles.title}>
        <h1 className={styles.heading}>{title}</h1>
        {summary ? <p className={styles.summary}>{summary}</p> : null}
      </div>
      {actions}
      <button type="button" className={styles.button} aria-label="Open analysis controls" aria-expanded={controlsOpen ?? shell?.controlsOpen ?? false} onClick={onOpenControls ?? (() => shell?.setControlsOpen(true))}>
        <Icon name="filters" />
      </button>
    </header>
  );
}
