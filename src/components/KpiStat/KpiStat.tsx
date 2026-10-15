import { Card } from '../Card/Card';
import { Figure, formatFigure } from '../Figure/Figure';
import { Icon } from '../Icon/Icon';
import styles from './KpiStat.module.css';

export type DeltaTone = 'positive' | 'negative' | 'neutral';

export interface KpiStatProps {
  label: string;
  value: number | string;
  unit?: string;
  /** The unit spelled for screen readers when `unit` is an abbreviation. */
  unitLabel?: string;
  decimals?: number;
  /** The change, as a number or already formatted. Shown with a sign and a direction glyph. */
  delta?: number | string;
  deltaDirection?: 'up' | 'down';
  /** Whether the change is good, bad or neither. Direction is not a verdict: the metric decides. */
  tone?: DeltaTone;
  /** What the change is measured against, for example "on 2023". */
  deltaNote?: string;
  deltaDecimals?: number;
  deltaUnit?: string;
  /** Wraps the stat in a card. */
  card?: boolean;
  loading?: boolean;
}

const toneClass: Record<DeltaTone, string> = { positive: styles.positive, negative: styles.negative, neutral: styles.neutral };

/** One headline figure with context: label, value, and a change with its direction and tone. */
export function KpiStat({ label, value, unit, unitLabel, decimals, delta, deltaDirection, tone = 'neutral', deltaNote, deltaDecimals, deltaUnit, card, loading }: KpiStatProps) {
  // A change that shows as zero has no direction: a flat glyph, no sign, the neutral tone.
  const flat = typeof delta === 'number' && Number(Math.abs(delta).toFixed(deltaDecimals ?? 0)) === 0;
  const direction = flat ? undefined : deltaDirection;
  const shownTone: DeltaTone = flat ? 'neutral' : tone;
  const sign = typeof delta === 'number' ? (flat ? formatFigure(0, { decimals: deltaDecimals }) : formatFigure(delta, { signed: true, decimals: deltaDecimals })) : delta;
  const amount = typeof delta === 'number' ? formatFigure(Math.abs(delta), { decimals: deltaDecimals }) : String(delta).replace(/^[+−-]/, '');
  const unitWords = deltaUnit ? ` ${deltaUnit === '%' ? 'percent' : deltaUnit.trim()}` : '';
  const spoken = delta === undefined ? '' : flat ? `no change ${deltaNote ?? ''}`.trim() : `${direction ?? ''} ${amount}${unitWords} ${deltaNote ?? ''}`.trim();
  const body = (
    <section className={styles.stat} aria-label={label} aria-busy={loading || undefined}>
      <span className={styles.label}>{label}</span>
      {loading ? (
        <span className={styles.skeleton} aria-hidden="true" />
      ) : (
        <>
          <Figure size="md" value={value} unit={unit} unitLabel={unitLabel} decimals={decimals} tone="primary" />
          {delta !== undefined ? (
            <span className={[styles.delta, toneClass[shownTone]].join(' ')}>
              {flat ? <Icon name="flat" size="small" /> : direction ? <Icon name={direction === 'up' ? 'up' : 'down'} size="small" /> : null}
              <span aria-hidden="true" className={styles.figure}>{sign}{deltaUnit ?? ''}</span>
              {deltaNote ? <span aria-hidden="true" className={styles.note}>{deltaNote}</span> : null}
              <span className={styles.spoken}>{spoken}</span>
            </span>
          ) : null}
        </>
      )}
    </section>
  );
  return card ? <Card>{body}</Card> : body;
}
