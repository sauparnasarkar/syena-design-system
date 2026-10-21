import { coded } from './countries';

/** A value for the table, rounded to three significant figures and never to fractions of a whole number from ten up: the precision the data carries, not the float it was computed as. */
export const tableValue = (value: number) => {
  const decimals = value === 0 ? 0 : Math.min(3, Math.max(0, 2 - Math.floor(Math.log10(Math.abs(value)))));
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: decimals }).format(value);
};

export interface TableRow { code: string; name: string; text: string }

/** The rows of a map's table, which is its text alternative: the countries with a value first, largest first, then every other country by name, as having no data. */
export function tableRows(values: Record<string, number>, formatValue?: (value: number) => string, noDataLabel = 'No data'): TableRow[] {
  const show = formatValue ?? tableValue;
  const withValue = coded.filter((r) => r.code in values).sort((a, b) => values[b.code] - values[a.code]).map((r) => ({ code: r.code, name: r.name, text: show(values[r.code]) }));
  const without = coded.filter((r) => !(r.code in values)).sort((a, b) => a.name.localeCompare(b.name)).map((r) => ({ code: r.code, name: r.name, text: noDataLabel }));
  return [...withValue, ...without];
}
