import type { ReactNode } from 'react';
import { Glyph } from './glyphs';
import { useCompact } from './hooks';
import styles from './Layout.module.css';

const destinations = [
  { group: 'Analyse', items: [['overview', 'Overview'], ['country', 'Country profile'], ['historical', 'Historical trends'], ['forecasts', 'Forecasts'], ['scenarios', 'Scenarios']] },
  { group: 'Explore', items: [['explorer', 'Data explorer'], ['ask', 'Ask']] },
] as const;

export type Control =
  | { kind: 'field'; label: string; value: string }
  | { kind: 'segments'; label: string; options: string[]; value: string };

const summary = (controls: Control[]) => controls.map((c) => (c.kind === 'field' ? c.value : c.value)).join(' · ');

export function SpecimenShell({ current, title, purpose, controls, strip, children }: { current: string; title: string; purpose: string; controls: Control[]; strip: string; children: ReactNode }) {
  const compact = useCompact();
  return (
    <div className={styles.app} data-syn-compact={compact ? 'true' : undefined}>
      <nav aria-label="Skip links"><a href="#content" className={styles.skip}>Skip to content</a></nav>
      {compact ? (
        <header className={styles.topBar}>
          <button type="button" className={styles.barButton} aria-label="Open navigation" aria-expanded="false"><Glyph name="menu" /></button>
          <div className={styles.barTitle}>
            <h1 className={styles.barHeading}>{title}</h1>
            <p className={styles.barSummary}>{summary(controls)}</p>
          </div>
          <button type="button" className={styles.barButton} aria-label="Open analysis controls" aria-expanded="false"><Glyph name="filters" /></button>
        </header>
      ) : (
        <nav aria-label="Primary" className={styles.rail}>
          <div className={styles.productSlot} data-syn-slot="product-switcher" />
          <div className={styles.brand}>
            <span className={styles.mark} aria-hidden="true" />
            <span className={styles.brandName}>Climate analysis</span>
          </div>
          {destinations.map((g) => (
            <div key={g.group}>
              <p className={styles.groupLabel} id={`group-${g.group}`}>{g.group}</p>
              <ul className={styles.list} aria-labelledby={`group-${g.group}`}>
                {g.items.map(([icon, label]) => (
                  <li key={label}>
                    <a href="#content" className={styles.item} aria-current={label === current ? 'page' : undefined}>
                      <Glyph name={icon} />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className={styles.railFoot}>
            <a href="#content" className={styles.item}>
              <Glyph name="collapse" />
              <span>Collapse</span>
            </a>
          </div>
        </nav>
      )}
      <div className={styles.column}>
        {compact ? null : (
          <section aria-label="Analysis controls" className={styles.analysis}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.purpose}>{purpose}</p>
            </div>
            <div className={styles.controls}>
              {controls.map((c) =>
                c.kind === 'field' ? (
                  <div key={c.label} className={styles.control}>
                    <span className={styles.controlLabel}>{c.label}</span>
                    <button type="button" className={styles.field} aria-haspopup="listbox" aria-expanded="false" aria-label={`${c.label}: ${c.value}`}>
                      <span className={styles.fieldText}>{c.value}</span>
                      <Glyph name="chevron" size="small" />
                    </button>
                  </div>
                ) : (
                  <div key={c.label} className={styles.control}>
                    <span className={styles.controlLabel} id={`seg-${c.label}`}>{c.label}</span>
                    <div className={styles.segments} role="radiogroup" aria-labelledby={`seg-${c.label}`}>
                      {c.options.map((o) => (
                        <span key={o} className={styles.segment} role="radio" aria-checked={o === c.value} tabIndex={o === c.value ? 0 : -1}>{o}</span>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}
        <main id="content" className={styles.canvas}>{children}</main>
        <aside aria-label="Sources and methodology" className={styles.strip}>
          <div className={styles.stripLine}>
            <span className={styles.stripText}>{compact ? 'Sources' : strip}</span>
            <button type="button" className={styles.stripButton} aria-expanded="false">Methodology</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export { styles as layoutStyles };
