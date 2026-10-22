import { cdp, page } from 'vitest/browser';

export interface Screen {
  width: number;
  height: number;
  /** The device's safe-area insets, as `env(safe-area-inset-*)` reports them. */
  insets?: { top?: number; left?: number; right?: number; bottom?: number };
}

const noInsets = { top: 0, left: 0, right: 0, bottom: 0 };

/** Resizes the story's window (and sets its safe-area insets) while the story's checks run; the screen it found comes back afterwards.
 * Only the test browser can do that; in Storybook's own window the checks are skipped rather than run at the wrong size. */
export async function withScreen(screen: Screen, run: () => Promise<void>) {
  if (!('__vitest_browser__' in globalThis)) return;
  const before = { width: window.innerWidth, height: window.innerHeight };
  await page.viewport(screen.width, screen.height);
  await cdp().send('Emulation.setSafeAreaInsetsOverride', { insets: { ...noInsets, ...screen.insets } });
  try {
    await run();
  } finally {
    await cdp().send('Emulation.setSafeAreaInsetsOverride', { insets: noInsets });
    await page.viewport(before.width, before.height);
  }
}
