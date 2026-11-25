import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { InlineAlert } from './InlineAlert';

const meta: Meta<typeof InlineAlert> = { title: 'Feedback/InlineAlert', component: InlineAlert, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 48rem)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof InlineAlert>;

export const Default: Story = {
  args: { title: 'Specimen data', children: 'These values are generated to review layout.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Specimen data. These values are generated to review layout.');
  },
};

export const WarningIsPolite: Story = {
  args: { variant: 'warning', title: 'Scenarios, not predictions', children: 'Outcomes outside the range remain possible.' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('status')).toBeInTheDocument(); },
};

export const ErrorIsAnnouncedAtOnce: Story = {
  args: { variant: 'error', title: 'Could not load', children: 'Check the connection and try again.' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('alert')).toBeInTheDocument(); },
};

export const IconAndTextCarryTheMeaning: Story = {
  args: { variant: 'error', children: 'Something failed.' },
  play: async ({ canvasElement }) => { await expect(canvasElement.querySelector('svg')).not.toBeNull(); },
};

export const Dismissible: Story = {
  args: { variant: 'warning', children: 'Data is older than usual.', onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Dismiss' }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const AllInTidewater: Story = {
  globals: { theme: 'tidewater' },
  render: () => (<div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}><InlineAlert title="Info">Default alert.</InlineAlert><InlineAlert variant="warning" title="Warning">Warning alert.</InlineAlert><InlineAlert variant="error" title="Error">Error alert.</InlineAlert></div>),
};
export const AllInNight: Story = {
  globals: { theme: 'night' },
  render: () => (<div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}><InlineAlert title="Info">Default alert.</InlineAlert><InlineAlert variant="warning" title="Warning">Warning alert.</InlineAlert><InlineAlert variant="error" title="Error">Error alert.</InlineAlert></div>),
};

export const AllInLedger: Story = {
  globals: { theme: 'ledger' },
  render: () => (<div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}><InlineAlert title="Info">Default alert.</InlineAlert><InlineAlert variant="warning" title="Warning">Warning alert.</InlineAlert><InlineAlert variant="error" title="Error">Error alert.</InlineAlert></div>),
};

export const PagePlacementRunsEdgeToEdgeWithoutRoundedCorners: Story = {
  render: () => (
    <div data-syn-frame style={{ width: '100%' }}>
      <InlineAlert placement="page" variant="warning" title="Stale data">Figures were last updated three days ago.</InlineAlert>
      <InlineAlert title="Inline">Inside a card.</InlineAlert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = canvas.getByText(/Stale data/).closest('[role]') as HTMLElement;
    const inline = canvas.getByText(/Inline/).closest('[role]') as HTMLElement;
    await expect(getComputedStyle(page).borderTopLeftRadius).toBe('0px');
    await expect(parseFloat(getComputedStyle(inline).borderTopLeftRadius)).toBeGreaterThan(0);
    // It spans its container.
    const frame = canvasElement.querySelector('[data-syn-frame]') as HTMLElement;
    await expect(Math.round(page.getBoundingClientRect().width)).toBe(Math.round(frame.getBoundingClientRect().width));
    // The announcement is the same as for an inline alert of that variant.
    await expect(page).toHaveAttribute('role', 'status');
  },
};

export const APageErrorIsStillAnnouncedAtOnce: Story = {
  args: { placement: 'page', variant: 'error', title: 'Could not load', children: 'Try again in a moment.' },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('alert')).toBeInTheDocument(); },
};

export const ActionsFollowTheMessage: Story = {
  args: {
    placement: 'page',
    variant: 'warning',
    children: 'A newer version is available.',
    actions: (<><Button size="small" variant="secondary">Later</Button><Button size="small" variant="primary">Reload</Button></>),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');
    await expect(buttons.map((b) => b.textContent)).toEqual(['Later', 'Reload']);
    // After the message in reading order.
    const message = canvas.getByText('A newer version is available.');
    await expect(message.compareDocumentPosition(buttons[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.tab();
    await expect(buttons[0]).toHaveFocus();
  },
};

const PageGallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-3)' }}>
    <InlineAlert placement="page" title="Info">Page notice.</InlineAlert>
    <InlineAlert placement="page" variant="warning" title="Warning" actions={<Button size="small">Review</Button>}>Page warning.</InlineAlert>
    <InlineAlert placement="page" variant="error" title="Error" onDismiss={() => undefined}>Page error.</InlineAlert>
  </div>
);
export const PageInNight: Story = { render: () => <PageGallery />, globals: { theme: 'night' } };
export const PageInTidewater: Story = { render: () => <PageGallery />, globals: { theme: 'tidewater' } };
export const PageInLedger: Story = { render: () => <PageGallery />, globals: { theme: 'ledger' } };
