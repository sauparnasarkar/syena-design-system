import { SelectBase, type Option } from '../SelectBase/SelectBase';

export type { Option as SelectOption } from '../SelectBase/SelectBase';

export interface SelectProps {
  /** The visible label above the field. Without it, `ariaLabel` is required. */
  label?: string;
  ariaLabel?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  size?: 'default' | 'small';
  /** Hides the search field, which otherwise shows with ten or more options. */
  suppressSearch?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

/** Choose one option from a list: a combobox with a listbox popup and optional search. */
export function Select(props: SelectProps) {
  return <SelectBase {...props} />;
}
