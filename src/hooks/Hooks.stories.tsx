import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { breakpointPx } from '../generated/tokens';
import { scrollToJumpTarget } from '../lib/scrollToJumpTarget';
import { useFocusTrap } from './useFocusTrap';
import { useScrollLock } from './useScrollLock';
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

function NestedTraps({ log }: { log: string[] }) {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  const outerPanel = useRef<HTMLDivElement>(null);
  const innerPanel = useRef<HTMLDivElement>(null);
  useFocusTrap(outerPanel, outer, () => { log.push('outer'); setOuter(false); });
  useFocusTrap(innerPanel, inner, () => { log.push('inner'); setInner(false); });
  return (
    <div>
      <button type="button" onClick={() => setOuter(true)}>Open outer</button>
      {outer ? (
        <div ref={outerPanel} role="dialog" aria-label="Outer" tabIndex={-1}>
          <button type="button" onClick={() => setInner(true)}>Open inner</button>
          <button type="button">Outer last</button>
        </div>
      ) : null}
      {inner ? (
        <div ref={innerPanel} role="dialog" aria-label="Inner" tabIndex={-1}>
          <button type="button">Inner first</button>
          <button type="button">Inner last</button>
        </div>
      ) : null}
    </div>
  );
}

export const OnlyTheTopmostTrapAnswersTheKeyboard: Story = {
  render: () => <NestedTraps log={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open outer' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Open inner' }));
    await expect(canvas.getByRole('button', { name: 'Inner first' })).toHaveFocus();
    // Tab wraps inside the inner trap, not the outer one.
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole('button', { name: 'Inner last' })).toHaveFocus();
    // One Escape closes the inner trap only; the outer stays, and focus returns to what opened the inner one.
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('dialog', { name: 'Inner' })).toBeNull();
    await expect(canvas.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Open inner' })).toHaveFocus();
  },
};

function TwoLockedPanels() {
  const first = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLDivElement>(null);
  useScrollLock(first, true);
  useScrollLock(second, true);
  const tall = { height: '6rem', overflowY: 'auto' } as const;
  return (
    <div>
      <div ref={first} aria-label="First panel" role="group" style={tall}><div style={{ height: '30rem' }}>First content</div></div>
      <div ref={second} aria-label="Second panel" role="group" style={tall}><div style={{ height: '30rem' }}>Second content</div></div>
      <p>Outside</p>
    </div>
  );
}

export const EveryLockedPanelMayScrollOnTouch: Story = {
  render: () => <TwoLockedPanels />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const drag = (target: Element) => {
      const touch = (y: number) => new Touch({ identifier: 1, target, clientX: 10, clientY: y });
      document.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(100)], bubbles: true }));
      const move = new TouchEvent('touchmove', { touches: [touch(80)], bubbles: true, cancelable: true });
      target.dispatchEvent(move);
      return move.defaultPrevented;
    };
    // A finger moving up scrolls the panel down: allowed in each locked panel, not only the first to ask for the lock.
    await expect(drag(canvas.getByText('First content'))).toBe(false);
    await expect(drag(canvas.getByText('Second content'))).toBe(false);
    await expect(drag(canvas.getByText('Outside'))).toBe(true);
  },
};

function TrapWithAHiddenLastControl() {
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useFocusTrap(box, on);
  return (
    <div>
      <button type="button" onClick={() => setOn(true)}>Open</button>
      {on ? (
        <div ref={box} role="dialog" aria-label="Trap">
          <h2 tabIndex={-1}>Title</h2>
          <button type="button">First</button>
          <button type="button">Last visible</button>
          <fieldset disabled><button type="button">In a disabled group</button></fieldset>
          <div hidden><button type="button">Hidden</button></div>
        </div>
      ) : null}
    </div>
  );
}

export const AControlInHiddenContentIsNotATabStop: Story = {
  render: () => <TrapWithAHiddenLastControl />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }));
    canvas.getByRole('heading', { name: 'Title' }).focus();
    // Back from the title wraps to the last control that can be reached, not to one that is hidden.
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole('button', { name: 'Last visible' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'First' })).toHaveFocus();
  },
};
