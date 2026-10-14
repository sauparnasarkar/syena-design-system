import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { gridParams, gridTokenNames, type GridTokens } from './params';
import { ThemedGrid } from './ThemedGrid';

const kebab = (name: string) => name.replace(/([A-Z])/g, '-$1').replace(/(\d+)/g, '-$1-').replace(/-+/g, '-').replace(/-$/, '').toLowerCase();
const COLOUR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

const meta: Meta = { title: 'Grid/Theme coverage', parameters: { layout: 'padded' } };
export default meta;

const render = () => <ThemedGrid rowData={[{ a: 1 }]} columnDefs={[{ field: 'a' }]} ariaLabel="Coverage check" height={120} />;

async function audit(canvasElement: HTMLElement) {
  await waitFor(() => expect(canvasElement.querySelector('.ag-root-wrapper')).not.toBeNull());
  const wrapper = canvasElement.querySelector('.ag-root-wrapper') as HTMLElement;
  const grid = getComputedStyle(wrapper);
  const agVars = new Map<string, string>();
  for (const n of grid) if (n.startsWith('--ag-')) agVars.set(n, grid.getPropertyValue(n).trim());

  // Every parameter we set reaches the grid (a misspelled name would be ignored silently).
  const fake = Object.fromEntries(gridTokenNames.map((n) => [n, ''])) as GridTokens;
  const missing = Object.keys(gridParams(fake, () => 0)).filter((p) => !agVars.has(`--ag-${kebab(p)}`));

  // Every colour the grid declares is a token value or built from token values.
  const themed = canvasElement.closest('[data-syn-theme]') ?? document.documentElement;
  const tokenStyle = getComputedStyle(themed);
  const tokenColours = new Set<string>();
  for (const n of tokenStyle) if (n.startsWith('--syn-')) for (const c of tokenStyle.getPropertyValue(n).match(COLOUR) ?? []) tokenColours.add(c.toLowerCase());
  const strangers = [...agVars].filter(([, v]) => (v.match(COLOUR) ?? []).some((c) => !tokenColours.has(c.toLowerCase()) && !/^rgba\(0, 0, 0, 0\)$/i.test(c)));
  return { missing, strangers: strangers.map(([k, v]) => `${k}: ${v}`) };
}

export const EveryParameterApplied: StoryObj = {
  render,
  play: async ({ canvasElement }) => {
    const { missing } = await audit(canvasElement);
    await expect(missing).toEqual([]);
  },
};

export const NoDefaultColourOrShadowNight: StoryObj = {
  render,
  globals: { theme: 'night' },
  play: async ({ canvasElement }) => {
    const { strangers } = await audit(canvasElement);
    await expect(strangers).toEqual([]);
  },
};

export const NoDefaultColourOrShadowTidewater: StoryObj = {
  render,
  globals: { theme: 'tidewater' },
  play: async ({ canvasElement }) => {
    const { strangers } = await audit(canvasElement);
    await expect(strangers).toEqual([]);
  },
};
