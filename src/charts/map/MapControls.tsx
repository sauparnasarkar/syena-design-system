import type { ReactNode } from 'react';
import { Icon, type IconProps } from '../../components/Icon/Icon';
import styles from './MapControls.module.css';

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomInDisabled?: boolean;
  zoomOutDisabled?: boolean;
  tableView: boolean;
  onTableViewChange: (next: boolean) => void;
  /** Names the thing being controlled, for example "globe" or "map". */
  subject: string;
  /** The short on-screen hint for the keyboard. */
  hint: string;
  /** Whether the hint is drawn (`visible`, the default) or only read out to a screen reader (`sr-only`). */
  hintVisibility?: 'visible' | 'sr-only';
  /** More controls for the same row as the buttons, drawn before them. */
  extra?: ReactNode;
  /** For a narrow, short space: only the table button is drawn, as an icon at a finger-sized target, in the row with `extra`. Zoom and reset stay on the keys. */
  dense?: boolean;
}

export function PanelButton({ icon, children, label, pressed, disabled, onClick, dense }: { icon: IconProps['name']; children?: ReactNode; label?: string; pressed?: boolean; disabled?: boolean; onClick: () => void; dense?: boolean }) {
  return (
    <button type="button" className={dense ? `${styles.button} ${styles.buttonDense}` : styles.button} aria-label={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      <Icon name={icon} size="small" />
      {children ? <span>{children}</span> : null}
    </button>
  );
}

/**
 * Zoom in and out, reset the view, switch to the table, and say which keys do the same. The buttons sit on the
 * dark data panel in both themes, so they are drawn in the panel's own colours.
 */
export function MapControls({ onZoomIn, onZoomOut, onReset, zoomInDisabled, zoomOutDisabled, tableView, onTableViewChange, subject, hint, hintVisibility = 'visible', extra, dense = false }: MapControlsProps) {
  const buttons = dense ? (
    <div className={styles.buttons} role="group" aria-label={`${subject} view`}>
      <PanelButton icon="table" label="Table view" pressed={tableView} onClick={() => onTableViewChange(!tableView)} dense />
    </div>
  ) : (
    <div className={styles.buttons} role="group" aria-label={`${subject} view`}>
      <PanelButton icon="zoomIn" label={`Zoom in ${subject}`} onClick={onZoomIn} disabled={zoomInDisabled || tableView} />
      <PanelButton icon="zoomOut" label={`Zoom out ${subject}`} onClick={onZoomOut} disabled={zoomOutDisabled || tableView} />
      <PanelButton icon="reset" onClick={onReset} disabled={tableView}>Reset view</PanelButton>
      <PanelButton icon="table" pressed={tableView} onClick={() => onTableViewChange(!tableView)}>Table view</PanelButton>
    </div>
  );
  return (
    <div className={styles.controls}>
      {extra ? <div className={dense ? `${styles.row} ${styles.rowDense}` : styles.row}><div className={styles.extra}>{extra}</div>{buttons}</div> : buttons}
      {tableView ? null : <p className={hintVisibility === 'sr-only' ? `${styles.hint} ${styles.srOnly}` : styles.hint}>{hint}</p>}
    </div>
  );
}
