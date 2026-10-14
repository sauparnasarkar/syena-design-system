import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Text.module.css';

export type TypeRole = 'display' | 'title-lg' | 'title-md' | 'title-sm' | 'text-lg' | 'text-md' | 'text-sm' | 'caption' | 'overline';
export type Tone = 'primary' | 'secondary' | 'muted' | 'link' | 'inverse' | 'positive' | 'negative' | 'caution';
export type TextElement = 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'small' | 'strong' | 'em' | 'li' | 'dt' | 'dd' | 'legend' | 'figcaption';

const roleClass: Record<TypeRole, string> = {
  display: styles.display,
  'title-lg': styles.titleLg,
  'title-md': styles.titleMd,
  'title-sm': styles.titleSm,
  'text-lg': styles.textLg,
  'text-md': styles.textMd,
  'text-sm': styles.textSm,
  caption: styles.caption,
  overline: styles.overline,
};

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

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** The element to render. Heading levels are chosen here, never implied by the type role. */
  as?: TextElement;
  /** A type role from the scale. */
  type?: TypeRole;
  /** A colour role. When omitted the text inherits its colour. */
  tone?: Tone;
  /** For `as="label"`. */
  htmlFor?: string;
  children?: ReactNode;
}

export function Text({ as: Element = 'span', type = 'text-md', tone, className, children, ...rest }: TextProps) {
  const classes = [styles.text, roleClass[type], tone ? toneClass[tone] : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <Element className={classes} {...rest}>
      {children}
    </Element>
  );
}
