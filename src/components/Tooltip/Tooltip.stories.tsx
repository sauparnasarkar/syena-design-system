import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Icon } from '../Icon/Icon';
import { Modal } from '../Modal/Modal';
import { Tooltip, type TooltipProps } from './Tooltip';

const meta: Meta<typeof Tooltip> = { title: 'Overlays/Tooltip', component: Tooltip, parameters: { layout: 'centered' } };
export default meta;
type Story = StoryObj<typeof Tooltip>;

const label = 'The share of items that are complete, over the whole period.';
// A plain element, not a component: the tooltip puts its handlers on the element it is given.
const info = (name = 'About completion') => <button type="button" aria-label={name} style={{ display: 'inline-grid', padding: 'var(--syn-space-1)', border: 0, background: 'transparent', color: 'var(--syn-color-text-secondary)' }}><Icon name="info" size="small" /></button>;
const Demo = (props: Partial<TooltipProps>) => <div style={{ padding: 'var(--syn-space-9)' }}><Tooltip label={label} delay={0} {...props}>{info()}</Tooltip></div>;

const bubble = () => document.body.querySelector<HTMLElement>('[role="tooltip"]')!;

export const HoverOpensAndLeavingCloses: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await expect(bubble()).not.toBeVisible();
    await userEvent.hover(trigger);
    await waitFor(() => expect(bubble()).toBeVisible());
    await expect(bubble()).toHaveTextContent(label);
    await userEvent.unhover(trigger);
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const FocusOpensAtOnceAndBlurCloses: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button', { name: 'About completion' })).toHaveFocus();
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.tab();
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const EscapeClosesAndFocusStaysOnTheTrigger: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.tab();
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(bubble()).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

export const TheTriggerIsDescribedByTheBubbleNotNamedByIt: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await expect(trigger).toHaveAccessibleDescription(label);
    await expect(bubble()).toHaveAttribute('role', 'tooltip');
    await expect(trigger.getAttribute('aria-describedby')).toBe(bubble().id);
  },
};

export const ThePointerCanMoveOntoTheBubbleWithoutClosingIt: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.hover(trigger);
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.unhover(trigger);
    await userEvent.hover(bubble());
    await new Promise((resolve) => setTimeout(resolve, 250));
    await expect(bubble()).toBeVisible();
    await userEvent.unhover(bubble());
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const OnTouchATapOpensAndTheNextTapCloses: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const ItFlipsToTheOtherSideWhereThereIsNoRoom: Story = {
  render: () => (
    <Tooltip label={label} delay={0} placement="top"><button type="button" aria-label="Near the top" style={{ position: 'fixed', top: 0, left: 'var(--syn-space-5)' }}>Top</button></Tooltip>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button', { name: 'Near the top' })).toHaveFocus();
    await waitFor(() => expect(bubble().parentElement!).toHaveAttribute('data-syn-side', 'bottom'));
    await expect(bubble().getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  },
};

export const AnExistingDescriptionIsKept: Story = {
  render: () => (
    <div style={{ padding: 'var(--syn-space-9)' }}>
      <p id="own-description">Already described.</p>
      <Tooltip label={label} delay={0}><button type="button" aria-describedby="own-description">Term</button></Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Term' });
    await expect(trigger.getAttribute('aria-describedby')).toContain('own-description');
    await expect(trigger).toHaveAccessibleDescription(`Already described. ${label}`);
  },
};

const Gallery = () => (
  <div style={{ display: 'flex', gap: 'var(--syn-space-9)', padding: 'var(--syn-space-9)' }}>
    {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
      <Tooltip key={side} label={`Placed ${side}`} placement={side} delay={0}>{info(`About ${side}`)}</Tooltip>
    ))}
  </div>
);
const openFirst: Story['play'] = async ({ canvasElement }) => {
  await userEvent.tab();
  await expect(within(canvasElement).getByRole('button', { name: 'About top' })).toHaveFocus();
  await waitFor(() => expect(document.body.querySelector<HTMLElement>(':not([hidden]) > [role="tooltip"]')).not.toBeNull());
};
export const AllStates: Story = { render: () => <Gallery />, play: openFirst };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' }, play: openFirst };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' }, play: openFirst };

