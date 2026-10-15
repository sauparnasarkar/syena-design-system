import { defineConfig, type TestProjectConfiguration } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

// The layout checks that a scrollbar can cover run a second time in a browser whose scrollbars float over the content and
// are drawn by the grid itself (the default headless browser), since the grid lays them out differently there. It is a
// separate run (`npm run test:overlay`): two browser projects in one run can deadlock.
const floating = process.env.SYN_OVERLAY === '1';

const permanent = {
  extends: true,
  optimizeDeps: { include: ['plotly.js-basic-dist-min'] },
  plugins: [storybookTest({ configDir: '.storybook' })],
  test: {
    name: 'storybook',
    setupFiles: ['.storybook/vitest.setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      // Permanent scrollbars, as on Linux and in browsers set to always show them, so layout that a scrollbar
      // would cover is tested where it can fail. Headless mode hides them by default.
      provider: playwright({ launchOptions: { args: ['--disable-features=OverlayScrollbar'], ignoreDefaultArgs: ['--hide-scrollbars'] } }),
      instances: [{ browser: 'chromium' }],
    },
  },
};

const overlay = {
  extends: true,
  optimizeDeps: { include: ['plotly.js-basic-dist-min'] },
  plugins: [storybookTest({ configDir: '.storybook', tags: { include: ['both-scrollbar-modes'], exclude: [], skip: [] } })],
  test: {
    name: 'storybook-overlay',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  },
};

export default defineConfig({
  test: {
    projects: (floating
      ? [overlay]
      : [permanent, { test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] } }]) as TestProjectConfiguration[],
  },
});
