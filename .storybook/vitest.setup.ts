import { beforeAll, expect } from 'vitest';

// Layout that a scrollbar can cover is only tested where scrollbars take space. The story browser is
// launched with permanent scrollbars; if that setting is lost the whole run fails here, instead of
// every layout test quietly passing against overlay scrollbars.
beforeAll(() => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll';
  document.body.appendChild(probe);
  const width = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  expect(width, 'the story browser must show permanent scrollbars (see vitest.config.ts)').toBeGreaterThan(0);
});
