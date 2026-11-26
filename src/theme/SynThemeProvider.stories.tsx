import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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

const optionLabels = (canvasElement: HTMLElement) => [...within(canvasElement).getByLabelText('Theme').querySelectorAll('option')].map((o) => o.textContent);

export const OffersTheNightAndLedgerPair: Story = {
  render: () => (
    <SynThemeProvider themes={['night', 'ledger']} defaultChoice="night" storageKey="syn-story-pair" syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    window.localStorage.removeItem('syn-story-pair');
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    // The switch lists the pair and nothing else.
    await expect(optionLabels(canvasElement)).toEqual(['System', 'Night', 'Ledger']);
    await userEvent.selectOptions(canvas.getByLabelText('Theme'), 'ledger');
    await expect(text(region, 'theme')).toBe('ledger');
    await expect(text(region, 'surface')).toBe(themes.ledger.color.surface.base);
    await expect(canvasElement.querySelector('[data-syn-theme="ledger"]')).not.toBeNull();
    await expect(window.localStorage.getItem('syn-story-pair')).toBe('ledger');
  },
};

export const OffersTheNightAndLedgerPairInLedger: Story = { ...OffersTheNightAndLedgerPair, globals: { theme: 'ledger' } };

export const AStoredThemeThatIsNotOfferedIsIgnored: Story = {
  render: () => (
    <SynThemeProvider themes={['night', 'ledger']} storageKey="syn-story-ignored" syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  beforeEach: () => {
    window.localStorage.setItem('syn-story-ignored', 'tidewater');
    return () => window.localStorage.removeItem('syn-story-ignored');
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Theme readout' });
    // Treated as if nothing was stored, and neither read nor rewritten until the reader chooses.
    await expect(text(region, 'choice')).toBe('system');
    await expect(window.localStorage.getItem('syn-story-ignored')).toBe('tidewater');
    await userEvent.selectOptions(within(canvasElement).getByLabelText('Theme'), 'night');
    await expect(window.localStorage.getItem('syn-story-ignored')).toBe('night');
  },
};

export const SystemFollowsThePreferenceWithinThePair: Story = {
  render: () => (
    <SynThemeProvider themes={['night', 'ledger']} defaultChoice="system" storageKey={null} syncDocument={false}>
      <Readout />
    </SynThemeProvider>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'Theme readout' });
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await expect(text(region, 'theme')).toBe(dark ? 'night' : 'ledger');
  },
};

function ChangingPair() {
  const [ledger, setLedger] = useState(false);
  return (
    <SynThemeProvider themes={ledger ? ['night', 'ledger'] : ['night', 'tidewater']} defaultChoice="night" storageKey="syn-story-change" syncDocument={false}>
      <button type="button" onClick={() => setLedger(true)}>Offer ledger</button>
      <Readout />
    </SynThemeProvider>
  );
}

export const ChangingThePairAppliesAValidDefault: Story = {
  render: () => <ChangingPair />,
  beforeEach: () => {
    window.localStorage.setItem('syn-story-change', 'tidewater');
    return () => window.localStorage.removeItem('syn-story-change');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    await expect(text(region, 'choice')).toBe('tidewater');
    await userEvent.click(canvas.getByRole('button', { name: 'Offer ledger' }));
    // Tidewater is no longer offered: the default (night) is in force, not system.
    await waitFor(() => expect(text(region, 'choice')).toBe('night'));
    await expect(text(region, 'theme')).toBe('night');
  },
};

function PairAndStorage() {
  const [pair, setPair] = useState<['night', 'ledger'] | ['night', 'tidewater']>(['night', 'ledger']);
  return (
    <>
      <button type="button" onClick={() => setPair(['night', 'tidewater'])}>Offer tidewater</button>
      <SynThemeProvider themes={pair} defaultChoice="night" storageKey="syn-story-restore" syncDocument={false}>
        <Readout />
      </SynThemeProvider>
    </>
  );
}

