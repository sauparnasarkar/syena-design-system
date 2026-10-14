import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { themes } from '../generated/tokens';
import { Text } from '../components/Text/Text';
import { SynThemeProvider, useResolvedToken, useSynTheme } from './SynThemeProvider';
import { ThemeSwitch } from './ThemeSwitch';

function Readout() {
  const { theme, choice } = useSynTheme();
  const surface = useResolvedToken('color-surface-base');
  return (
    <section aria-label="Theme readout" style={{ display: 'grid', gap: 'var(--syn-space-2)', padding: 'var(--syn-space-5)', background: 'var(--syn-color-surface-base)', color: 'var(--syn-color-text-secondary)' }}>
      <ThemeSwitch />
      <Text as="p">Theme in force: <strong data-syn-readout="theme">{theme}</strong></Text>
      <Text as="p">Choice: <strong data-syn-readout="choice">{choice}</strong></Text>
      <Text as="p">Resolved surface colour: <strong data-syn-readout="surface">{surface}</strong></Text>
    </section>
  );
}

const meta: Meta = { title: 'Theme/SynThemeProvider' };
export default meta;
type Story = StoryObj;

const text = (el: HTMLElement, key: string) => el.querySelector(`[data-syn-readout="${key}"]`)?.textContent;

export const SwitchesTheme: Story = {
  render: () => (
    <SynThemeProvider defaultChoice="night" storageKey="syn-story-switch" syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    window.localStorage.removeItem('syn-story-switch');
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    await waitFor(() => expect(text(region, 'surface')).toBe(themes.night.color.surface.base));
    await userEvent.selectOptions(canvas.getByLabelText('Theme'), 'tidewater');
    await expect(text(region, 'theme')).toBe('tidewater');
    // Resolved after layout: already the new theme's value, never the previous one.
    await expect(text(region, 'surface')).toBe(themes.tidewater.color.surface.base);
    await expect(canvasElement.querySelector('[data-syn-theme="tidewater"]')).not.toBeNull();
    await expect(window.localStorage.getItem('syn-story-switch')).toBe('tidewater');
  },
};

export const RemembersChoice: Story = {
  render: () => (
    <SynThemeProvider storageKey="syn-story-remember" syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  beforeEach: () => {
    window.localStorage.setItem('syn-story-remember', 'tidewater');
    return () => window.localStorage.removeItem('syn-story-remember');
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Theme readout' });
    await expect(text(region, 'theme')).toBe('tidewater');
    await expect(text(region, 'choice')).toBe('tidewater');
  },
};

export const ForcedTheme: Story = {
  render: () => (
    <SynThemeProvider theme="tidewater" storageKey={null} syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Theme readout' });
    await expect(text(region, 'theme')).toBe('tidewater');
    await waitFor(() => expect(text(region, 'surface')).toBe(themes.tidewater.color.surface.base));
  },
};

export const FollowsSystemPreference: Story = {
  render: () => (
    <SynThemeProvider defaultChoice="system" storageKey={null} syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Theme readout' });
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await expect(text(region, 'theme')).toBe(dark ? 'night' : 'tidewater');
  },
};
