import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { coarseStyle } from '../storyHover';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = { title: 'Feedback/EmptyState', component: EmptyState, decorators: [(Story) => <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 40rem)' }}><Story /></div>] };
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NeutralIsAStatusWithARealHeading: Story = {
  args: { title: 'No matches', message: 'Nothing fits the filters you chose. Widen them to see more.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { level: 3, name: 'No matches' })).toBeInTheDocument();
    await expect(canvasElement.querySelector('svg')).toBeNull();
  },
};

export const HeadingLevelIsChosenByTheConsumer: Story = {
  args: { title: 'Empty', headingLevel: 2 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { level: 2, name: 'Empty' })).toBeInTheDocument();
  },
};

export const CautionCarriesAnIconAndWords: Story = {
  args: { tone: 'caution', title: 'Partial data', message: 'Some sources have not reported yet.' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).not.toBeNull();
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Partial data');
  },
};

export const NegativeOffersARetryAndIsAStatusOnLoad: Story = {
  args: { tone: 'negative', title: 'Could not load', message: 'Check the connection and try again.', actions: <Button variant="primary">Try again</Button> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('svg')).not.toBeNull();
    // Not after the reader's action: announced politely.
    await expect(canvas.getByRole('status')).toBeInTheDocument();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Try again' })).toHaveFocus();
  },
};

export const NegativeAfterAnActionIsAnnouncedAtOnce: Story = {
  args: { tone: 'negative', afterAction: true, title: 'Could not save', actions: <Button>Retry</Button> },
  play: async ({ canvasElement }) => { await expect(within(canvasElement).getByRole('alert')).toBeInTheDocument(); },
};

export const ActionsRunTheirHandlers: Story = {
  args: { title: 'No saved views', message: 'Create one to see it here.', actions: <Button variant="primary" onClick={fn()}>Create a view</Button> },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Create a view' }));
  },
};

const Gallery = () => (
  <div style={{ display: 'grid', gap: 'var(--syn-space-4)' }}>
    <EmptyState title="No matches" message="Nothing fits the filters you chose." />
    <EmptyState tone="caution" title="Partial data" message="Some sources have not reported yet." />
    <EmptyState tone="negative" title="Could not load" message="Check the connection and try again." actions={<Button variant="primary">Try again</Button>} />
    <EmptyState icon="search" title="With an icon" actions={<Button>Clear filters</Button>} />
  </div>
);
export const AllStates: Story = { render: () => <Gallery /> };
export const AllStatesTidewater: Story = { render: () => <Gallery />, globals: { theme: 'tidewater' } };
export const AllStatesLedger: Story = { render: () => <Gallery />, globals: { theme: 'ledger' } };

export const ABlockMessageIsAllowed: Story = {
  args: { title: 'Nothing here', message: <><p>First paragraph.</p><p>Second paragraph.</p></> },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText(/paragraph/)).toHaveLength(2);
    await expect(canvasElement.querySelector('p p')).toBeNull();
  },
};

export const ALongActionLabelWrapsInANarrowContainer: Story = {
  render: () => (
    <div data-syn-frame style={{ width: '14rem' }}>
      <EmptyState title="Report ready" actions={<Button>Download a complete copy of the report</Button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvasElement.querySelector('[data-syn-frame]') as HTMLElement;
    const button = canvas.getByRole('button', { name: 'Download a complete copy of the report' });
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(frame.getBoundingClientRect().right + 1);
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
    await expect(button.scrollHeight).toBeLessThanOrEqual(button.clientHeight + 1);
    await expect(coarseStyle(button)?.getPropertyValue('min-height')).toContain('--syn-layout-control-height-touch');
  },
};

export const AnUnbrokenLongWordInAnActionStaysInsideItsButton: Story = {
  render: () => (
    <div data-syn-frame style={{ width: '12rem' }}>
      <EmptyState title="Report ready" actions={<Button>Donaudampfschifffahrtsgesellschaftskapitaen</Button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    const frame = canvasElement.querySelector('[data-syn-frame]') as HTMLElement;
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(frame.getBoundingClientRect().right + 1);
    await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
  },
};
