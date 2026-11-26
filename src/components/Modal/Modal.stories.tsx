import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Popover } from '../Popover/Popover';
import { withScreen } from '../storyScreen';
import { Modal, type ModalProps } from './Modal';

const meta: Meta<typeof Modal> = { title: 'Overlays/Modal', component: Modal, parameters: { layout: 'centered' } };
export default meta;
type Story = StoryObj<typeof Modal>;

function Demo(props: Partial<ModalProps> & { onCloseSpy?: () => void }) {
  const [open, setOpen] = useState(false);
  const { onCloseSpy, ...rest } = props;
  return (
    <div style={{ padding: 'var(--syn-space-5)' }}>
      <Button onClick={() => setOpen(true)}>Open details</Button>
      <Modal
        title="Item details"
        actions={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => setOpen(false)}>Save</Button></>}
        {...rest}
        open={open}
        onClose={'onClose' in props && props.onClose === undefined ? undefined : () => { onCloseSpy?.(); setOpen(false); }}
      >
        <p>Some content for the dialog.</p>
        <Button variant="ghost">An action in the body</Button>
        {props.children}
      </Modal>
    </div>
  );
}

const open = async (canvasElement: HTMLElement) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open details' }));
  return screen.findByRole('dialog', { name: 'Item details' });
};

export const OpensNamedByItsTitleWithFocusOnTheTitle: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Item details' })).toHaveFocus());
    // The page behind does not scroll while it is open.
    await expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(document.documentElement.style.overflow).not.toBe('hidden');
  },
};

export const FocusStaysInsideAndWraps: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    const d = within(dialog);
    await waitFor(() => expect(d.getByRole('heading')).toHaveFocus());
    await userEvent.tab();
    await expect(d.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await expect(d.getByRole('button', { name: 'An action in the body' })).toHaveFocus();
    await userEvent.tab();
    await expect(d.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.tab();
    await expect(d.getByRole('button', { name: 'Save' })).toHaveFocus();
    // Past the last control it wraps to the first, never to the page behind.
    await userEvent.tab();
    await expect(d.getByRole('button', { name: 'Close' })).toHaveFocus();
    // From the title, going back wraps to the last control.
    d.getByRole('heading').focus();
    await userEvent.tab({ shift: true });
    await expect(d.getByRole('button', { name: 'Save' })).toHaveFocus();
  },
};

export const EscapeClosesAndFocusReturnsToTheTrigger: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(within(canvasElement).getByRole('button', { name: 'Open details' })).toHaveFocus();
  },
};

export const ClickingTheScrimCloses: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    const scrim = dialog.previousElementSibling as HTMLElement;
    await userEvent.click(scrim);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const TheCloseButtonCloses: Story = {
  render: () => <Demo onCloseSpy={fn()} />,
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const WithoutOnCloseThereIsNoCloseButtonAndNoEscape: Story = {
  render: () => <Demo onClose={undefined} />,
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(dialog.previousElementSibling as HTMLElement);
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The footer's own buttons still close it.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const LongContentScrollsInsideWhileTheHeaderAndFooterStay: Story = {
  render: () => <Demo>{Array.from({ length: 40 }, (_, i) => <p key={i}>Paragraph {i + 1} of long content.</p>)}</Demo>,
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    const body = dialog.querySelector('footer')!.previousElementSibling as HTMLElement;
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const header = within(dialog).getByRole('heading').getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    await expect(within(dialog).getByRole('heading').getBoundingClientRect().top).toBe(header);
    await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
  },
};

export const SmallIsNarrowerThanDefault: Story = {
  render: () => <Demo size="small" />,
  play: async ({ canvasElement }) => {
    const small = (await open(canvasElement)).getBoundingClientRect().width;
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(small).toBeLessThan(window.innerWidth * 0.5);
  },
};

function Nested() {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <div style={{ padding: 'var(--syn-space-5)' }}>
      <Button onClick={() => setOuter(true)}>Open outer</Button>
      <Modal title="Outer" open={outer} onClose={() => setOuter(false)}>
        <Button onClick={() => setInner(true)}>Open inner</Button>
      </Modal>
      <Modal title="Inner" open={inner} onClose={() => setInner(false)}>Inner content.</Modal>
    </div>
  );
}

export const EscapeClosesOnlyTheTopmostOfNestedDialogs: Story = {
  render: () => <Nested />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open outer' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Open inner' }));
    await screen.findByRole('dialog', { name: 'Inner' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull());
    // The outer dialog is still open, and focus went back to the control that opened the inner one.
    await expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: 'Open inner' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(within(canvasElement).getByRole('button', { name: 'Open outer' })).toHaveFocus();
  },
};

export const OnAPhoneItIsAFullHeightSheetInsideTheInsets: Story = {
  render: () => <Demo />,
  play: ({ canvasElement }) => withScreen({ width: 390, height: 844, insets: { top: 47, bottom: 34 } }, async () => {
    const dialog = await open(canvasElement);
    const box = dialog.getBoundingClientRect();
    await expect(Math.round(box.width)).toBe(390);
    await expect(Math.round(box.height)).toBe(844);
    await expect(parseFloat(getComputedStyle(dialog).borderTopLeftRadius)).toBe(0);
    // The padding carries the insets: the title clears the notch and the footer clears the home indicator.
    await expect(parseFloat(getComputedStyle(dialog).paddingTop)).toBeGreaterThanOrEqual(47);
    await expect(parseFloat(getComputedStyle(dialog).paddingBottom)).toBeGreaterThanOrEqual(34);
    await expect(within(dialog).getByRole('heading').getBoundingClientRect().top).toBeGreaterThanOrEqual(47);
    await expect(within(dialog).getByRole('button', { name: 'Save' }).getBoundingClientRect().bottom).toBeLessThanOrEqual(844 - 34);
    // The scrim, and so the sheet, covers the whole viewport.
    await expect(box.left).toBe(0);
    await expect(box.top).toBe(0);
  }),
};

