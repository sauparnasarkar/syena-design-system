import { useEffect, useState } from 'react';
import { Button } from '../Button/Button';
import { Slider } from '../Slider/Slider';
import styles from './YearControl.module.css';

export interface YearControlProps {
  /** The first and last year the control can show. */
  min: number;
  max: number;
  value: number;
  onChange: (year: number) => void;
  /** Whether the years are stepping on their own. Controlled together with `onPlayingChange`; uncontrolled when omitted. */
  playing?: boolean;
  defaultPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  /** Milliseconds between years while playing. */
  intervalMs?: number;
  label?: string;
  /** Years the slider moves by when dragged or keyed. */
  step?: number;
}

/** A year slider with a play and pause button. Playing stops on the last year; it never starts by itself. */
export function YearControl({ min, max, value, onChange, playing, defaultPlaying = false, onPlayingChange, intervalMs = 900, label = 'Year', step = 1 }: YearControlProps) {
  const [ownPlaying, setOwnPlaying] = useState(defaultPlaying);
  const isPlaying = playing ?? ownPlaying;
  const setPlaying = (next: boolean) => { setOwnPlaying(next); onPlayingChange?.(next); };

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (value >= max) { setPlaying(false); return undefined; }
    const timer = window.setTimeout(() => onChange(Math.min(max, value + step)), intervalMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, value, max, step, intervalMs]);

  return (
    <div className={styles.control}>
      <Button variant="secondary" size="small" icon={isPlaying ? 'pause' : 'play'} aria-pressed={isPlaying} aria-label={isPlaying ? `Pause ${label.toLowerCase()} animation` : `Play ${label.toLowerCase()} animation`} onClick={() => { if (!isPlaying && value >= max) onChange(min); setPlaying(!isPlaying); }} />
      <Slider label={label} min={min} max={max} step={step} value={value} formatValue={(v) => String(v)} onChange={(v) => { if (isPlaying) setPlaying(false); onChange(v); }} showValue showRangeLabels />
    </div>
  );
}
