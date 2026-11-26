import { Icon } from '../Icon/Icon';
import styles from './Chip.module.css';

export interface ChipProps {
  /** The chip's text. It also names the remove button, so it is plain text. */
  children: string;
  /** Selected: filled, with a check mark. For a chip that toggles, this is `aria-pressed`. */
  selected?: boolean;
  /** Makes the chip a toggle button. Without it the chip is a static token (an applied filter). */
  onClick?: () => void;
  /** Adds a separate remove button. */
  onRemove?: () => void;
  disabled?: boolean;
}

/** A removable or toggleable filter token. A chip is interactive; `Tag` is a static label. */
export function Chip({ children, selected = false, onClick, onRemove, disabled = false }: ChipProps) {
  const body = (
    <>
      {selected ? <Icon name="check" size="small" /> : null}
      <span>{children}</span>
    </>
  );
  return (
    <span className={[styles.chip, selected ? styles.selected : '', disabled ? styles.disabled : ''].filter(Boolean).join(' ')}>
      {onClick ? (
        <button type="button" className={[styles.body, styles.press].join(' ')} aria-pressed={selected} disabled={disabled} onClick={onClick}>{body}</button>
      ) : (
        <span className={styles.body}>{body}</span>
      )}
      {onRemove ? (
        <button type="button" className={styles.remove} aria-label={`Remove ${children}`} disabled={disabled} onClick={onRemove}>
          <Icon name="close" size="small" />
        </button>
      ) : null}
    </span>
  );
}
