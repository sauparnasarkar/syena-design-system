import { SelectBase, type Option } from '../SelectBase/SelectBase';

export interface MultiSelectProps {
  label?: string;
  ariaLabel?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  /** The most that can be chosen; further options are disabled and the footer says why. */
  maxSelected?: number;
  size?: 'default' | 'small';
  suppressSearch?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

/** Choose several options. The field shows the first choices and a count; the popup shows a count and a Clear action. */
export function MultiSelect(props: MultiSelectProps) {
  return <SelectBase {...props} multiple />;
}
