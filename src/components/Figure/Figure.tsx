import type { HTMLAttributes } from 'react';
import type { Tone } from '../Text/Text';
import styles from './Figure.module.css';

export type FigureSize = 'sm' | 'md' | 'lg';

export interface FigureProps extends Omit<HTMLAttributes<HTMLElement>, 'color' | 'children'> {
  /** The number, or text that has already been formatted. */
  value: number | string;
  /** Size role: figure-sm, figure-md or figure-lg. */
  size?: FigureSize;
  /** Unit written after the value, in text-sm. */
  unit?: string;
  /** The unit spelled for screen readers, when the visible unit is an abbreviation or symbol. */
  unitLabel?: string;
  /** Always show a sign: plus for positive values, a true minus for negative. */
  signed?: boolean;
  /** Decimal places when `value` is a number. */
  decimals?: number;
  locale?: string;
  tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  primary: styles.tonePrimary,
  secondary: styles.toneSecondary,
  muted: styles.toneMuted,
  link: styles.toneLink,
  inverse: styles.toneInverse,
  positive: styles.tonePositive,
  negative: styles.toneNegative,
  caution: styles.toneCaution,
};

const MINUS = '−';

export function formatFigure(value: number | string, { signed = false, decimals, locale = 'en-GB' }: { signed?: boolean; decimals?: number; locale?: string } = {}) {
  if (typeof value === 'string') return value.replace(/^-/, MINUS);
  const body = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(value));
  if (value < 0) return `${MINUS}${body}`;
  return signed && value > 0 ? `+${body}` : body;
}

export function Figure({ value, size = 'md', unit, unitLabel, signed, decimals, locale, tone, className, ...rest }: FigureProps) {
  const classes = [styles.figure, styles[size], tone ? toneClass[tone] : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      <span>{formatFigure(value, { signed, decimals, locale })}</span>
      {unit ? (
        <>
          <span className={styles.unit} aria-hidden={unitLabel ? 'true' : undefined}>{unit}</span>
          {unitLabel ? <span className={styles.srOnly}>{unitLabel}</span> : null}
        </>
      ) : null}
    </span>
  );
}
