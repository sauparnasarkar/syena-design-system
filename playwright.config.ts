import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  use: { baseURL: 'http://localhost:6008' },
  projects: [
    { name: 'wide', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 800 } } },
  ],
  webServer: { command: 'node scripts/serve-static.mjs storybook-static 6008', url: 'http://localhost:6008/index.json', reuseExistingServer: !process.env.CI },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
});