export const InLandscapeOnANotchedPhoneTheSideInsetsAreClear: Story = {
  render: () => <Demo />,
  play: ({ canvasElement }) => withScreen({ width: 932, height: 430, insets: { left: 59, right: 59, bottom: 21 } }, async () => {
    const dialog = await open(canvasElement);
    const box = dialog.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(59);
    await expect(box.right).toBeLessThanOrEqual(932 - 59);
    await expect(box.bottom).toBeLessThanOrEqual(430 - 21);
    await expect(box.top).toBeGreaterThanOrEqual(0);
  }),
};

export const TheDialogCarriesTheThemeIntoThePortal: Story = {
  render: () => <Demo />,
  globals: { theme: 'ledger' },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(dialog.closest('[data-syn-theme]')).toHaveAttribute('data-syn-theme', 'ledger');
  },
};

function Shown() {
  return (
    <Modal open title="Item details" onClose={() => undefined} actions={<><Button>Cancel</Button><Button variant="primary">Save</Button></>}>
      <p>Some content for the dialog.</p>
    </Modal>
  );
}
export const AllStates: Story = { render: () => <Shown /> };
export const AllStatesTidewater: Story = { render: () => <Shown />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Shown />, globals: { theme: 'ledger' } };

export const ThePageBehindIsInertWhileOpenAndLiveAgainAfter: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Open details' });
    await expect(canvasElement.closest('[inert]')).toBeNull();
    const dialog = await open(canvasElement);
    // Everything else in the body is inert; the dialog's own container is not.
    await expect(canvasElement.closest('[inert]')).not.toBeNull();
    await expect(dialog.closest('[inert]')).toBeNull();
    trigger.focus();
    await expect(trigger).not.toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(canvasElement.closest('[inert]')).toBeNull();
    // Live again before focus returns to the opener.
    await expect(trigger).toHaveFocus();
  },
};

export const NestedDialogsMakeTheOneBelowInertAndGiveItBack: Story = {
  render: () => <Nested />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open outer' }));
    const outer = await screen.findByRole('dialog', { name: 'Outer' });
    await expect(outer.closest('[inert]')).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: 'Open inner' }));
    const inner = await screen.findByRole('dialog', { name: 'Inner' });
    await expect(inner.closest('[inert]')).toBeNull();
    await expect(outer.closest('[inert]')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inner' })).toBeNull());
    // The outer dialog is live again; the page behind it is still inert.
    await expect(outer.closest('[inert]')).toBeNull();
    await expect(canvasElement.closest('[inert]')).not.toBeNull();
    await expect(screen.getByRole('button', { name: 'Open inner' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(canvasElement.closest('[inert]')).toBeNull();
  },
};

function Two() {
  return (
    <>
      <Modal open title="First" onClose={() => undefined}><button type="button">In first</button></Modal>
      <Modal open title="Second" onClose={() => undefined}><button type="button">In second</button></Modal>
    </>
  );
}

export const DialogsOpenedTogetherLeaveOnlyTheTopmostLive: Story = {
  render: () => <Two />,
  play: async () => {
    const first = await screen.findByRole('dialog', { name: 'First' });
    const second = await screen.findByRole('dialog', { name: 'Second' });
    await expect(second.closest('[inert]')).toBeNull();
    await expect(first.closest('[inert]')).not.toBeNull();
  },
};

function Independent() {
  const [lower, setLower] = useState(true);
  // Closed by something other than the reader (the page behind is inert, so nothing there could be pressed), while the upper dialog stays open.
  useEffect(() => {
    const timer = window.setTimeout(() => setLower(false), 200);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div style={{ padding: 'var(--syn-space-5)' }}>
      <Modal open={lower} title="Lower">Lower content.</Modal>
      <Modal open title="Upper">Upper content.</Modal>
    </div>
  );
}

export const ClosingTheLowerDialogKeepsThePageInertWhileAnotherIsOpen: Story = {
  render: () => <Independent />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Lower' })).toBeNull());
    const upper = screen.getByRole('dialog', { name: 'Upper' });
    await expect(upper.closest('[inert]')).toBeNull();
    // The page behind is still inert: the lower dialog's closing did not give it back.
    await expect(canvasElement.closest('[inert]')).not.toBeNull();
  },
};

export const ABodyChildAddedWhileOpenIsMadeInert: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    const late = document.createElement('div');
    late.textContent = 'Mounted later';
    document.body.append(late);
    await waitFor(() => expect(late).toHaveAttribute('inert'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(late).not.toHaveAttribute('inert'));
    late.remove();
  },
};

function WithAPopover() {
  return (
    <Modal open title="Details" onClose={() => undefined}>
      <Popover title="Options" trigger={(props) => <Button {...props}>Options</Button>}><p>Choose how to continue.</p></Popover>
    </Modal>
  );
}

export const APopoverOpenedInsideADialogIsLiveAndAboveTheScrim: Story = {
  render: () => <WithAPopover />,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
    const panel = await screen.findByRole('dialog', { name: 'Options' });
    await expect(panel.closest('[inert]')).toBeNull();
    await waitFor(() => expect(getComputedStyle(panel).visibility).toBe('visible'));
    const box = panel.getBoundingClientRect();
    await expect(panel.contains(document.elementFromPoint(box.left + box.width / 2, box.top + 8))).toBe(true);
  },
};
