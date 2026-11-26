import { useId } from 'react';
import { Text } from '../components/Text/Text';
import styles from './ThemeSwitch.module.css';
import { useSynTheme, type ThemeChoice } from './SynThemeProvider';

const labels: Record<ThemeChoice, string> = { system: 'System', night: 'Night', tidewater: 'Tidewater', ledger: 'Ledger' };

/** A labelled control for the reader's theme choice. */
export function ThemeSwitch({ label = 'Theme' }: { label?: string }) {
  const { choice, setChoice, themes } = useSynTheme();
  const id = useId();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--syn-space-2)' }}>
      <Text as="label" type="caption" tone="muted" htmlFor={id}>{label}</Text>
      <select id={id} className={styles.select} value={choice} onChange={(e) => setChoice(e.target.value as ThemeChoice)}>
        {(['system', ...themes] as ThemeChoice[]).map((c) => (
          <option key={c} value={c}>{labels[c]}</option>
        ))}
      </select>
    </span>
  );
}
