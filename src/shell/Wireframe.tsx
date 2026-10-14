import styles from './Wireframe.module.css';

export type WireframeVariant = 'desktop' | 'desktop-product-switcher' | 'desktop-sources-open' | 'tablet' | 'phone' | 'phone-menu' | 'phone-filters';

const destinations = [
  { group: 'Analyse', items: ['Overview', 'Country profile', 'Historical trends', 'Forecasts', 'Scenarios'] },
  { group: 'Explore', items: ['Data explorer', 'Ask'] },
];

const frameSize: Record<WireframeVariant, { width: number; height: number }> = {
  desktop: { width: 1440, height: 820 },
  'desktop-product-switcher': { width: 1440, height: 820 },
  'desktop-sources-open': { width: 1440, height: 820 },
  tablet: { width: 820, height: 700 },
  phone: { width: 390, height: 760 },
  'phone-menu': { width: 390, height: 760 },
  'phone-filters': { width: 390, height: 760 },
};

function Tag({ children }: { children: string }) {
  return <span className={styles.tag}>{children}</span>;
}

function Rail({ collapsed, overlay, productSlot }: { collapsed: boolean; overlay?: boolean; productSlot?: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className={[styles.rail, collapsed ? styles.railCollapsed : styles.railExpanded, overlay ? styles.railOverlay : ''].join(' ')}
    >
      <Tag>Rail</Tag>
      {productSlot ? <div className={styles.slot}>Product switcher</div> : null}
      <div className={styles.mark} aria-hidden="true" />
      {destinations.map((g) => (
        <div key={g.group} className={styles.group}>
          {!collapsed && <p className={styles.groupLabel}>{g.group}</p>}
          <ul>
            {g.items.map((item, i) => (
              <li key={item}>
                <a href="#wireframe" className={styles.item} aria-current={g.group === 'Analyse' && i === 1 ? 'page' : undefined} aria-label={collapsed ? item : undefined}>
                  <span className={styles.glyph} aria-hidden="true" />
                  {!collapsed && <span>{item}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className={styles.railFoot}>
        <button type="button" className={styles.item} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>
          <span className={styles.glyph} aria-hidden="true" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );
}

function AnalysisBar({ stacked }: { stacked?: boolean }) {
  const controls = ['Geography', 'Period', 'Metric', 'Scenario'];
  return (
    <section aria-label="Analysis controls" className={[styles.analysis, stacked ? styles.analysisStacked : ''].join(' ')}>
      <Tag>Analysis bar</Tag>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Country profile</h1>
        <p className={styles.purpose}>How one country&apos;s emissions have changed and where current policy leads.</p>
      </div>
      <div className={styles.controls}>
        {controls.map((c) => (
          <label key={c} className={styles.control}>
            <span className={styles.controlLabel}>{c}</span>
            <span className={styles.field}>
              <span className={styles.fieldValue}>{c === 'Geography' ? 'Select country' : c === 'Period' ? '1990 to 2024' : c === 'Metric' ? 'Annual CO₂' : 'Current policies'}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}

function Canvas() {
  return (
    <main className={styles.canvas}>
      <Tag>Canvas</Tag>
      <div className={styles.modules}>
        {['Key figures', 'Trend', 'Composition', 'Comparison'].map((m, i) => (
          <section key={m} className={[styles.module, i === 1 ? styles.moduleWide : ''].join(' ')} aria-label={m}>
            <p className={styles.moduleLabel}>{m}</p>
            <div className={styles.moduleBody} />
          </section>
        ))}
      </div>
    </main>
  );
}

function SourceStrip({ open, compact }: { open?: boolean; compact?: boolean }) {
  return (
    <aside aria-label="Sources and methodology" className={[styles.strip, open ? styles.stripOpen : ''].join(' ')}>
      <Tag>Source and methodology strip</Tag>
      <div className={styles.stripLine}>
        <span className={styles.stripText}>{compact ? 'Sources' : 'Source: dataset name, publisher · Period 1990 to 2024 · As of release date'}</span>
        <button type="button" className={styles.stripButton} aria-expanded={open ? 'true' : 'false'}>
          Methodology
        </button>
      </div>
      {open && (
        <div className={styles.stripPanel}>
          <p className={styles.panelCol}>Sources: list with link, publisher, licence and release date</p>
          <p className={styles.panelCol}>Definitions: metric, unit, baseline and any adjustments</p>
          <p className={styles.panelCol}>Method notes: how projections and ranges are produced</p>
        </div>
      )}
    </aside>
  );
}

function CompactBar({ menuOpen }: { menuOpen?: boolean }) {
  return (
    <header className={styles.compactBar}>
      <Tag>Top bar</Tag>
      <button type="button" className={styles.item} aria-label="Open navigation" aria-expanded={menuOpen ? 'true' : 'false'}>
        <span className={styles.glyph} aria-hidden="true" />
      </button>
      <h1 className={styles.compactTitle}>Country profile</h1>
      <button type="button" className={styles.item} aria-label="Open analysis controls">
        <span className={styles.glyph} aria-hidden="true" />
      </button>
    </header>
  );
}

export function Wireframe({ variant }: { variant: WireframeVariant }) {
  const size = frameSize[variant];
  const phone = variant.startsWith('phone');
  return (
    <div className={styles.stage}>
      <div className={styles.frame} style={{ width: '100%', maxWidth: size.width, height: size.height }}>
        {phone ? (
          <div className={styles.phone}>
            <CompactBar menuOpen={variant === 'phone-menu'} />
            {variant === 'phone-filters' ? <AnalysisBar stacked /> : null}
            <div className={styles.phoneBody}>
              <Canvas />
            </div>
            <SourceStrip compact />
            {variant === 'phone-menu' ? (
              <>
                <div className={styles.scrim} aria-hidden="true" />
                <Rail collapsed={false} overlay />
              </>
            ) : null}
          </div>
        ) : (
          <div className={styles.layout}>
            <Rail collapsed={variant === 'tablet'} productSlot={variant === 'desktop-product-switcher'} />
            <div className={styles.column}>
              <AnalysisBar />
              <div className={styles.scroll}>
                <Canvas />
              </div>
              <SourceStrip open={variant === 'desktop-sources-open'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
