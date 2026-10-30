import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { MultiSelect } from '../MultiSelect/MultiSelect';
import { Popover } from './Popover';

const countries = ['Brazil', 'China', 'Germany', 'India', 'Indonesia', 'Japan', 'United States'].map((c) => ({ value: c, label: c }));

function Demo({ align = 'start', side = 'bottom' }: { align?: 'start' | 'end'; side?: 'bottom' | 'right' | 'top' | 'left' }) {
  const [chosen, setChosen] = useState<string[]>(['India']);
  return (
    <div style={{ display: 'flex', gap: 'var(--syn-space-4)', alignItems: 'center', padding: 'var(--syn-space-5)' }}>
      <button type="button">Before</button>
      <Popover
        title="Settings"
        side={side}
        align={align}
        trigger={(props) => <Button variant="ghost" icon="settings" aria-label="Settings" {...props} />}
      >
        <label>
          <input type="checkbox" /> A setting
        </label>
        <MultiSelect label="Countries" options={countries} value={chosen} onChange={setChosen} maxSelected={10} />
      </Popover>
      <button type="button">After</button>
    </div>
  );
}

const meta: Meta<typeof Demo> = { title: 'Overlays/Popover', component: Demo, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof Demo>;

const trigger = (canvasElement: HTMLElement) => within(canvasElement).getByRole('button', { name: 'Settings' });
const panel = () => within(document.body).queryByRole('dialog', { name: 'Settings' });

export const OpensWithItsTriggerLinked: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toHaveAttribute('aria-controls');
    await userEvent.click(button);
    const dialog = await waitFor(() => { const d = panel(); if (!d) throw new Error('closed'); return d; });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toHaveAttribute('aria-controls', dialog.id);
    await expect(dialog).toHaveFocus();
  },
};

export const EscapeClosesAndReturnsFocus: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await userEvent.click(button);
    await waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  },
};

export const OutsidePressClosesAndTheTriggerToggles: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await userEvent.click(button);
    await waitFor(() => expect(panel()).not.toBeNull());
    // Pressing the trigger again closes it (once, not close-then-reopen).
    await userEvent.click(button);
    await waitFor(() => expect(panel()).toBeNull());
    await userEvent.click(button);
    await waitFor(() => expect(panel()).not.toBeNull());
    // Pressing elsewhere closes it and leaves focus where the press put it.
    const after = within(canvasElement).getByRole('button', { name: 'After' });
    await userEvent.click(after);
    await waitFor(() => expect(panel()).toBeNull());
    await expect(after).toHaveFocus();
  },
};

export const EscapeStaysInsideThePanel: Story = {
  play: async ({ canvasElement }) => {
    // Something around the trigger that closes on Escape (a drawer, an opened rail) must not also receive the key.
    const outer = fn();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') outer(); };
    document.addEventListener('keydown', onKey);
    try {
      await userEvent.click(trigger(canvasElement));
      await waitFor(() => expect(panel()).not.toBeNull());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(panel()).toBeNull());
      await expect(outer).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', onKey);
    }
  },
};

export const CloseButtonReturnsFocus: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await userEvent.click(button);
    await waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.click(within(panel()!).getByRole('button', { name: 'Close settings' }));
    await waitFor(() => expect(panel()).toBeNull());
    await expect(button).toHaveFocus();
  },
};

export const AnOpenListEatsEscapeFirst: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await waitFor(() => expect(panel()).not.toBeNull());
    const field = within(panel()!).getByRole('combobox', { name: /Countries/ });
    await userEvent.click(field);
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    // The list closes; the panel stays.
    await waitFor(() => expect(field).toHaveAttribute('aria-expanded', 'false'));
    await expect(panel()).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(panel()).toBeNull());
  },
};

export const StaysInTheViewportBesideATrigger: Story = {
  args: { side: 'right', align: 'end' },
  decorators: [(Story) => <div style={{ position: 'fixed', left: 0, bottom: 0 }}><Story /></div>],
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    const dialog = await waitFor(() => { const d = panel(); if (!d) throw new Error('closed'); return d; });
    await waitFor(() => expect(dialog.style.visibility).toBe('visible'));
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(0);
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const OpenTidewater: Story = {
  globals: { theme: 'tidewater' },
  args: { align: 'start' },
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await waitFor(() => expect(panel()).not.toBeNull());
  },
};