export const AStoredChoiceThatBecomesOfferedIsUsed: Story = {
  render: () => <PairAndStorage />,
  beforeEach: () => {
    window.localStorage.setItem('syn-story-restore', 'tidewater');
    return () => window.localStorage.removeItem('syn-story-restore');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    // Not on offer at first: ignored, and the default applies.
    await expect(text(region, 'choice')).toBe('night');
    await userEvent.click(canvas.getByRole('button', { name: 'Offer tidewater' }));
    // Now on offer: the stored choice applies.
    await waitFor(() => expect(text(region, 'choice')).toBe('tidewater'));
  },
};

function ReusedForAnotherProduct() {
  const [key, setKey] = useState('syn-story-product-a');
  return (
    <>
      <button type="button" onClick={() => setKey('syn-story-product-b')}>Switch product</button>
      <SynThemeProvider themes={['night', 'tidewater']} defaultChoice="night" storageKey={key} syncDocument={false}>
        <Readout />
      </SynThemeProvider>
    </>
  );
}

export const AChoiceMadeForOneProductDoesNotOverrideAnotherProductsStoredOne: Story = {
  render: () => <ReusedForAnotherProduct />,
  beforeEach: () => {
    window.localStorage.removeItem('syn-story-product-a');
    window.localStorage.setItem('syn-story-product-b', 'tidewater');
    return () => { window.localStorage.removeItem('syn-story-product-a'); window.localStorage.removeItem('syn-story-product-b'); };
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    await userEvent.selectOptions(canvas.getByLabelText('Theme'), 'night');
    await expect(text(region, 'choice')).toBe('night');
    // Product B stored tidewater: that is what it shows, not product A's choice.
    await userEvent.click(canvas.getByRole('button', { name: 'Switch product' }));
    await waitFor(() => expect(text(region, 'choice')).toBe('tidewater'));
  },
};

function RoundTrip() {
  const [key, setKey] = useState('syn-story-blocked-a');
  return (
    <>
      <button type="button" onClick={() => setKey('syn-story-blocked-b')}>To B</button>
      <button type="button" onClick={() => setKey('syn-story-blocked-a')}>To A</button>
      <SynThemeProvider themes={['night', 'tidewater']} defaultChoice="system" storageKey={key} syncDocument={false}>
        <Readout />
      </SynThemeProvider>
    </>
  );
}

export const AChoiceSurvivesAnAToBToARoundTripWithoutStorage: Story = {
  render: () => <RoundTrip />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    window.localStorage.removeItem('syn-story-blocked-a');
    window.localStorage.removeItem('syn-story-blocked-b');
    // Storage is blocked: nothing can be written, so the session is the only place a choice lives.
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    try {
      await userEvent.selectOptions(canvas.getByLabelText('Theme'), 'night');
      await userEvent.click(canvas.getByRole('button', { name: 'To B' }));
      await userEvent.selectOptions(canvas.getByLabelText('Theme'), 'tidewater');
      await userEvent.click(canvas.getByRole('button', { name: 'To A' }));
      // A's own choice is still held for the session.
      await waitFor(() => expect(text(region, 'choice')).toBe('night'));
    } finally {
      Storage.prototype.setItem = write;
    }
  },
};

function NullAndNamedKey() {
  const [key, setKey] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setKey('null')}>Use the key named null</button>
      <SynThemeProvider themes={['night', 'tidewater']} defaultChoice="night" storageKey={key} syncDocument={false}>
        <Readout />
      </SynThemeProvider>
    </>
  );
}

export const NoStorageAndAKeyNamedNullAreDifferentKeys: Story = {
  render: () => <NullAndNamedKey />,
  beforeEach: () => {
    window.localStorage.setItem('null', 'tidewater');
    return () => window.localStorage.removeItem('null');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Theme readout' });
    // A choice made with remembering turned off ...
    await userEvent.selectOptions(canvas.getByLabelText('Theme'), 'night');
    await userEvent.click(canvas.getByRole('button', { name: 'Use the key named null' }));
    // ... is not carried into a product whose key is the string "null": that product shows what it stored.
    await waitFor(() => expect(text(region, 'choice')).toBe('tidewater'));
  },
};
