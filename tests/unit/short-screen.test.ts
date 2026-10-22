import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { shortScreenQuery } from '../../src/lib/shortScreen';

describe('short screen', () => {
  it('is a phone turned sideways: short, and narrower than a tablet held upright', () => {
    expect(shortScreenQuery).toBe('(max-height: 500px) and (max-width: 950px)');
  });

  it('is spelled the same in every stylesheet that has its own media query for it', () => {
    for (const file of ['src/components/AnalysisBar/AnalysisBar.module.css']) {
      expect(readFileSync(file, 'utf8'), file).toContain(`@media ${shortScreenQuery}`);
    }
  });
});
