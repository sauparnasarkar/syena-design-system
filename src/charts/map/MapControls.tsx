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
}

export function PanelButton({ icon, children, label, pressed, disabled, onClick }: { icon: IconProps['name']; children?: ReactNode; label?: string; pressed?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={styles.button} aria-label={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      <Icon name={icon} size="small" />
      {children ? <span>{children}</span> : null}
    </button>
  );
}

/**
 * Zoom in and out, reset the view, switch to the table, and say which keys do the same. The buttons sit on the
 * dark data panel in both themes, so they are drawn in the panel's own colours.
 */
export function MapControls({ onZoomIn, onZoomOut, onReset, zoomInDisabled, zoomOutDisabled, tableView, onTableViewChange, subject, hint }: MapControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.buttons} role="group" aria-label={`${subject} view`}>
        <PanelButton icon="zoomIn" label={`Zoom in ${subject}`} onClick={onZoomIn} disabled={zoomInDisabled || tableView} />
        <PanelButton icon="zoomOut" label={`Zoom out ${subject}`} onClick={onZoomOut} disabled={zoomOutDisabled || tableView} />
        <PanelButton icon="reset" onClick={onReset} disabled={tableView}>Reset view</PanelButton>
        <PanelButton icon="table" pressed={tableView} onClick={() => onTableViewChange(!tableView)}>Table view</PanelButton>
      </div>
      {tableView ? null : <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
