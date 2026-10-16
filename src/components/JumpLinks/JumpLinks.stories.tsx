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

function OpensFirst() {
  const [open, setOpen] = useState(false);
  const list = [
    { id: 'top', label: 'Top' },
    { id: 'near', label: 'Near the top', topSection: true },
    { id: 'hidden', label: 'In a closed panel', onBeforeJump: () => setOpen(true) },
  ];
  return (
    <div>
      <div data-syn-sticky="top" style={{ position: 'sticky', top: 0, background: 'var(--syn-color-surface-raised)', padding: 'var(--syn-space-2) var(--syn-space-4)' }}>
        <JumpLinks items={list} />
      </div>
      <section id="top" aria-label="Top" style={{ padding: 'var(--syn-space-4)' }}><h2>Top</h2></section>
      <section id="near" aria-label="Near the top" style={{ padding: 'var(--syn-space-4)' }}><h2>Near the top</h2></section>
      <div style={{ height: '120vh' }} aria-hidden="true" />
      <section id="hidden" aria-label="In a closed panel" style={{ padding: 'var(--syn-space-4)' }}>
        <h2>In a closed panel</h2>
        {open ? <div style={{ height: '40vh' }}>Opened by the jump</div> : null}
      </section>
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </div>
  );
}

export const WaitsForTheCallbackThenJumps: Story = {
  render: () => <OpensFirst />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.textContent).not.toContain('Opened by the jump');
    await userEvent.click(canvas.getByRole('link', { name: 'In a closed panel' }));
    // The callback ran first, so the opened content is there when the page scrolls, and the section is in place and focused.
    await waitFor(() => expect(canvasElement.textContent).toContain('Opened by the jump'));
    await waitFor(() => expect(document.getElementById('hidden')).toHaveFocus());
    const bar = canvasElement.querySelector('[data-syn-sticky="top"]')!.getBoundingClientRect().bottom;
    await waitFor(() => expect(Math.abs(document.getElementById('hidden')!.getBoundingClientRect().top - bar)).toBeLessThanOrEqual(2), { timeout: 4000 });
    window.scrollTo(0, 0);
  },
};

export const SectionsAlreadyInViewNextToTheTopStayPut: Story = {
  render: () => <OpensFirst />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    window.scrollTo(0, 0);
    // The first item, and an item marked as a top section, are fully in view: the page does not move, focus does.
    await userEvent.click(canvas.getByRole('link', { name: 'Near the top' }));
    await waitFor(() => expect(document.getElementById('near')).toHaveFocus());
    await new Promise((r) => setTimeout(r, 400));
    await expect(window.scrollY).toBe(0);
    await userEvent.click(canvas.getByRole('link', { name: 'Top' }));
    await waitFor(() => expect(document.getElementById('top')).toHaveFocus());
    await expect(window.scrollY).toBe(0);
  },
};

export const Tidewater: Story = { render: () => <Page />, globals: { theme: 'tidewater' } };
