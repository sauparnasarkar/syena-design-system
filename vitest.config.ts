import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        optimizeDeps: { include: ['plotly.js-basic-dist-min'] },
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
          browser: { enabled: true, headless: true, // Permanent scrollbars, as on Linux and in browsers set to always show them, so layout that a scrollbar
          // would cover is tested where it can fail. Headless mode hides them by default.
          provider: playwright({ launchOptions: { args: ['--disable-features=OverlayScrollbar'], ignoreDefaultArgs: ['--hide-scrollbars'] } }), instances: [{ browser: 'chromium' }] },
        },
      },
      {
        test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] },
      },
    ],
  },
});
