import type { ReactNode } from 'react';
import { Glyph } from './glyphs';
import styles from './Parts.module.css';

export function Kpi({ label, value, unit, delta, note, direction, tone }: { label: string; value: string; unit: string; delta: string; note: string; direction: 'up' | 'down'; tone: 'positive' | 'negative' | 'neutral' }) {
  const words = `${direction === 'up' ? 'up' : 'down'} ${delta.replace(/^[+−]/, '')} ${note}`;
  return (
    <section className={styles.kpi} aria-label={label}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>
        <span>{value}</span>
        <span className={styles.kpiUnit}>{unit}</span>
      </span>
      <span className={`${styles.kpiDelta} ${styles[tone]}`}>
        <Glyph name={direction} size="small" />
        <span className={styles.num} aria-hidden="true">{delta}</span>
        <span className={styles.deltaNote} aria-hidden="true">{note}</span>
        <span className={styles.srOnly}>{words}</span>
      </span>
    </section>
  );
}

export function Kpis({ children }: { children: ReactNode }) {
  return <div className={styles.kpis}>{children}</div>;
}

type KeyKind = { name: string; color: string; kind: 'solid' | 'dashed' | 'band' | 'bar' };

function Key({ k }: { k: KeyKind }) {
  const colour = `var(${k.color})`;
  if (k.kind === 'bar' || k.kind === 'band') return <span className={styles.key} style={{ background: colour, opacity: k.kind === 'band' ? 'var(--syn-opacity-band)' : undefined, borderRadius: 'var(--syn-radius-control)' }} />;
  return (
    <svg className={styles.key} viewBox="0 0 20 12" aria-hidden="true">
      <line x1="0" x2="20" y1="6" y2="6" strokeWidth="2" strokeDasharray={k.kind === 'dashed' ? '6 4' : undefined} style={{ stroke: colour }} />
    </svg>
  );
}

export function ChartCard({ title, support, keys, footer, children, headingLevel = 2 }: { title: string; support?: string; keys?: KeyKind[]; footer: string; children: ReactNode; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.cardHeader}>
        <div>
          <H className={styles.cardTitle}>{title}</H>
          {support ? <p className={styles.cardSupport}>{support}</p> : null}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} aria-label={`View ${title} as a table`}><Glyph name="table" size="small" /></button>
          <button type="button" className={styles.iconButton} aria-label={`Download ${title}`}><Glyph name="download" size="small" /></button>
        </div>
      </div>
      <div className={styles.panel}>
        {keys ? (
          <ul className={styles.legend} aria-label="Legend">
            {keys.map((k) => (
              <li key={k.name} className={styles.legendItem}><Key k={k} /><span>{k.name}</span></li>
            ))}
          </ul>
        ) : null}
        {children}
      </div>
      <p className={styles.cardFooter}>{footer}</p>
    </section>
  );
}

export function Alert({ tone, title, children }: { tone: 'warning' | 'info'; title: string; children: ReactNode }) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role="status">
      <span className={styles.alertIcon}><Glyph name={tone === 'warning' ? 'warning' : 'info'} /></span>
      <p><span className={styles.alertTitle}>{title}. </span>{children}</p>
    </div>
  );
}

export function Tag({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <span className={`${styles.tag} ${accent ? styles.tagAccent : ''}`}>{children}</span>;
}

export { styles as partStyles };
