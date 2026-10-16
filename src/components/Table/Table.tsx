import type { ReactNode } from 'react';
import { useId } from 'react';
import styles from './Table.module.css';

export interface TableColumn<Row> {
  key: keyof Row & string;
  /** The column's name: text, or inline content. */
  header: ReactNode;
  /** Written under the header, once, instead of in every cell. */
  unit?: string;
  /** Right-aligned, in the figure face. */
  numeric?: boolean;
  /** Long text wraps within the column instead of keeping to one line. */
  wrap?: boolean;
  /** How a cell is written; the raw value by default. */
  render?: (row: Row) => ReactNode;
}

export interface TableColumnGroup {
  label: string;
  /** How many columns the group spans. */
  span: number;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  /** What the table holds and the period. Shown above the table, outside its scrolling area, and names it. */
  caption: string;
  /** The column whose cells are row headers. The first by default. */
  rowHeaderKey?: keyof Row & string;
  groups?: TableColumnGroup[];
  size?: 'default' | 'small';
  striped?: boolean;
  rowBorders?: boolean;
  withBorder?: boolean;
  /** Called with the row; rows become selectable buttons through their first cell. Omit for a static table. */
  selectedIndex?: number;
}

/**
 * A static table for short lists. The caption sits above the scrolling area, the first column stays
 * in view when the table scrolls sideways, and edge shadows show that there is more to see.
 */
export function Table<Row extends object>({ columns, rows, caption, rowHeaderKey, groups, size = 'default', striped, rowBorders = true, withBorder = true, selectedIndex }: TableProps<Row>) {
  const id = useId();
  const header = rowHeaderKey ?? columns[0]?.key;
  const cell = (row: Row, col: TableColumn<Row>) => (col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as ReactNode));
  return (
    <div className={[styles.wrap, withBorder ? styles.bordered : ''].filter(Boolean).join(' ')}>
      <p id={id} className={styles.caption}>{caption}</p>
      <div role="region" aria-labelledby={id} tabIndex={0} className={styles.scroll}>
        <table aria-labelledby={id} className={[styles.table, size === 'small' ? styles.small : '', striped ? styles.striped : '', rowBorders ? styles.rowBorders : ''].filter(Boolean).join(' ')}>
          <thead>
            {groups ? (
              <tr>
                {groups.map((g, i) => (g.label ? <th key={i} scope="colgroup" colSpan={g.span} className={styles.group}>{g.label}</th> : <td key={i} colSpan={g.span} aria-hidden="true" />))}
              </tr>
            ) : null}
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={[col.numeric ? styles.numeric : '', col.wrap ? styles.wrap : ''].filter(Boolean).join(' ') || undefined}>
                  {col.header}
                  {col.unit ? <span className={styles.unit}>{col.unit}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r === selectedIndex ? styles.selected : undefined} aria-selected={selectedIndex === undefined ? undefined : r === selectedIndex}>
                {columns.map((col) => (col.key === header ? (
                  <th key={col.key} scope="row" className={[col.numeric ? styles.numeric : '', col.wrap ? styles.wrap : ''].filter(Boolean).join(' ') || undefined}>{cell(row, col)}</th>
                ) : (
                  <td key={col.key} className={[col.numeric ? styles.numeric : '', col.wrap ? styles.wrap : ''].filter(Boolean).join(' ') || undefined}>{cell(row, col)}</td>
                )))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
