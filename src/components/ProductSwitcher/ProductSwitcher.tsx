import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import popover from '../Popover/Popover.module.css';
import { useAnchoredPlacement } from '../Popover/useAnchoredPlacement';
import { rootPx } from '../../generated/tokens';
import { ProductMark, type ProductMarkSource } from '../ProductMark/ProductMark';
import styles from './ProductSwitcher.module.css';

export interface ProductSwitcherProduct {
  id: string;
  name: string;
  href: string;
  /** The product's mark, supplied by the consuming app: there is no default. */
  mark: ProductMarkSource;
}

export interface ProductSwitcherProps {
  /** Exactly the products to show. Which ones a reader may see is for the consuming product to decide. */
  products: ProductSwitcherProduct[];
  currentId: string;
  /** A note under the grid. */
  message?: ReactNode;
  /** Shows the mark only. The rail's product-switcher slot tells a function child whether the rail is collapsed. */
  collapsed?: boolean;
  /** The accessible name of the panel of products. */
  label?: string;
}

// In rem, the sizes the panel's stylesheet gives a tile, the gap between tiles and the panel's own side padding and border, with room kept for a scrollbar that takes space.
const TILE = 5;
const TILE_GAP = 0.5;
const PANEL_CHROME = 2 * 1.25 + 2 * 0.0625 + 0.875;

function tileColumns(count: number, room?: number) {
  const wanted = Math.max(1, Math.min(count, 3));
  if (room === undefined || typeof document === 'undefined') return wanted;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || rootPx;
  const fit = Math.floor((room / rem - PANEL_CHROME + TILE_GAP) / (TILE + TILE_GAP));
  return Math.max(1, Math.min(wanted, fit));
}

/** Moves between the products of one family. A disclosure: a button shows and hides a region of ordinary links. */
export function ProductSwitcher({ products, currentId, message, collapsed = false, label = 'Products' }: ProductSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const current = products.find((product) => product.id === currentId) ?? products[0];
  const placed = useAnchoredPlacement(trigger, panel, open, 'bottom', 'start');
  // Up to three tiles across, fewer where the room is short: each tile keeps its full width, and the panel is exactly as wide as the columns need.
  const columns = tileColumns(products.length, placed?.maxWidth);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) trigger?.focus();
  }, [trigger]);

  // A press or focus outside the button and the panel closes it, without taking focus from what was pressed.
  useEffect(() => {
    if (!open) return undefined;
    const outside = (target: EventTarget | null) => target instanceof Node && !panel.current?.contains(target) && !trigger?.contains(target);
    const onPress = (event: PointerEvent) => { if (outside(event.target)) close(false); };
    const onFocusIn = (event: FocusEvent) => { if (outside(event.target)) close(false); };
    // Escape is heard at the document first, wherever focus is (a pointer click need not focus the button in every browser), and goes no
    // further: it must not also close a drawer or an open rail around the switcher.
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPress);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, close, trigger]);

  if (!current) return null;
  return (
    <div className={styles.switcher}>
      <button
        ref={setTrigger}
        type="button"
        className={[styles.trigger, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${current.name}, switch product`}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <ProductMark mark={current.mark} />
        {collapsed ? null : <span className={styles.name}>{current.name}</span>}
        {collapsed ? null : <Icon name="chevron" size="small" />}
      </button>
      {open ? (
        // The panel takes the popover's surface, border and elevation by wearing its class, so the two stay the same.
        <div ref={panel} id={panelId} role="region" aria-label={label} className={[popover.panel, styles.panel].join(' ')} style={{ width: `calc(${columns} * var(--syn-space-9) + ${columns - 1} * var(--syn-space-2) + 2 * var(--syn-space-5) + 2 * var(--syn-layout-border-hairline) + var(--syn-space-4))`, maxWidth: placed ? `${placed.maxWidth}px` : undefined, top: placed?.top ?? 0, left: placed?.left ?? 0, maxHeight: placed ? placed.maxHeight : undefined, visibility: placed ? 'visible' : 'hidden' }}>
          <div className={styles.content}>
            <ul className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {products.map((product) => (
                <li key={product.id}>
                  <a href={product.href} className={styles.tile} aria-current={product.id === current.id ? 'true' : undefined}>
                    {/* The name is written beside the mark, so the mark adds nothing for a screen reader. */}
                    <span aria-hidden="true" className={styles.tileMark}><ProductMark mark={product.mark} /></span>
                    <span className={styles.tileName}>{product.name}</span>
                    {product.id === current.id ? <Icon name="check" size="small" className={styles.check} /> : null}
                  </a>
                </li>
              ))}
            </ul>
            {message ? <p className={styles.message}>{message}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