export const EverySideIsPlacedAgainstItsTrigger: Story = {
  render: () => <Gallery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      const trigger = canvas.getByRole('button', { name: `About ${side}` });
      await userEvent.hover(trigger);
      const tip = await waitFor(() => { const el = document.body.querySelector<HTMLElement>(':not([hidden]) > [role="tooltip"]'); if (!el) throw new Error('not open'); return el; });
      const box = tip.getBoundingClientRect();
      const anchor = trigger.getBoundingClientRect();
      await expect(tip.parentElement!.getAttribute('data-syn-side')).toBe(side);
      if (side === 'top') await expect(box.bottom).toBeLessThanOrEqual(anchor.top);
      if (side === 'bottom') await expect(box.top).toBeGreaterThanOrEqual(anchor.bottom);
      if (side === 'left') await expect(box.right).toBeLessThanOrEqual(anchor.left);
      if (side === 'right') await expect(box.left).toBeGreaterThanOrEqual(anchor.right);
      await userEvent.unhover(trigger);
      await waitFor(() => expect(document.body.querySelector(':not([hidden]) > [role="tooltip"]')).toBeNull());
    }
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const StaysOpenWhileFocusedAfterThePointerLeaves: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.tab();
    await userEvent.hover(trigger);
    await userEvent.unhover(trigger);
    await sleep(250);
    await expect(bubble()).toBeVisible();
    await userEvent.tab();
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const StaysOpenWhileHoveredAfterFocusLeaves: Story = {
  render: () => <><Demo /><button type="button">After</button></>,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.hover(trigger);
    await userEvent.tab();
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button', { name: 'After' })).toHaveFocus();
    await sleep(150);
    await expect(bubble()).toBeVisible();
    await userEvent.unhover(trigger);
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const EscapeClosesAHoverOnlyTooltipWhereverFocusIs: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.hover(trigger);
    await waitFor(() => expect(bubble()).toBeVisible());
    await expect(trigger).not.toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(bubble()).not.toBeVisible());
    // It opens again on the next hover.
    await userEvent.unhover(trigger);
    await userEvent.hover(trigger);
    await waitFor(() => expect(bubble()).toBeVisible());
  },
};

function InADialog() {
  return (
    <Modal open title="Details" onClose={() => undefined}>
      <p style={{ padding: 'var(--syn-space-5)' }}>Completion{' '}<Tooltip label={label} delay={0}>{info('About completion')}</Tooltip></p>
    </Modal>
  );
}

export const AboveAModalItIsSeenAndUsable: Story = {
  render: () => <InADialog />,
  play: async () => {
    const trigger = await screen.findByRole('button', { name: 'About completion' });
    // Not made inert by the dialog.
    await expect(trigger.closest('[inert]')).toBeNull();
    await userEvent.hover(trigger);
    await waitFor(() => expect(bubble()).toBeVisible());
    await expect(bubble().closest('[inert]')).toBeNull();
    const box = bubble().getBoundingClientRect();
    // Above the dialog's scrim: the point at its centre belongs to the bubble.
    await expect(bubble().contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))).toBe(true);
  },
};

const bubbleWith = (text: string) => [...document.body.querySelectorAll<HTMLElement>('[role="tooltip"]')].find((el) => el.textContent?.startsWith(text))!;

function BackgroundAndDialog() {
  return (
    <div style={{ padding: 'var(--syn-space-5)' }}>
      <Tooltip label="Background note" delay={0}>{info('About the page')}</Tooltip>
      <Modal open title="Details" onClose={() => undefined}>
        <Tooltip label="Dialog note" delay={0}>{info('About the dialog')}</Tooltip>
      </Modal>
    </div>
  );
}

export const OnlyTheDialogsOwnTooltipsStayLive: Story = {
  render: () => <BackgroundAndDialog />,
  play: async () => {
    await screen.findByRole('dialog', { name: 'Details' });
    // A tooltip that belongs to the page behind is inert with the rest of it; the dialog's own is live.
    await expect(bubbleWith('Background note').closest('[inert]')).not.toBeNull();
    await expect(bubbleWith('Dialog note').closest('[inert]')).toBeNull();
  },
};

export const TappingAKeyboardFocusedTriggerClosesIt: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.tab();
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(bubble()).not.toBeVisible());
  },
};

export const AfterEscapeAFreshTapReopensIt: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(bubble()).not.toBeVisible());
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(bubble()).toBeVisible());
  },
};

export const KeyboardFocusOpensItAfterAnEarlierTouch: Story = {
  render: () => <><Demo /><button type="button">After</button></>,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'About completion' });
    await userEvent.pointer({ keys: '[TouchA]', target: trigger });
    await waitFor(() => expect(bubble()).toBeVisible());
    await userEvent.tab();
    await waitFor(() => expect(bubble()).not.toBeVisible());
    await userEvent.tab({ shift: true });
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(bubble()).toBeVisible());
  },
};

export const ItsHeightIsHeldToTheRoomItWasPlacedIn: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button', { name: 'About completion' }));
    await waitFor(() => expect(bubble()).toBeVisible());
    await expect(bubble().parentElement!.style.maxHeight).not.toBe('');
  },
};

export const ItsArrowIsNotClippedAndItsTextScrollsInside: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button', { name: 'About completion' }));
    await waitFor(() => expect(bubble()).toBeVisible());
    const frame = bubble().parentElement!;
    await expect(getComputedStyle(frame).overflowX).toBe('visible');
    await expect(getComputedStyle(frame).overflowY).toBe('visible');
    await expect(getComputedStyle(bubble()).overflowY).toBe('auto');
  },
};
