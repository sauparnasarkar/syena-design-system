import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
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
