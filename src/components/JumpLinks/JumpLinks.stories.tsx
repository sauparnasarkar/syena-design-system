import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { JumpLinks } from './JumpLinks';

const items = [{ id: 'trend', label: 'Trend' }, { id: 'composition', label: 'Composition' }, { id: 'comparison', label: 'Comparison' }];

function Page() {
  const [active, setActive] = useState('trend');
  return (
    <div>
      <div data-syn-sticky="top" style={{ position: 'sticky', top: 0, background: 'var(--syn-color-surface-raised)', padding: 'var(--syn-space-2) var(--syn-space-4)' }}>
        <JumpLinks items={items} activeId={active} onSelect={setActive} />
      </div>
      {items.map((item) => (
        <section key={item.id} id={item.id} aria-label={item.label} style={{ minHeight: '80vh', padding: 'var(--syn-space-5)' }}>
          <h2>{item.label}</h2>
        </section>
      ))}
    </div>
  );
}

const meta: Meta<typeof JumpLinks> = { title: 'Shell/JumpLinks', component: JumpLinks, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof JumpLinks>;

export const ScrollsAndMovesFocus: Story = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Trend' })).toHaveAttribute('aria-current', 'location');
    await userEvent.click(canvas.getByRole('link', { name: 'Comparison' }));
    await expect(canvas.getByRole('link', { name: 'Comparison' })).toHaveAttribute('aria-current', 'location');
    await waitFor(() => expect(document.getElementById('comparison')).toHaveFocus());
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(100));
    // The section lands below the sticky bar, not under it.
    const bar = canvasElement.querySelector('[data-syn-sticky="top"]')!.getBoundingClientRect().bottom;
    await waitFor(() => expect(document.getElementById('comparison')!.getBoundingClientRect().top).toBeGreaterThanOrEqual(bar - 1));
    window.scrollTo(0, 0);
  },
};

export const Tidewater: Story = { render: () => <Page />, globals: { theme: 'tidewater' } };
