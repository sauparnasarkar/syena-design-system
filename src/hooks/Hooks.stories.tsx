import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { breakpointPx } from '../generated/tokens';
import { scrollToJumpTarget } from '../lib/scrollToJumpTarget';
import { useFocusTrap } from './useFocusTrap';
import { useIsMobile } from './useIsMobile';
import { useReducedMotion } from './useReducedMotion';
import { useWidth } from './useWidth';

const meta: Meta = { title: 'Hooks/Behaviour', parameters: { layout: 'padded' } };
export default meta;
type Story = StoryObj;

function MediaReadout() {
  const compact = useIsMobile();
  const reduced = useReducedMotion();
  return (
    <p>
      Compact: <output aria-label="Compact">{String(compact)}</output>. Reduced motion: <output aria-label="Reduced motion">{String(reduced)}</output>.
    </p>
  );
}

export const MediaQueriesFollowTheBrowser: Story = {
  render: () => <MediaReadout />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Each hook reports what the browser's own media query says now.
    await waitFor(() => expect(canvas.getByLabelText('Compact')).toHaveTextContent(String(window.matchMedia(`(max-width: ${breakpointPx.compact}px)`).matches)));
    await expect(canvas.getByLabelText('Reduced motion')).toHaveTextContent(String(window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  },
};

function WidthProbe() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [wide, setWide] = useState(true);
  return (
    <div>
      <button type="button" onClick={() => setWide((v) => !v)}>Toggle width</button>
      <div ref={ref} style={{ width: wide ? '20rem' : '10rem', maxWidth: '100%' }}>
        <output aria-label="Width">{width}</output>
      </div>
    </div>
  );
}

export const WidthFollowsTheElement: Story = {
  render: () => <WidthProbe />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByLabelText('Width').parentElement!;
    await waitFor(() => expect(Number(canvas.getByLabelText('Width').textContent)).toBe(Math.floor(box.getBoundingClientRect().width)));
    const before = Number(canvas.getByLabelText('Width').textContent);
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle width' }));
    await waitFor(() => expect(Number(canvas.getByLabelText('Width').textContent)).toBeLessThan(before));
    await expect(Number(canvas.getByLabelText('Width').textContent)).toBe(Math.floor(box.getBoundingClientRect().width));
  },
};

function Trap({ onEscape }: { onEscape: () => void }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open, () => { onEscape(); setOpen(false); });
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <button type="button">After</button>
      {open ? (
        <div ref={panel} role="dialog" aria-label="Trap" aria-modal="true" tabIndex={-1}>
          <button type="button">First</button>
          <button type="button">Last</button>
        </div>
      ) : null}
    </div>
  );
}

/** A trap whose owner re-renders while it is open (a counter inside the dialog), passing a NEW onEscape each render, as a shell does when the page it hosts changes. */
function TrapThatReRenders({ onEscape }: { onEscape: (count: number) => void }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open, () => { onEscape(count); setOpen(false); }); // closes over this render's count, so a stale handler reports an old one
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      {open ? (
        <div ref={panel} role="dialog" aria-label="Trap" aria-modal="true" tabIndex={-1}>
          <button type="button">First</button>
          <button type="button" onClick={() => setCount((c) => c + 1)}>Count {count}</button>
          <button type="button">Last</button>
        </div>
      ) : null}
    </div>
  );
}

export const FocusTrapLeavesFocusAloneWhenItsOwnerReRenders: StoryObj<{ onEscape: (count: number) => void }> = {
  args: { onEscape: fn() },
  render: (args) => <TrapThatReRenders onEscape={args.onEscape} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole('button', { name: 'Open' });
    await userEvent.click(open);
    const first = await canvas.findByRole('button', { name: 'First' });
    await waitFor(() => expect(first).toHaveFocus()); // opening takes focus: that is the trap's job
    const count = canvas.getByRole('button', { name: /^Count/ });
    await userEvent.click(count); // focus is on Count, and the owner re-renders with a new onEscape
    await expect(canvas.getByRole('button', { name: 'Count 1' })).toHaveFocus(); // a change while it is open must not move focus back to the first control
    await userEvent.click(canvas.getByRole('button', { name: 'Count 1' }));
    await expect(canvas.getByRole('button', { name: 'Count 2' })).toHaveFocus();
    await userEvent.keyboard('{Escape}'); // Escape still reaches the latest handler, and closing still gives focus back
    await expect(args.onEscape).toHaveBeenCalledTimes(1);
    await expect(args.onEscape).toHaveBeenCalledWith(2); // the handler of the latest render (count 2), not the one from when the trap opened (0)
    await waitFor(() => expect(open).toHaveFocus());
  },
};

export const FocusTrapKeepsTabInsideAndGivesFocusBack: StoryObj<{ onEscape: () => void }> = {
  args: { onEscape: fn() },
  render: (args) => <Trap onEscape={args.onEscape} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole('button', { name: 'Open' });
    await userEvent.click(open);
    const first = await canvas.findByRole('button', { name: 'First' });
    const last = canvas.getByRole('button', { name: 'Last' });
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.tab();
    await expect(last).toHaveFocus();
    // Past the last control, focus wraps to the first; before the first, to the last.
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(last).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(args.onEscape).toHaveBeenCalledOnce();
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(open).toHaveFocus();
  },
};

function Page() {
  return (
    <div>
      <div data-syn-sticky="top" style={{ position: 'sticky', top: 0, height: 'var(--syn-layout-bar-height)', background: 'var(--syn-color-surface-raised)', borderBottom: 'var(--syn-layout-border-hairline) solid var(--syn-color-border-default)' }}>Sticky bar</div>
      <div style={{ height: '150vh' }} aria-hidden="true" />
      <section id="target" aria-label="Target"><h2>Target</h2></section>
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </div>
  );
}

export const JumpLandsBelowTheStickyBarAndMovesFocus: Story = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('[data-syn-sticky="top"]') as HTMLElement;
    await expect(scrollToJumpTarget('missing')).toBe(false);
    await expect(scrollToJumpTarget('target', { reducedMotion: true })).toBe(true);
    const target = document.getElementById('target')!;
    await waitFor(() => expect(Math.abs(target.getBoundingClientRect().top - bar.getBoundingClientRect().bottom)).toBeLessThanOrEqual(1));
    // Keyboard and screen-reader users arrive there too.
    await expect(target).toHaveFocus();
    await expect(target).toHaveAttribute('tabindex', '-1');
  },
};
